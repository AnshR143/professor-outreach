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

## Bulk Professor Seeding (Optional)

To pre-populate the database with many professors at once:

1. Go to Supabase → Authentication → Users → copy your User ID
2. Open `scripts/seed-professors.ts`
3. Set `USER_ID = "your-user-id-here"`
4. Customize `FIELDS` and `UNIVERSITIES`
5. Run:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key npx tsx scripts/seed-professors.ts
```

This will automatically fetch real professors from Semantic Scholar.

---

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** (Auth + PostgreSQL)
- **Groq** (AI — llama-3.3-70b-versatile, free tier)
- **Semantic Scholar API** (Professor discovery, free)
- **arXiv API** (Papers, free)

## Features

- 🔍 AI-powered professor discovery via Semantic Scholar
- 🤖 Groq AI email generation with tone control
- 📊 Kanban board to organize researchers
- 📈 Analytics dashboard
- 📬 Campaign tracking
- 📎 Resume PDF upload and parsing
- 🎨 Email template library (12 templates built-in)
- 📋 Activity timeline
- 🏛 Universities browser
- ⚙️ In-app API key management
