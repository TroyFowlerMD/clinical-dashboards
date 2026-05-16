# Superseded Source Repository

This repository is no longer the active home for this project.

Current maintained repository:
https://github.com/TroyFowlerMD/clinical-dashboards

Live site:
https://troyfowlermd.github.io/clinical-dashboards/

This repository is preserved for historical reference. Future updates should go to the maintained repository above.

Security note: the current code no longer contains a hardcoded Gemini API key fallback. Any previously exposed key should still be revoked or rotated in Google Cloud.

---

# ASAM Clinical Dashboard

A clinical decision-support tool for ASAM Level 3.7 / 3.5 documentation.
Built for NC Medicaid / Tailored Plan authorization workflows.

> ⚠️ **PHI Notice:** Do not enter direct patient identifiers (name, DOB, MRN, full dates, addresses). Use de-identified descriptors only.

---

## Features

- ASAM 3rd Edition six-dimension assessment (D1–D6)
- Suggested risk ratings per dimension with override
- Auto-check logically linked checkboxes with rationale banners
- Inline free-text notes per checkbox
- **AI mode** — Gemini 2.0 Flash synthesizes polished clinical prose
- **Rule-based mode** — deterministic output from form data, no API required, works offline
- Auto-fallback to rule-based if Gemini is unavailable
- Generation log (48-hour expiry, one-click delete)
- P2P call script + written appeal formats
- NC Medicaid CCP 8D-4 / 8D-5 language

---

## Local Setup (Work Computer)

### Prerequisites
- [Node.js 18+](https://nodejs.org) — free, one-time install

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/asam-dashboard.git
cd asam-dashboard

# 2. Install dependencies
npm install

# 3. Set up your Gemini API key (optional — app works without it in Rule-Based mode)
cp .env.example .env.local
# Edit .env.local and add: VITE_GEMINI_API_KEY=your_key_here

# 4. Start the app
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

The app runs entirely on your machine. No data leaves your computer except Gemini API calls (when using AI mode).

### Get a free Gemini API key
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with a Google account
3. Click **Create API key**
4. Paste it into `.env.local` or directly into the Config panel in the app

---

## Hosted Deployment (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/asam-dashboard)

1. Push this repo to GitHub
2. Import into [Vercel](https://vercel.com) (free tier)
3. Add environment variable: `VITE_GEMINI_API_KEY` = your key
4. Deploy — get a permanent URL

---

## Tech Stack

- React + Vite + TypeScript
- Express (local) / Vercel serverless (hosted)
- Tailwind CSS + shadcn/ui
- Google Gemini 2.0 Flash (AI mode)
- In-memory generation log (48h expiry)

---

## NC Medicaid Reference

- **CCP 8D-4** — Level 3.7 (Medically Monitored Intensive Inpatient)
- **CCP 8D-5** — Level 3.5 (Clinically Managed High-Intensity Residential)
