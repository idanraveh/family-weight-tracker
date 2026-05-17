# Family Weight Tracker

A simple, mobile-first family weight tracking app. Open it, pick your profile, log your weight, and see how the whole family is doing — that's it.

## Features

- Family PIN access (shareable with family members)
- Per-person profiles with starting weight and goal
- Daily weigh-in logging with delete support
- **Trend Weight** — a smooth exponential moving average (EMA) that filters out day-to-day noise
- Family progress leaderboard
- Works great on iPhone

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (Postgres + RLS)

---

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a free project, and grab your **Project URL** and **anon key** from Settings → API.

### 2. Run the schema

In the Supabase SQL editor, paste and run `supabase/schema.sql`.

Optionally seed test data with `supabase/seed.sql` (creates a family called "The Raveh Family" with PIN `1234`).

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Using the app

1. **First time?** Click "Create a new family", enter a family name and a code (e.g. `RAVEH2025`).
2. **Returning?** Enter the family code.
3. **Pick your profile** or add yourself.
4. **Log your weight** every day from the dashboard.
5. Share the family code with everyone — they enter it and add their own profiles.

---

## Trend Weight explained

Each day's Trend Weight is calculated as:

```
trend_today = 0.25 × raw_weight + 0.75 × trend_yesterday
```

This is a simple exponential moving average (alpha = 0.25). It smooths out natural day-to-day fluctuations (hydration, digestion, etc.) so you can see your real trend over time.

Only one weigh-in per day is used (the latest if you log multiple). Missing days don't break the calculation.

---

## Running tests

```bash
npm test
```

Tests cover the trend weight calculation and progress stats logic.

---

## Deployment

Deploy to [Vercel](https://vercel.com) in one click:

1. Push this repo to GitHub.
2. Connect to Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
4. Deploy.

---

> This is a simple family tracking tool, not medical advice.
