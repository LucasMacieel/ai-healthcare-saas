"use client";

import Head from "next/head";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import type { GetStaticProps } from "next";
import LanguageToggle from "../components/LanguageToggle";

export default function Home() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("meta_title")}</title>
      </Head>
      <main className="min-h-screen medical-gradient flex flex-col">
        <div className="container mx-auto px-4 py-8 flex-grow">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-16 glass-card rounded-2xl px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
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
              <h1 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 tracking-tight">
                {t("app_title")}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <SignedIn>
                <UserButton
                  showName={true}
                  appearance={{
                    elements: { userButtonOuterIdentifier: { color: "white" } },
                  }}
                />
              </SignedIn>
            </div>
          </nav>

          {/* Hero Section */}
          <div className="text-center py-16 fade-in-up">
            {/* Medical Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              {t("clinical_badge")}
            </div>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              <span className="text-emerald-950 dark:text-white">
                {t("hero_title_1")}
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
                {t("hero_title_2")}
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-14 max-w-2xl mx-auto leading-relaxed">
              {t("hero_subtitle")}
            </p>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
              {/* Feature 1 */}
              <div className="fade-in-up fade-in-up-delay-1">
                <div className="glass-card rounded-2xl p-8 h-full text-left group cursor-default">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-900 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-emerald-900 dark:text-emerald-100">
                    {t("feature_summaries_title")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {t("feature_summaries_desc")}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="fade-in-up fade-in-up-delay-2">
                <div className="glass-card rounded-2xl p-8 h-full text-left group cursor-default">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-800 dark:to-teal-900 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-emerald-900 dark:text-emerald-100">
                    {t("feature_actions_title")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {t("feature_actions_desc")}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="fade-in-up fade-in-up-delay-3">
                <div className="glass-card rounded-2xl p-8 h-full text-left group cursor-default">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-800 dark:to-cyan-900 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📧</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-emerald-900 dark:text-emerald-100">
                    {t("feature_emails_title")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {t("feature_emails_desc")}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-10 rounded-2xl text-lg transition-all duration-300 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.03] active:scale-[0.98]">
                  <span className="flex items-center gap-2">
                    {t("cta_get_started")}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 transition-transform group-hover:translate-x-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/product">
                <button className="group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-10 rounded-2xl text-lg transition-all duration-300 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.03] active:scale-[0.98]">
                  <span className="flex items-center gap-2">
                    {t("cta_open_app")}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 transition-transform group-hover:translate-x-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>
              </Link>
            </SignedIn>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 text-center text-sm font-medium text-emerald-800/60 dark:text-emerald-200/60 mt-auto">
          <p>{t("footer_text")}</p>
        </footer>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
});
