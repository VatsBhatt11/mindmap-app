# MindFlow — AI-Powered Mindmap Canvas

A FigJam-inspired infinite canvas for building mindmaps with AI. Type a prompt, get a structured visual map, approve or reject changes, and export to PDF, JPEG, or Markmap Markdown.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite, React Flow (XYFlow), Tailwind CSS, Framer Motion, TipTap, Zustand |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| AI | Groq SDK (LLaMA 3, Mixtral, Gemma) |

---

## Project Structure

```
mindmap-app/
├── backend/
│   ├── prisma/schema.prisma     # Prisma schema (Profile, Mindmap)
│   ├── src/
│   │   ├── index.js             # Express entry point
│   │   ├── lib/prisma.js        # Prisma client singleton
│   │   ├── lib/supabase.js      # Supabase admin client
│   │   ├── middleware/auth.js   # JWT auth middleware
│   │   ├── routes/              # mindmaps.js, ai.js
│   │   └── controllers/        # mindmaps.js, ai.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx              # Router + auth state
    │   ├── lib/supabase.js      # Supabase client
    │   ├── lib/api.js           # Axios client (auto-injects JWT)
    │   ├── store/useStore.js    # Zustand store
    │   ├── pages/               # AuthPage, DashboardPage, CanvasPage
    │   └── components/
    │       ├── Canvas/          # MindmapCanvas, CustomNode, useAutoLayout
    │       ├── ChatBot/         # ChatBot with approval workflow
    │       ├── Settings/        # BYOK settings modal
    │       ├── RichText/        # TipTap rich text modal
    │       └── Toolbar/         # Export (PDF, JPEG, Markdown)
    └── .env.example
```

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your **Project URL**, **Anon Key**, and **Service Role Key** from *Settings → API*
3. Copy your **Database connection string** from *Settings → Database → Connection string (Session mode)*

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL

npm install
npm run prisma:generate
npm run prisma:migrate   # Creates profiles + mindmaps tables
npm run dev              # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

npm install
npm run dev              # http://localhost:5173
```

### 4. Groq API Key

On first login, the Settings modal will open automatically. Paste your [Groq API key](https://console.groq.com/keys) — it's stored in `localStorage` only, never on the server.

---

## Features

- **Infinite canvas** — pan, zoom, minimap
- **AI generation** — describe a topic; the AI returns structured nodes/edges
- **Approval workflow** — preview changes (ghosted nodes) before committing
- **Branch expansion** — select a node, ask the AI to expand it
- **Rich text notes** — TipTap editor per node (bold, headings, code blocks, lists)
- **Auto layout** — dagre-based LR layout with one click
- **Custom colors** — 10 preset colors per node via picker
- **Auto-save** — canvas saves to Supabase 1.5 s after every change
- **Export** — Markmap-compatible Markdown, PDF, JPEG
- **BYOK** — bring your own Groq key, choose your model

---

## Environment Variables

### Backend `.env`
```
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=http://localhost:3001
```
