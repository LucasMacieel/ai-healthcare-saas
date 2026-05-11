import os
from fastapi import FastAPI, Depends  # type: ignore
from fastapi.responses import StreamingResponse  # type: ignore
from pydantic import BaseModel  # type: ignore
from fastapi_clerk_auth import ( # type: ignore
    ClerkConfig,
    ClerkHTTPBearer,
    HTTPAuthorizationCredentials,
)  # type: ignore
from google import genai  # type: ignore
from google.genai import types  # type: ignore

app = FastAPI()
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)


class Visit(BaseModel):
    patient_name: str
    date_of_visit: str
    specialty: str
    urgency: str
    notes: str
    language: str = "en"


system_prompt_en = """
You are provided with notes written by a doctor from a patient's visit.
Your job is to summarize the visit for the doctor and provide an email.
Reply with exactly three sections with the headings:
### Summary of visit for the doctor's records
### Next steps for the doctor
### Draft of email to patient in patient-friendly language
"""

system_prompt_pt = """
Você recebeu anotações feitas por um médico durante a consulta de um paciente.
Seu trabalho é resumir a consulta para o médico e redigir um e-mail para o paciente.
Responda com exatamente três seções com os títulos:
### Resumo da consulta para os registros do médico
### Próximos passos para o médico
### Rascunho de e-mail ao paciente em linguagem acessível
"""


def user_prompt_for(visit: Visit) -> str:
    if visit.language == "pt-BR":
        return f"""Crie o resumo, os próximos passos e o rascunho do e-mail para:
Nome do Paciente: {visit.patient_name}
Data da Consulta: {visit.date_of_visit}
Especialidade: {visit.specialty}
Nível de Urgência: {visit.urgency.title()}
Anotações:
{visit.notes}"""
    return f"""Create the summary, next steps and draft email for:
Patient Name: {visit.patient_name}
Date of Visit: {visit.date_of_visit}
Specialty: {visit.specialty}
Urgency Level: {visit.urgency.title()}
Notes:
{visit.notes}"""


def get_system_prompt(specialty: str, language: str = "en") -> str:
    if language == "pt-BR":
        base = system_prompt_pt.strip()
        prompts = {
            "General Practice": base,
            "Cardiology": base
            + "\n\nConcentre-se em sintomas cardíacos e saúde cardiovascular.",
            "Dermatology": base
            + "\n\nConcentre-se em condições de pele, erupções cutâneas e tratamentos dermatológicos.",
            "Neurology": base
            + "\n\nConcentre-se em exames neurológicos, reflexos e sintomas do sistema nervoso.",
            "Pediatrics": base
            + "\n\nUse linguagem adequada para crianças nas comunicações com pacientes, dirigindo-se aos pais/responsáveis.",
            "Psychiatry": base
            + "\n\nInclua considerações de saúde mental, avaliações de humor e recursos psiquiátricos.",
        }
    else:
        base = system_prompt_en.strip()
        prompts = {
            "General Practice": base,
            "Cardiology": base
            + "\n\nFocus on cardiac symptoms and cardiovascular health.",
            "Dermatology": base
            + "\n\nFocus on skin conditions, rashes, and dermatological treatments.",
            "Neurology": base
            + "\n\nFocus on neurological exams, reflexes, and nervous system symptoms.",
            "Pediatrics": base
            + "\n\nUse child-friendly language in patient communications, addressing parents/guardians.",
            "Psychiatry": base
            + "\n\nInclude mental health considerations, mood assessments, and psychiatric resources.",
        }
    return prompts.get(specialty, base)


@app.post("/api")
def consultation_summary(
    visit: Visit,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    user_prompt = user_prompt_for(visit)
    sys_prompt = get_system_prompt(visit.specialty, visit.language)

    def event_stream():
        try:
            stream = client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=sys_prompt,
                ),
            )

            for chunk in stream:
                # Gemini 2.5 thinking chunks raise ValueError on .text access
                try:
                    text = chunk.text
                except (ValueError, AttributeError):
                    continue
                if text:
                    lines = text.split("\n")
                    for line in lines[:-1]:
                        yield f"data: {line}\n\n"
                        yield "data:  \n"
                    yield f"data: {lines[-1]}\n\n"
        except Exception as e:
            yield f"data: **Error:** {e}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
