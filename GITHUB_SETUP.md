# Put the app on GitHub → Vercel → Supabase

Mental model: **GitHub repo → Vercel builds & hosts → app reads Supabase via env vars.**
You connect the repo to *Vercel*, and connect *Supabase* with two environment variables + redirect URLs.

---

## 1. Create the GitHub repo

### Option A — command line (git + GitHub CLI)
```bash
cd prp-trainer                 # the unzipped project folder
git init
git add .
git commit -m "Initial commit: SR20 Flow Trainer"
gh repo create prp-sr20-trainer --private --source=. --remote=origin --push
```

### Option A2 — command line without the gh CLI
Create an empty **private** repo on github.com first (don't add a README/.gitignore — we already have them), then:
```bash
cd prp-trainer
git init
git add .
git commit -m "Initial commit: SR20 Flow Trainer"
git branch -M main
git remote add origin https://github.com/<your-username>/prp-sr20-trainer.git
git push -u origin main
```

### Option B — no command line (GitHub Desktop)
1. Install **GitHub Desktop** and sign in.
2. **File → Add local repository →** pick the `prp-trainer` folder → "create a repository here" → **Create**.
3. Enter a commit message → **Commit to main** → **Publish repository** (tick **Keep this code private**).

> `node_modules` and `.env` are git-ignored, so secrets and build junk won't be committed.

---

## 2. Connect Vercel (auto-deploys on every push)
1. Go to **vercel.com** → sign in with GitHub → **Add New → Project**.
2. **Import** the `prp-sr20-trainer` repo. Vercel auto-detects **Vite** (build `npm run build`, output `dist`) — leave defaults.
3. Expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase **publishable** key (`sb_publishable_…`; on older projects use `VITE_SUPABASE_ANON_KEY` with the legacy anon key)
4. **Deploy.** Copy the live URL (e.g. `https://prp-sr20-trainer.vercel.app`).

*(Netlify/Cloudflare Pages work the same way: import repo → add the two env vars → deploy.)*

---

## 3. Point Supabase at the app (so magic-link login works)
In Supabase → **Authentication → URL Configuration**:
- **Site URL:** your Vercel URL.
- **Redirect URLs:** add both your Vercel URL and `http://localhost:5173` (for local dev).

Make sure you've already run `supabase_setup.sql` + `seed_cards.sql` and locked down sign-ups (see `SUPABASE_SETUP.md`).

---

## From now on
- **Editing cards:** editors sign in on the live site, edit, **Save** — instantly live for everyone. No repo, no deploy.
- **Changing the app code:** `git push` → Vercel rebuilds and redeploys automatically. (No GitHub Actions needed.)

### Optional convenience
On Vercel you can add the **Supabase integration** (Project → Integrations), which can inject the Supabase URL + key for you instead of pasting them in step 2.
