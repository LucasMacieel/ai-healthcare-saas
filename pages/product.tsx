"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@clerk/nextjs";
import DatePicker from "react-datepicker";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Protect, PricingTable, UserButton } from "@clerk/nextjs";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageToggle from "../i18n/LanguageToggle";

function ConsultationForm() {
  const { getToken } = useAuth();
  const { locale, t } = useLanguage();

  // Form state
  const [patientName, setPatientName] = useState("");
  const [visitDate, setVisitDate] = useState<Date | null>(new Date());
  const [specialty, setSpecialty] = useState("General Practice");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "emergency">(
    "routine",
  );
  const [notes, setNotes] = useState("");

  // Streaming state
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleExportPDF = async () => {
    const element = document.getElementById("markdown-content");
    if (!element) return;

    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: 0.5,
      filename: "consultation_summary.pdf",
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        onclone: (clonedDoc: Document) => {
          const style = clonedDoc.createElement("style");
          style.textContent = `
                        #markdown-content, #markdown-content * {
                            color: black !important;
                            -webkit-text-fill-color: black !important;
                        }
                        @media (prefers-color-scheme: dark) {
                            #markdown-content, #markdown-content * {
                                color: black !important;
                                -webkit-text-fill-color: black !important;
                            }
                        }
                    `;
          clonedDoc.head.appendChild(style);
        },
      },
      jsPDF: {
        unit: "in" as const,
        format: "letter" as const,
        orientation: "portrait" as const,
      },
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleCopyEmail = () => {
    // Match both EN and PT-BR email section headings
    const emailPatterns = [
      "### Draft of email to patient",
      "### Rascunho de e-mail ao paciente",
    ];
    let emailSectionIndex = -1;
    for (const pattern of emailPatterns) {
      const idx = output.indexOf(pattern);
      if (idx !== -1) {
        emailSectionIndex = idx;
        break;
      }
    }
    if (emailSectionIndex !== -1) {
      const emailContent = output.substring(emailSectionIndex);
      const lines = emailContent.split("\n");
      const emailBody = lines.slice(1).join("\n").trim();
      navigator.clipboard.writeText(emailBody);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      alert(t("email_not_found"));
    }
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setOutput("");
    setLoading(true);

    const jwt = await getToken();
    if (!jwt) {
      setOutput(t("auth_required"));
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let buffer = "";

    await fetchEventSource("/api", {
      signal: controller.signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        patient_name: patientName,
        date_of_visit: visitDate?.toISOString().slice(0, 10),
        specialty,
        urgency,
        notes,
        language: locale,
      }),
      onmessage(ev) {
        buffer += ev.data;
        setOutput(buffer);
      },
      onclose() {
        setLoading(false);
      },
      onerror(err) {
        console.error("SSE error:", err);
        controller.abort();
        setLoading(false);
      },
    });
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        {t("consultation_heading")}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <div className="space-y-2">
          <label
            htmlFor="patient"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("label_patient_name")}
          </label>
          <input
            id="patient"
            type="text"
            required
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder={t("placeholder_patient_name")}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("label_date_of_visit")}
          </label>
          <DatePicker
            id="date"
            selected={visitDate}
            onChange={(d: Date | null) => setVisitDate(d)}
            dateFormat="yyyy-MM-dd"
            placeholderText={t("placeholder_date")}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="specialty"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("label_specialty")}
          </label>
          <select
            id="specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="General Practice">{t("specialty_general")}</option>
            <option value="Cardiology">{t("specialty_cardiology")}</option>
            <option value="Dermatology">{t("specialty_dermatology")}</option>
            <option value="Neurology">{t("specialty_neurology")}</option>
            <option value="Pediatrics">{t("specialty_pediatrics")}</option>
            <option value="Psychiatry">{t("specialty_psychiatry")}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="urgency"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("label_urgency")}
          </label>
          <select
            id="urgency"
            value={urgency}
            onChange={(e) =>
              setUrgency(e.target.value as "routine" | "urgent" | "emergency")
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="routine">{t("urgency_routine")}</option>
            <option value="urgent">{t("urgency_urgent")}</option>
            <option value="emergency">{t("urgency_emergency")}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("label_notes")}
          </label>
          <textarea
            id="notes"
            required
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder={t("placeholder_notes")}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          {loading ? t("btn_generating") : t("btn_generate")}
        </button>
      </form>

      {output && (
        <section className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div
            id="markdown-content"
            className="markdown-content prose prose-blue dark:prose-invert max-w-none"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {output}
            </ReactMarkdown>
          </div>
          <div className="flex justify-end space-x-4 mb-6">
            <button
              type="button"
              onClick={handleExportPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {t("btn_export_pdf")}
            </button>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isCopied ? t("btn_copied") : t("btn_copy_email")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function Product() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* User Menu and Language Toggle in Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <LanguageToggle />
        <UserButton showName={true} />
      </div>

      {/* Subscription Protection */}
      <Protect
        plan="premium_subscription"
        fallback={
          <div className="container mx-auto px-4 py-12">
            <header className="text-center mb-12">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                {t("subscription_heading")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                {t("subscription_subtitle")}
              </p>
            </header>
            <div className="max-w-4xl mx-auto">
              <PricingTable />
            </div>
          </div>
        }
      >
        <ConsultationForm />
      </Protect>
    </main>
  );
}
