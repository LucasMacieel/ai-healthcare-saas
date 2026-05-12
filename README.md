# MedNotes

> AI-powered consultation note assistant for healthcare professionals

MedNotes transforms raw consultation notes into structured medical record summaries, actionable next steps, and patient-friendly email drafts — all in seconds, powered by Google Gemini.

---

## ✨ Features

- **AI-Powered Summaries** — Generates structured consultation summaries for doctor records using Gemini 2.5 Flash with real-time streaming output.
- **Specialty-Aware Prompts** — Tailored AI instructions for six medical specialties: General Practice, Cardiology, Dermatology, Neurology, Pediatrics, and Psychiatry.
- **Urgency Triage** — Supports three urgency levels (Routine, Urgent, Emergency) to contextualize AI-generated recommendations.
- **Bilingual Support (EN / PT-BR)** — Full internationalization for English and Brazilian Portuguese via [`next-i18next`](https://github.com/i18next/next-i18next) with URL-based locale routing (`/` for English, `/pt-BR` for Portuguese). The LLM system prompt adapts so AI output is generated in the selected language.
- **Patient Email Drafts** — Automatically drafts clear, patient-friendly follow-up emails from each consultation.
- **Export to PDF** — One-click PDF export of the full consultation summary via `html2pdf.js`.
- **Copy Email to Clipboard** — Extracts and copies just the patient email section with a single click.
- **Free & Open Access** — All features are available for free to authenticated users, with no subscription or paywall.
- **Authentication** — Secure sign-in and JWT-based API authorization via Clerk.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│            Next.js Frontend             │
│  pages/index.tsx   – Landing page       │
│  pages/product.tsx – Consultation app   │
└──────────────┬──────────────────────────┘
               │  POST /api  (SSE stream)
               │  Bearer JWT (Clerk)
┌──────────────▼──────────────────────────┐
│           FastAPI Backend               │
│  api/index.py  – /api endpoint          │
│  • Clerk JWT validation                 │
│  • Specialty system prompt selection    │
│  • Gemini 2.5 Flash streaming           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Google Gemini 2.5 Flash         │
│  Streaming text generation              │
└─────────────────────────────────────────┘
```

The frontend uses **Server-Sent Events (SSE)** via `@microsoft/fetch-event-source` to stream tokens from the FastAPI backend in real time. The backend validates the Clerk JWT on every request before forwarding to Gemini.

### Internationalization (i18n)

Language support is implemented via [`next-i18next`](https://github.com/i18next/next-i18next) (Pages Router API) with `i18next` and `react-i18next`.

1. **URL-based locale routing** — Next.js built-in `i18n` routing serves English at `/` and Portuguese at `/pt-BR/...`. The `NEXT_LOCALE` cookie persists the user's preference.
2. **SSG translations** — Each page uses `getStaticProps` with `serverSideTranslations` to load the correct locale's translations at build time.
3. **Language toggle** — A 🇺🇸/🇧🇷 toggle button uses `next/router` to switch locales via URL navigation.
4. **Backend integration** — The active locale (`i18n.language`) is sent as a `language` field in the API request. The backend uses language-specific system prompts and user prompt templates so the LLM generates output in the correct language.

---

## 🛠️ Tech Stack

### Frontend

| Package                         | Version | Purpose                   |
| ------------------------------- | ------- | ------------------------- |
| Next.js                         | 16.2.6  | React framework & routing |
| React                           | 19.2.4  | UI library                |
| TypeScript                      | ^5      | Type safety               |
| Tailwind CSS                    | ^4      | Styling                   |
| `@clerk/nextjs`                 | ^6.39.0 | Authentication            |
| `@microsoft/fetch-event-source` | ^2.0.1  | SSE streaming client      |
| `react-markdown`                | ^10.1.0 | Markdown rendering        |
| `remark-gfm` / `remark-breaks`  | ^4      | Markdown plugins          |
| `react-datepicker`              | ^9.1.0  | Date picker               |
| `html2pdf.js`                   | ^0.14.0 | PDF export                |
| `next-i18next`                  | latest  | Internationalization      |
| `i18next` / `react-i18next`     | latest  | i18n core & React hooks   |

### Backend

| Package              | Purpose              |
| -------------------- | -------------------- |
| FastAPI              | HTTP API framework   |
| Uvicorn              | ASGI server          |
| Pydantic             | Request validation   |
| `google-genai`       | Gemini API client    |
| `fastapi-clerk-auth` | Clerk JWT middleware |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- A [Clerk](https://clerk.com) account with a configured application
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd saas

# Install JS dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Clerk — from your Clerk dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_JWKS_URL=https://<your-clerk-domain>/.well-known/jwks.json

# Google Gemini
GEMINI_API_KEY=AIza...
```

### 3. Run the Development Servers

You need to run both the Next.js frontend and the FastAPI backend simultaneously.

**Frontend** (terminal 1):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Backend** (terminal 2):

```bash
uvicorn api.index:app --reload --port 8000
```

> **Note:** In development, Next.js proxies `/api` requests to the FastAPI server. Verify your `next.config.ts` rewrites if needed.

---

## 📁 Project Structure

```
saas/
├── api/
│   └── index.py              # FastAPI app — /api endpoint, Gemini streaming
├── components/
│   └── LanguageToggle.tsx    # 🇺🇸/🇧🇷 toggle button (uses next/router)
├── pages/
│   ├── _app.tsx              # App wrapper (Clerk + appWithTranslation)
│   ├── _document.tsx         # Custom HTML document
│   ├── index.tsx             # Landing page with feature showcase
│   └── product.tsx           # Consultation form + AI output
├── public/
│   └── locales/
│       ├── en/common.json    # English translations
│       └── pt-BR/common.json # Brazilian Portuguese translations
├── styles/                   # Global CSS
├── next-i18next.config.js    # next-i18next configuration
├── requirements.txt          # Python dependencies
├── package.json              # Node dependencies & scripts
├── next.config.ts            # Next.js configuration (with i18n)
└── tsconfig.json             # TypeScript configuration
```

---

## 🔌 API Reference

### `POST /api`

Generates a streaming consultation summary.

**Headers:**

```
Authorization: Bearer <clerk-jwt>
Content-Type: application/json
```

**Request Body:**

```json
{
  "patient_name": "Jane Doe",
  "date_of_visit": "2026-05-11",
  "specialty": "Cardiology",
  "urgency": "routine",
  "notes": "Patient presents with...",
  "language": "en"
}
```

**Supported Specialties:**

- `General Practice`
- `Cardiology`
- `Dermatology`
- `Neurology`
- `Pediatrics`
- `Psychiatry`

**Supported Urgency Levels:**

- `routine`
- `urgent`
- `emergency`

**Supported Languages:**

- `en` (English — default)
- `pt-BR` (Brazilian Portuguese)

**Response:** `text/event-stream` — SSE stream of Markdown text chunks.

**Output Format — English (`language: "en"`):**

```markdown
### Summary of visit for the doctor's records

...

### Next steps for the doctor

...

### Draft of email to patient in patient-friendly language

...
```

**Output Format — Portuguese (`language: "pt-BR"`):**

```markdown
### Resumo da consulta para os registros do médico

...

### Próximos passos para o médico

...

### Rascunho de e-mail ao paciente em linguagem acessível

...
```

---

## 🔒 Security Notes

- **Never commit `.env.local`** — it contains live API keys. It is already listed in `.gitignore`.
- All API requests are validated against Clerk's JWKS endpoint before reaching Gemini.
- The `user_id` (`creds.decoded["sub"]`) is available in the backend for auditing or rate-limiting purposes.

---

## 📦 Available Scripts

| Command         | Description                      |
| --------------- | -------------------------------- |
| `npm run dev`   | Start Next.js development server |
| `npm run build` | Build for production             |
| `npm run start` | Start production server          |
| `npm run lint`  | Run ESLint                       |

---

## 📄 License

This project is for demonstration purposes only and is not intended for clinical use.
