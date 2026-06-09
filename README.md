# Poker Night Tracker

A web app for tracking private poker nights with friends. Built with React, TypeScript, and Vite. All data is stored locally in your browser — no login required.

## Features

- Create and manage live poker sessions
- Add players, track buy-ins and rebuys
- Cash out players and calculate profit/loss automatically
- Balance warning when buy-ins don't match cash-outs
- Session history and all-time player stats
- Export session summaries as CSV or PDF
- Dark casino-themed UI, mobile friendly

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
- jsPDF (PDF export)
- localStorage for persistence
