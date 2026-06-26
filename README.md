# PRP Aviation — SR20 Flow Trainer (React + Vite + Supabase)

A public quiz over the SR20 "question-mark" flows, plus a magic-link-protected editor that writes the deck to Supabase. The quiz reads the live deck; only allow-listed editors can change it.

## What's here
- `src/components/Quiz.jsx` — the quiz (Flashcards · Order the Flow · Multiple Choice).
- `src/components/Editor.jsx` — sign-in + edit/reorder cards, **Save to cloud**.
- `src/lib/quizLogic.js` — pure question-generation logic.
- `src/lib/api.js` — Supabase reads/writes + auth.
- `src/data/cards.json` — bundled fallback deck (used if Supabase isn't configured).

## 1. Prerequisites
- [Node.js](https://nodejs.org) 18+ installed.
- A Supabase project already set up with the `cards` table, `editors` allow-list, `is_editor()`, and RLS — run `supabase_setup.sql` then `seed_cards.sql` (provided separately). See `SUPABASE_SETUP.md`.

## 2. Configure
```bash
npm install
cp .env.example .env
```
Edit `.env` with your **Project URL** and **publishable** key (Supabase → Project Settings → API Keys).

## 3. Run locally
```bash
npm run dev
```
Open the printed URL (usually http://localhost:5173).
- **Quiz** works immediately (live deck if keys are set; bundled deck otherwise).
- **Editor** → enter an allow-listed email → click the magic link in your inbox → edit → **Save to cloud**.

> Supabase magic links redirect back to your app's origin. For local dev, add `http://localhost:5173` under Supabase → **Authentication → URL Configuration → Redirect URLs**. Add your production URL there too.

## 4. Deploy (auto-publish on every push)
1. Push this folder to a **GitHub** repo.
2. On **Vercel** (or Netlify/Cloudflare Pages): **New Project → import the repo**. Framework preset auto-detects **Vite** (build `npm run build`, output `dist`).
3. Add the two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) in the host's project settings.
4. Deploy. Add your deployed URL to Supabase **Redirect URLs** (step 3 note).

From then on: editors sign in on the live site, edit, **Save to cloud**, and every viewer sees the new deck immediately — no rebuilding or re-uploading.

## Notes
- The publishable key is **public by design**; your data is protected by the Row-Level-Security policies in `supabase_setup.sql` (public read, editor-only write).
- To change who can edit: update the `editors` table (or use the domain rule) — see `SUPABASE_SETUP.md`.
- The printable PDF deck still comes from `cards.json` + `make_cards.py`; export an updated `cards.json` from the editor if you keep using the PDFs.
