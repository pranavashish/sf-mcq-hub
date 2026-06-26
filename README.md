# SF MCQ Hub

AI-powered Salesforce scenario-based MCQ practice — 6 career levels, 10 fresh questions each session.

## Local development

```bash
npm install

# Create a .env file
echo "GROQ_API_KEY=sk-ant-YOUR_KEY_HERE" > .env

# Run dev server (Vercel CLI needed for /api functions locally)
npm install -g vercel
vercel dev
```

> Note: `npm run dev` (plain Vite) won't run the `/api/chat` function.
> Use `vercel dev` so both the React app and the serverless function run together.

## Deploy to Vercel

See the step-by-step guide in the repo or follow:

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import the repo
3. Add `GROQ_API_KEY` in Environment Variables
4. Click Deploy

## Stack

- Vite + React 18
- Vercel serverless function (`/api/chat.js`) as API proxy
- For question generation
- Tabler Icons (CDN)
- Zero external UI libraries
