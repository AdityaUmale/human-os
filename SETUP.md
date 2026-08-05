# Get Human OS Decoder running on Supabase

## 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Pick org, name, **database password** (save it), region
3. Wait until project status is healthy

## 2. Copy `DATABASE_URL`

1. **Project Settings** (gear) → **Database**
2. **Connection string** → **URI**
3. Choose **Session mode** (port **5432**) if available — best for Prisma `db push`
4. Replace `[YOUR-PASSWORD]` with the password from step 1
5. If the password has `@`, `#`, `/`, etc., URL-encode it

Paste into `human-os-decoder/.env` as:

```bash
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

You do **not** need Supabase Auth keys for this build (login is our own phone cookie).

## 3. Full `.env` checklist

```bash
# Database
DATABASE_URL=                 # from Supabase (above)

# OpenRouter — https://openrouter.ai/keys
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-4o

# Langfuse — Project → Settings → API Keys
LANGFUSE_PUBLIC_KEY=          # pk-lf-...
LANGFUSE_SECRET_KEY=          # sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
# Exact names as shown in Langfuse prompt library:
LANGFUSE_PROMPT_HUMAN_OS_COMPILER=HUMAN OS COMPILER v1.0
LANGFUSE_PROMPT_IDENTITY_RENDERER=Identity Renderer v1.0

# App
SESSION_SECRET=               # run: openssl rand -hex 32
APP_URL=http://localhost:3000
```

| Service | What you need |
|---------|----------------|
| **Supabase** | Only `DATABASE_URL` (Postgres). No Auth/Twilio yet. |
| **OpenRouter** | API key + model that supports JSON mode |
| **Langfuse** | Public + secret key, base URL, 2 prompt names that exist in the project |
| **Local** | `SESSION_SECRET`, `APP_URL` |

## 4. Apply schema + start

```bash
cd human-os-decoder
# ensure .env is filled
npm install
npx prisma db push
npm run dev
```

Open: **http://localhost:3000/login**

## 5. Smoke test path

1. Phone: any 10 digits (e.g. `9876543210`) → Continue  
2. Birth: name, DOB, time or “don’t know”, place search, timezone  
3. **Generate My Human OS**  
4. Wait on loading screen (chart + 2 LLM calls; can take 30–120s)  
5. Map → **Identity** → open each insight  

## 6. If something fails

| Symptom | Likely cause |
|---------|----------------|
| `prisma db push` auth error | Wrong password / need Session pooler / URL-encode password |
| `Invalid server environment` | Missing env var (check message) |
| Generation fails: Langfuse prompt | Name mismatch — set `LANGFUSE_PROMPT_*` to exact titles |
| Generation fails: OpenRouter | Bad key, no credits, or model name |
| Stuck on generating forever | Check terminal logs; status may be `FAILED` with error on screen |

## 7. Optional: verify tables in Supabase

**Table Editor** should show after `db push`:

- `User`, `BirthDetails`, `AstSnapshot`, `HumanOsProfile`, `InsightRender`, `InsightFeedback`
