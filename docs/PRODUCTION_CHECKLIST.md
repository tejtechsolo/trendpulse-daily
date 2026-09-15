# TrendPulse Daily — Production Checklist

## 1. Vercel

Create/connect the Vercel project to `tejtechsolo/trendpulse-daily`.

Set these Production environment variables in Vercel:

```text
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_SITE_NAME=TrendPulse Daily
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
AUTH_SECRET=...
AI_PROVIDER=gemini
AI_API_KEY=...
AI_MODEL=gemini-3.5-flash-lite
CRON_SECRET=...
NEWS_PROCESS_BATCH_SIZE=10
AUTOMATION_ENABLED=true
DEFAULT_TIMEZONE=Asia/Kolkata
NEXT_PUBLIC_GA_MEASUREMENT_ID=...
GOOGLE_SITE_VERIFICATION=...
NEXT_PUBLIC_ADSENSE_CLIENT_ID=...
ADSENSE_PUBLISHER_ID=...
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `AI_API_KEY`, `AUTH_SECRET`, or `CRON_SECRET` through a `NEXT_PUBLIC_*` variable.

## 2. Supabase

Run all migrations in order:

```text
0001_initial_schema.sql
0002_editor_policies.sql
0003_rbac.sql
0004_news_intelligence.sql
0005_ai_generation.sql
0006_editorial_quality.sql
0007_automation_runs.sql
```

Then bootstrap the first admin in `profiles` using the authenticated user's UUID as documented in `0003_rbac.sql`.

## 3. GitHub Actions

Add repository secrets:

```text
TRENDPULSE_APP_URL=https://YOUR_DOMAIN
CRON_SECRET=<same value as Vercel CRON_SECRET>
```

The hourly workflow executes health → collect → process → publish-scheduled.

## 4. Smoke test

After deployment, verify:

- `/` loads
- `/articles` loads
- `/sitemap.xml` loads
- `/rss.xml` loads
- `/robots.txt` loads
- `/privacy` loads
- `/terms` loads
- `/contact` loads
- `/api/health` returns healthy when authorized
- `/admin/login` loads
- authenticated admin can open `/admin`
- news collection creates `news_items`
- processing creates `pending_review` articles
- quality checks block weak articles
- reviewer can publish or schedule approved content
- scheduled publishing changes due articles to `published`

## 5. Google SEO

In Google Search Console:

1. Add the production site as a property.
2. Complete ownership verification using the configured verification metadata.
3. Submit `https://YOUR_DOMAIN/sitemap.xml`.
4. Inspect important published URLs after deployment.

Do not treat submission as a guarantee of indexing.

## 6. Analytics

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` only after creating the Google Analytics web data stream. If the value is absent, the application does not load the Analytics script.

## 7. Ad monetization

AdSense integration is readiness-only until Google approves the site. Set the client/publisher variables only after obtaining them from the AdSense account.

The application must retain clear privacy, terms, contact, and editorial-policy pages before applying.

## 8. Security

- Use long random secrets.
- Rotate `CRON_SECRET` if it is ever exposed.
- Keep Supabase service-role credentials server-side.
- Keep AI credentials server-side.
- Require editorial review for medium/high-risk current-affairs content.
- Do not claim source verification unless a reviewer actually verified the source.
