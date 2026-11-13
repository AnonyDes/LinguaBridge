# LinguaBridge deployment guide
**SAFINUM Innovate Challenge 2026 — Digital Financial Inclusion for Central Africa**

Use the local workspace for development and the static export for the public showcase. An API deployment needs scoped credentials and a reachable HTTPS endpoint. PostgreSQL, OpenRouter and the voice service are optional integrations.

---

## 1. Supabase PostgreSQL Setup (2 minutes)

1. Sign up or log into [supabase.com](https://supabase.com).
2. Click **New project** and name it `linguabridge` (Region: Frankfurt `eu-central-1` or closest to CEMAC).
3. In the left navigation, go to the **SQL Editor**.
4. Open the SQL file:
   [`infrastructure/migrations/supabase-init.sql`](../../infrastructure/migrations/supabase-init.sql)
5. Copy the entire file content, paste it into the Supabase SQL Editor, and click **Run**.
   - This creates all 6 tables (`tenants`, `api_keys`, `translation_memory`, `language_packs`, `translation_requests`, `speech_jobs`).
   - Configures Row Level Security (RLS) policies.
   - Automatically seeds the demo tenant, API key (`lb_demo_key_2026`), certified Ewondo pack, and core financial terminology pairs.
6. In Supabase, go to **Project Settings** > **Database** > **Connection string** > **URI**.
7. Copy the URI and set it in your environment:
   ```env
   DATABASE_URL="postgresql://postgres.[REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"
   ```

*Note: If `DATABASE_URL` is omitted, LinguaBridge automatically falls back to its high-speed in-memory L1 cache with zero failure or disruption.*

---

## 2. OpenRouter Setup (1 minute)

1. Sign up or log into [openrouter.ai](https://openrouter.ai).
2. Navigate to **Keys** > **Create Key**.
3. Copy your key and add it to `.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
   OPENROUTER_MODEL=mistralai/mistral-7b-instruct
   ENABLE_LLM_TRANSLATION=true
   ```

*Note: When target is a national language like Ewondo, LinguaBridge's certified consensus lexicon takes precedence to ensure 0% financial hallucination.*

---

## 3. Vercel 1-Click Deployment (2 minutes)

LinguaBridge comes pre-configured with `vercel.json` for Turborepo and Next.js.

1. Push your repository to GitHub: `git push -u origin main`.
2. Go to [vercel.com](https://vercel.com) and click **Add New...** > **Project**.
3. Import your repository (`LinguaBridge`).
4. In Project Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web` (or leave root with bundled `vercel.json`)
   - **Build Command**: `pnpm turbo build --filter=@linguabridge/web...`
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: URL of your deployed LinguaBridge API gateway (e.g. `https://api.yourdomain.com` or Cloud Run/Render URL).
     - `NEXT_PUBLIC_LB_WIDGET_KEY`: `lb_demo_key_2026`
5. Click **Deploy**.

---

## Local Verification (No External Services Required)

You can run the entire platform locally with zero external accounts:

```bash
# 1. Run all automated tests across monorepo (18 suites)
pnpm turbo test

# 2. Start the API Gateway (port 3001)
pnpm --filter @linguabridge/api start

# 3. Start the Next.js Frontend (port 3000)
pnpm --filter @linguabridge/web start
```

Visit [http://localhost:3000/cameropay](http://localhost:3000/cameropay) to experience:
- Multilingual selector: **Français**, **English**, **🇨🇲 Kóbɔ́ Ewondo**
- Real-time **Financial Guard** with SHA-256 entity fingerprinting
- Audio pronunciation guide for Ewondo financial terms
- Live translation sandbox connected to the API gateway
# Current API deployment settings

Set a unique `API_KEY` for bootstrap administration and set `CORS_ORIGINS` to the comma-separated HTTPS origins of trusted web clients. Production translation and speech require scoped keys. Admin routes always require an admin key. Key and quota state is process-local. Keep the API on a single instance for development and pilot deployments that depend on in-process key provisioning.

The API uses a bounded in-memory cache. For an existing Supabase deployment, apply [the translation-memory privacy migration](../../infrastructure/migrations/20261113-private-translation-memory.sql) before enabling any public access. The Android pilot does its translation on-device and needs no API deployment.
