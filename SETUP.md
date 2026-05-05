# Professor Outreach Platform — Setup Guide

## 1. Install Dependencies

```bash
cd professor-outreach
npm install
```

## 2. Set Up Supabase (Free)

1. Go to https://supabase.com → Create a new project (free tier)
2. Once created, go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **SQL Editor → New Query**, paste the contents of `supabase/schema.sql`, and click **Run**

## 3. Set Up Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your values.

## 4. Get a Groq API Key (Free)

1. Go to https://console.groq.com/keys
2. Create an account → Create API Key
3. Add to `.env.local` as `GROQ_API_KEY=gsk_...`

## 5. Run the App

```bash
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to login.

## 6. Create Your Account

1. Go to http://localhost:3000/signup
2. Create an account
3. Complete the onboarding (interests, goals)
4. You're in!

## 7. Add Your Groq API Key (In-App)

Go to Settings → paste your Groq key → Save.

## 8. Find Researchers

Click the orange "Find Researchers" button → select your fields → hit Find!

---

## 9. Set Up Google Maps (Required for Discovery)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **Places API (Legacy)** and **Geocoding API**.
3. Create an API Key in **Credentials**.
4. Add to `.env.local` as `GOOGLE_MAPS_API_KEY=your-key-here`.

## 10. Set Up Geoapify (Free Alternative)

1. Go to [Geoapify MyProjects](https://myprojects.geoapify.com/)
2. Create a new project and copy your **API Key**.
3. Add to `.env.local` as `GEOAPIFY_API_KEY=your-key-here`.
4. This enables a robust search that is much more cost-efficient than Google.

---

## 🚀 New Feature: Internship Discovery Pipeline

The platform now includes a production-ready Google Maps pipeline for discovering local internships and companies.

### 1. Maps Data Pipeline
- **Search**: `/api/maps/search` — Finds companies via Google Places Nearby Search (paginated to 60+ results).
- **Enrichment**: `/api/maps/details` — Fetches full details, ratings, and reviews.
- **AI Analysis**: `/api/pipeline/run` — Orchestrates the full flow:
    - Scrapes company websites for emails and socials.
    - Analyzes Google Reviews using Groq/Gemini to find "opportunities" (e.g., bad website, slow service).
    - Scores leads (0-100) based on signals like rating, review count, and digital presence.

### 2. Resume Tailoring Engine
- **Endpoint**: `/api/resume/tailor`
- **Function**: Takes your uploaded resume + company context and generates:
    - 5 tailored bullet points.
    - A personalized outreach email.
    - A "Why I Fit" summary.

---

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** (Auth + PostgreSQL)
- **Groq/Gemini** (AI — LLM analysis and tailoring)
- **Google Maps API** (Places & Geocoding)
- **Semantic Scholar API** (Professor discovery)

## Features

- 📍 **Google Maps Discovery**: Find local software companies and agencies.
- 🕵️‍♂️ **Website Scraper**: Automated extraction of contact emails and social links.
- 📊 **Lead Scoring**: Smart filtering of companies based on opportunity signals.
- 📝 **Resume Tailoring**: AI-driven bullet point and outreach generation.
- 🤖 **Review Analysis**: Sentiment analysis of customer reviews to find business weaknesses.
- 🔍 **Professor Search**: Academic discovery via Semantic Scholar.
-  Kanban board, Analytics, and Activity Tracking.

---

## 🛠 Troubleshooting & Common Bugs

### 1. "INVALID_REQUEST" on Search
- **Cause**: The `next_page_token` from Google is not immediately valid.
- **Fix**: The backend already implements a 2-second sleep + retry. If it still fails, check if your API key has "Places API (Legacy)" enabled.

### 2. Website Scraper Returns No Emails
- **Cause**: Some websites are SPAs (React/Vue) that don't render content without JS, or they block scrapers.
- **Fix**: We use a custom User-Agent to appear more legitimate. For highly protected sites, a headless browser (Puppeteer) would be needed, but for MVP, regex on raw HTML covers 80% of small business sites.

### 3. Pipeline is Slow
- **Cause**: Running 20+ scrapes and AI analyses takes time.
- **Fix**: We use `mapWithLimit(5)` to process in parallel. Ensure you have a `GROQ_API_KEY` for the fastest AI responses.

### 4. Maps results are inaccurate
- **Cause**: Radius or keywords are too broad.
- **Fix**: Use specific keywords like "Software Development Agency" rather than just "tech".
