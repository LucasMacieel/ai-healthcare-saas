# MediNotes Pro

> AI-powered consultation note assistant for healthcare professionals

MediNotes Pro transforms raw consultation notes into structured medical record summaries, actionable next steps, and patient-friendly email drafts — all in seconds, powered by Google Gemini.

---

## ✨ Features

- **AI-Powered Summaries** — Generates structured consultation summaries for doctor records using Gemini 2.5 Flash with real-time streaming output.
- **Specialty-Aware Prompts** — Tailored AI instructions for six medical specialties: General Practice, Cardiology, Dermatology, Neurology, Pediatrics, and Psychiatry.
- **Urgency Triage** — Supports three urgency levels (Routine, Urgent, Emergency) to contextualize AI-generated recommendations.
- **Patient Email Drafts** — Automatically drafts clear, patient-friendly follow-up emails from each consultation.
- **Export to PDF** — One-click PDF export of the full consultation summary via `html2pdf.js`.
- **Copy Email to Clipboard** — Extracts and copies just the patient email section with a single click.
- **Subscription Gating** — Premium features protected behind a Clerk subscription plan (`premium_subscription`), with an embedded pricing table for upsell.
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

---

## 🛠️ Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| Next.js | 16.2.6 | React framework & routing |
| React | 19.2.4 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Styling |
| `@clerk/nextjs` | ^6.39.0 | Auth & subscription gating |
| `@microsoft/fetch-event-source` | ^2.0.1 | SSE streaming client |
| `react-markdown` | ^10.1.0 | Markdown rendering |
| `remark-gfm` / `remark-breaks` | ^4 | Markdown plugins |
| `react-datepicker` | ^9.1.0 | Date picker |
| `html2pdf.js` | ^0.14.0 | PDF export |

### Backend
| Package | Purpose |
|---|---|
| FastAPI | HTTP API framework |
| Uvicorn | ASGI server |
| Pydantic | Request validation |
| `google-genai` | Gemini API client |
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

### 3. Configure Clerk Subscription

In your Clerk dashboard:
1. Create a **plan** with the slug `premium_subscription`.
2. Enable the **Billing** feature and configure a pricing table.

The `/product` page uses `<Protect plan="premium_subscription">` — users without an active subscription see the pricing table instead.

### 4. Run the Development Servers

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
│   └── index.py          # FastAPI app — /api endpoint, Gemini streaming
├── pages/
│   ├── _app.tsx          # App wrapper (Clerk provider)
│   ├── _document.tsx     # Custom HTML document
│   ├── index.tsx         # Landing page with feature showcase
│   └── product.tsx       # Consultation form + AI output
├── styles/               # Global CSS
├── public/               # Static assets
├── requirements.txt      # Python dependencies
├── package.json          # Node dependencies & scripts
├── next.config.ts        # Next.js configuration
└── tsconfig.json         # TypeScript configuration
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
  "notes": "Patient presents with..."
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

**Response:** `text/event-stream` — SSE stream of Markdown text chunks.

**Output Format (Markdown):**
```markdown
### Summary of visit for the doctor's records
...

### Next steps for the doctor
...

### Draft of email to patient in patient-friendly language
...
```

---

## 🔒 Security Notes

- **Never commit `.env.local`** — it contains live API keys. It is already listed in `.gitignore`.
- All API requests are validated against Clerk's JWKS endpoint before reaching Gemini.
- The `user_id` (`creds.decoded["sub"]`) is available in the backend for auditing or rate-limiting purposes.

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 📄 License

This project is for demonstration purposes only and is not intended for clinical use.
