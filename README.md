# Poker Night Tracker

A web app for tracking private poker nights with friends. Built with React, TypeScript, Vite, and Supabase. Sessions sync live across devices — the host runs the table on one screen while players join from their phones via QR code.

## Features

- Create and manage live poker sessions
- Add players, track buy-ins and rebuys
- Chip/cash value system with automatic conversions
- Blind structure calculator with live blind timer, pause, and level-up sound
- Players join from their phone with a QR code / join code and track their own stack
- Live sync across all devices (Supabase realtime)
- Cash out players and calculate profit/loss automatically
- Balance warning when buy-ins don't match cash-outs
- Session history and all-time player stats
- Export session summaries as CSV or PDF
- Dark casino-themed UI, mobile friendly

## Online Setup

1. Create a [Supabase](https://supabase.com) project and run `supabase/schema.sql` in the SQL Editor.
2. The Supabase URL and publishable key live in `src/lib/supabase.ts` (override with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars if needed).
3. Deploy to [Vercel](https://vercel.com) by importing this repo — `vercel.json` handles the SPA routing.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview
```

## Tech Stack

- React 19 + TypeScript
- React Router
- Vite
- Supabase (database + realtime sync)
- jsPDF (PDF export)
