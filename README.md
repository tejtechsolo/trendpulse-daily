# TrendPulse Daily — Google Creator OS

AI-assisted daily publication covering AI, technology, business, India, and world affairs. The repository includes the Google-first integration layer plus an editorial news pipeline with deterministic quality gates.

## Stack

- Next.js App Router + TypeScript
- Supabase PostgreSQL/Auth/Storage
- Google OAuth 2.0 and Creator OS integrations
- Gemini-assisted article drafting
- GitHub Actions scheduled automation
- Vercel deployment

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Database migrations

Run Supabase migrations in order, including:

- `0001_initial_schema.sql`
- `0002_editor_policies.sql`
- `0003_rbac.sql`
- `0004_news_intelligence.sql`
- `0005_ai_generation.sql`
- `0006_editorial_quality.sql`

## News → editorial workflow

```text
RSS sources
   ↓
Collect + deduplicate
   ↓
Supabase news_items
   ↓
Risk + topic scoring
   ↓
Gemini draft generation
   ↓
Article + source attribution
   ↓
Quality gate
   ↓
Admin preview / edit
   ↓
Human source verification
   ↓
Publish OR schedule
   ↓
Public SEO article + sitemap + RSS
```

AI-generated articles are created as `pending_review`. High-risk content requires explicit source verification. Publishing requires an editorial quality score of at least 80/100; scheduling also requires at least 80/100.

## SEO endpoints

- `/sitemap.xml` — dynamic sitemap
- `/robots.txt` — crawler rules
- `/rss.xml` — published article feed
- `/articles/[slug]` — canonical metadata, Open Graph/Twitter metadata, and NewsArticle JSON-LD

## Automation

GitHub Actions runs the news pipeline hourly:

1. `/api/cron/collect-news`
2. `/api/cron/process-news`
3. `/api/cron/publish-scheduled`

Configure GitHub Actions secrets `TRENDPULSE_APP_URL` and `CRON_SECRET`.

## Google setup

1. Create/select a Google Cloud project.
2. Enable the required Google APIs for the integrations you use.
3. Configure OAuth consent and a Web application OAuth client.
4. Add the redirect URI from `GOOGLE_REDIRECT_URI`.
5. Configure Supabase and the required Google migration.
6. Open `/admin/integrations` and connect Google.

## Security

Never commit `.env.local`, OAuth client secrets, Supabase service-role keys, AI API keys, refresh tokens, or cron secrets. Never expose server-only secrets through `NEXT_PUBLIC_*` variables.

## Environment

Use `.env.example` as the complete variable checklist. Production should set `NEXT_PUBLIC_SITE_URL` to the real canonical site URL and keep `CRON_SECRET` identical between Vercel and GitHub Actions.

## Roadmap

1. Google OAuth + secure connection storage — implemented
2. Blogger publishing — implemented
3. Sheets content calendar — implemented
4. News collection + dedupe — implemented
5. AI generation + SEO draft — implemented
6. Editorial review + quality gates — implemented
7. Scheduled publishing + RSS/sitemap/robots — implemented
8. Drive asset management
9. Search Console reporting
10. Analytics reporting
11. YouTube publishing/repurposing workflow
12. Gmail notifications
13. Google Trends research ingestion
14. SEO dashboard and monetization readiness
