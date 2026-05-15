# ASAM Clinical Dashboard

A clinical decision-support tool for ASAM Level 3.7 / 3.5 documentation.
Built for NC Medicaid / Tailored Plan authorization workflows.

> **PHI Notice:** Do not enter direct patient identifiers such as name, DOB, MRN, full dates, or addresses. Use de-identified descriptors only.

## Where This App Lives

This app now lives inside the consolidated `clinical-dashboards` repo at:

```text
clinical-dashboards/asam-app
```

If you cloned the full consolidation repo, run all app commands from the `asam-app` folder.

## Features

- ASAM 3rd Edition six-dimension assessment (D1-D6)
- Suggested risk ratings per dimension with override
- Auto-check logically linked checkboxes with rationale banners
- Inline free-text notes per checkbox
- AI mode: Gemini 2.0 Flash synthesizes polished clinical prose
- Rule-based mode: deterministic output from form data, no API required, works offline
- Auto-fallback to rule-based if Gemini is unavailable
- Generation log (48-hour expiry, one-click delete)
- P2P call script + written appeal formats
- NC Medicaid CCP 8D-4 / 8D-5 language

## Local Setup (Windows)

### Prerequisites

- [Node.js 18+](https://nodejs.org) installed once on the machine

### Steps

```powershell
# 1. From the repo root, move into the app folder
cd .\asam-app

# 2. Install dependencies
npm install

# 3. Set up your Gemini API key (optional)
Copy-Item .env.example .env.local
# Edit .env.local and add: VITE_GEMINI_API_KEY=your_key_here

# 4. Start the app
npm run dev
```

Then open [http://localhost:5000](http://localhost:5000) in your browser.

The app runs on your machine. Data only leaves your computer if you choose AI mode and send content to Gemini.

### Optional Windows shortcut

From inside `asam-app`, you can also double-click `start.bat` after dependencies are installed.

### Get a free Gemini API key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with a Google account
3. Click **Create API key**
4. Paste it into `.env.local` or directly into the app's config panel

## Hosted Deployment (Vercel)

1. Push the consolidated repo to GitHub first.
2. In Vercel, import the repo and set the project root to `asam-app`.
3. Add environment variable `VITE_GEMINI_API_KEY` if you want AI mode enabled in deployment.
4. Deploy.

If the repo structure changes later, update the Vercel project root to match.

## Tech Stack

- React + Vite + TypeScript
- Express (local) / Vercel serverless (hosted)
- Tailwind CSS + shadcn/ui
- Google Gemini 2.0 Flash (AI mode)
- In-memory generation log (48h expiry)

## NC Medicaid Reference

- **CCP 8D-4**: Level 3.7 (Medically Monitored Intensive Inpatient)
- **CCP 8D-5**: Level 3.5 (Clinically Managed High-Intensity Residential)
