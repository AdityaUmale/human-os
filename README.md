# Human OS Decoder (V1 slice)

Phone (no OTP) → Birth → Generate Human OS → Map, People, and Interactions.

## Prerequisites

1. **Supabase** project (Postgres)
2. **OpenRouter** API key
3. **Langfuse** project with Human OS Compiler, Map renderers, People renderers, and Interaction renderers
4. Node 20+

## Env variables

Copy `.env.example` → `.env` and fill:

| Variable | Where to get it | Required |
|----------|-----------------|----------|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string (URI). Use **Transaction mode** port `6543` for Vercel/runtime; use Session mode `5432` for migrations. | Yes |
| `PG_POOL_MAX` | Maximum Postgres clients per server instance. Defaults to `1` for serverless safety. | Optional |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) | Yes |
| `OPENROUTER_BASE_URL` | Default `https://openrouter.ai/api/v1` | Optional |
| `OPENROUTER_MODEL` | e.g. `openai/gpt-4o` | Optional |
| `OPENROUTER_MAX_TOKENS` | Completion token cap; defaults to `3000` for low-balance accounts | Optional |
| `LANGFUSE_PUBLIC_KEY` | Langfuse project → Settings → API Keys | Yes |
| `LANGFUSE_SECRET_KEY` | Same | Yes |
| `LANGFUSE_BASE_URL` | `https://cloud.langfuse.com` (or EU/self-host URL) | Yes |
| `LANGFUSE_PROMPT_HUMAN_OS_COMPILER` | Exact prompt name in Langfuse | Yes |
| `LANGFUSE_PROMPT_IDENTITY_RENDERER` | Exact prompt name in Langfuse | Yes |
| `SESSION_SECRET` | Random string (`openssl rand -hex 32`) | Yes |
| `APP_URL` | `http://localhost:3000` | Optional |

**Not required for this build:** Supabase Auth keys, Twilio, Google OAuth (phone session is our own cookie).

### Supabase `DATABASE_URL` tips

1. Create project → wait until healthy  
2. **Project Settings → Database**  
3. Copy **URI** under Connection string  
4. Replace `[YOUR-PASSWORD]` with the DB password you set at create time  
5. Use **Transaction mode** host/port (`6543`) for Vercel/runtime traffic. Use **Session mode** (`5432`) for `prisma db push` and other migrations.
6. If the password has special characters, URL-encode them  

Example shape:

```
postgresql://postgres.abcdefghijk:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

For a Vercel deployment, set its `DATABASE_URL` to the same Supabase pooler host on port `6543` (Transaction mode), then redeploy. The application also caps each server instance at one client by default; override `PG_POOL_MAX` only when your database pool allows it.

## Setup commands

```bash
cd human-os-decoder
cp .env.example .env
# edit .env

npm install
npx prisma db push      # creates tables on Supabase
npm run dev
```

Open **http://localhost:3000/login**

## Domains

After Human OS compile, each domain runs its Langfuse renderer (sequential). Override names in `.env`:

| Domain | Env var | Default prompt name |
|--------|---------|---------------------|
| Identity | `LANGFUSE_PROMPT_IDENTITY_RENDERER` | Identity Renderer v1.0 |
| Mind | `LANGFUSE_PROMPT_MIND_RENDERER` | Mind Renderer v1.0 |
| Emotions | `LANGFUSE_PROMPT_EMOTIONS_RENDERER` | Emotions Renderer v1.0 |
| Relationships | `LANGFUSE_PROMPT_RELATIONSHIPS_RENDERER` | Relationship Renderer v1.0 |
| Energy | `LANGFUSE_PROMPT_ENERGY_RENDERER` | Energy Renderer v1.0 |
| Work | `LANGFUSE_PROMPT_WORK_RENDERER` | Work Renderer v1.0 |
| Growth | `LANGFUSE_PROMPT_GROWTH_RENDERER` | Growth Renderer v1.0 |
| Season | `LANGFUSE_PROMPT_SEASON_RENDERER` | Season Renderer v1.0 |

Routes: `/map/{domain}` TOC · `/map/{domain}/{insight}` page · `POST /api/insights/{domain}/rerender`

Full generation can take several minutes (1 compiler + 8 renderers).

People renderers produce four insights. Love and Work Compatibility produce
three. Set the eight `LANGFUSE_PROMPT_*` People/Interaction variables to the
exact prompt names in Langfuse before generating a saved person or interaction.
Each insight costs 2 credits to unlock once; generation itself is free.

## Test checklist

1. Enter any 10-digit phone → Continue  
2. Birth details: name, DOB, time (or unknown), search place, timezone  
3. Generate My Human OS → wait for loading to finish  
4. Map → open any domain (Identity, Mind, Relationships, …)  
5. Read insights; use **Re-render** on TOC if a domain failed  
6. Submit feedback  

For the People and Interaction slice, run `npm test`, `npm run lint`, and
`npm run build` before shipping.

If generation fails: check generating-screen error (usually Langfuse prompt name or OpenRouter).

## Stack notes

- Auth: signed cookie session (no Supabase Auth / OTP yet)  
- DB: Prisma + Postgres (Supabase)  
- Chart: Swiss Ephemeris (`public/ephe`)  
- LLM: OpenRouter + Langfuse prompts  
