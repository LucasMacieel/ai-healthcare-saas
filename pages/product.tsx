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
import Link from "next/link";

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

  // Urgency badge color mapping
  const urgencyColors = {
    routine:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    urgent:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    emergency:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl fade-in-up">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-emerald-950 dark:text-emerald-50 tracking-tight">
            {t("consultation_heading")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t("consultation_subtitle")}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-8 space-y-6"
      >
        {/* Patient Name */}
        <div className="space-y-2">
          <label
            htmlFor="patient"
            className="block text-sm font-semibold text-emerald-900 dark:text-emerald-100"
          >
            {t("label_patient_name")}
          </label>
          <input
            id="patient"
            type="text"
            required
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full px-4 py-3 border border-emerald-200 dark:border-emerald-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-50 placeholder-gray-400 transition-all duration-200"
            placeholder={t("placeholder_patient_name")}
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label
            htmlFor="date"
            className="block text-sm font-semibold text-emerald-900 dark:text-emerald-100"
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
            className="w-full px-4 py-3 border border-emerald-200 dark:border-emerald-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-50 placeholder-gray-400 transition-all duration-200"
          />
        </div>

        {/* Two column: Specialty + Urgency */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="specialty"
              className="block text-sm font-semibold text-emerald-900 dark:text-emerald-100"
            >
              {t("label_specialty")}
            </label>
            <select
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-4 py-3 border border-emerald-200 dark:border-emerald-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-50 transition-all duration-200"
            >
              <option value="General Practice">
                {t("specialty_general")}
              </option>
              <option value="Cardiology">
                {t("specialty_cardiology")}
              </option>
              <option value="Dermatology">
                {t("specialty_dermatology")}
              </option>
              <option value="Neurology">
                {t("specialty_neurology")}
              </option>
              <option value="Pediatrics">
                {t("specialty_pediatrics")}
              </option>
              <option value="Psychiatry">
                {t("specialty_psychiatry")}
              </option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="urgency"
              className="block text-sm font-semibold text-emerald-900 dark:text-emerald-100"
            >
              {t("label_urgency")}
            </label>
            <select
              id="urgency"
              value={urgency}
              onChange={(e) =>
                setUrgency(e.target.value as "routine" | "urgent" | "emergency")
              }
              className="w-full px-4 py-3 border border-emerald-200 dark:border-emerald-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-50 transition-all duration-200"
            >
              <option value="routine">{t("urgency_routine")}</option>
              <option value="urgent">{t("urgency_urgent")}</option>
              <option value="emergency">{t("urgency_emergency")}</option>
            </select>
          </div>
        </div>

        {/* Urgency Badge Indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${urgencyColors[urgency]}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                urgency === "routine"
                  ? "bg-emerald-500"
                  : urgency === "urgent"
                    ? "bg-amber-500"
                    : "bg-red-500 animate-pulse"
              }`}
            ></span>
            {urgency === "routine"
              ? t("urgency_routine")
              : urgency === "urgent"
                ? t("urgency_urgent")
                : t("urgency_emergency")}
          </span>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label
            htmlFor="notes"
            className="block text-sm font-semibold text-emerald-900 dark:text-emerald-100"
          >
            {t("label_notes")}
          </label>
          <textarea
            id="notes"
            required
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-emerald-200 dark:border-emerald-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-50 placeholder-gray-400 transition-all duration-200 resize-y"
            placeholder={t("placeholder_notes")}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-emerald-400 disabled:to-teal-400 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t("btn_generating")}
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
              {t("btn_generate")}
            </>
          )}
        </button>
      </form>

      {/* Output Section */}
      {output && (
        <section className="mt-8 glass-card rounded-2xl p-8 fade-in-up">
          {/* Section header */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-emerald-100 dark:border-emerald-800">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-emerald-600 dark:text-emerald-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
              {t("generated_summary")}
            </h2>
          </div>

          <div
            id="markdown-content"
            className="markdown-content prose prose-emerald dark:prose-invert max-w-none"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {output}
            </ReactMarkdown>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-emerald-100 dark:border-emerald-800">
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                  clipRule="evenodd"
                />
              </svg>
              {t("btn_export_pdf")}
            </button>
            <button
              type="button"
              onClick={handleCopyEmail}
              className={`inline-flex items-center gap-2 font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                isCopied
                  ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                  : "bg-white dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/60 shadow-sm"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                {isCopied ? (
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                ) : (
                  <>
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </>
                )}
              </svg>
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
    <main className="min-h-screen medical-gradient">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b border-emerald-100 dark:border-emerald-800/50 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100 tracking-tight">
              {t("app_title")}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <UserButton showName={true} />
          </div>
        </div>
      </div>

      {/* Subscription Protection */}
      <Protect
        plan="premium_subscription"
        fallback={
          <div className="container mx-auto px-4 py-16 fade-in-up">
            <header className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("premium_plans")}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                <span className="text-emerald-950 dark:text-white">
                  {t("subscription_heading")}
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-xl mx-auto">
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
