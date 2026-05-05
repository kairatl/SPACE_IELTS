# SPACE IELTS (Vercel deploy)

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. In Vercel → Project → Settings → Environment Variables, add:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

4. Deploy.

## Local dev (optional)

1. Copy `.env.example` → `.env`
2. Fill in:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
3. Run:
   - `npm i`
   - `npm run dev`
4. Open:
   - `http://localhost:4173`

## Notes

- Supabase browser client loads its (public) config from `GET /api/public-config`.
- AI Writing Assistant calls `POST /api/ai` so the OpenAI key never goes to the browser.

