# TrendPulse Daily — Google Creator OS

AI-assisted daily publication covering AI, technology, business, India, and world affairs. The repository now includes a Google-first integration layer so one Google account can power Blogger publishing plus Drive/Sheets/Analytics/Search Console/YouTube expansion.

## Stack

- Next.js App Router + TypeScript
- Supabase PostgreSQL/Auth/Storage
- Google OAuth 2.0
- Google Blogger API
- Google Sheets API
- Google Drive / Analytics / Search Console / YouTube scopes prepared
- Vercel deployment

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Google setup

1. Create/select a Google Cloud project.
2. Enable the Blogger API, Google Drive API, Google Sheets API, Google Analytics Data API, Search Console API, and YouTube Data API.
3. Configure an OAuth consent screen for the project.
4. Create a Web application OAuth client.
5. Add the exact redirect URI from `GOOGLE_REDIRECT_URI`, for local development:
   `http://localhost:3000/api/google/callback`
6. Copy the OAuth client ID and secret into `.env.local`.
7. Set a long random `AUTH_SECRET` and use the same secret for `GOOGLE_TOKEN_ENCRYPTION_KEY` if you want one secret-management value; token encryption currently derives from `AUTH_SECRET`.
8. Configure Supabase and run `supabase/migrations/0002_google_creator_os.sql`.
9. Start the app and open `/admin/integrations`.
10. Click **Connect Google** and complete Google's consent flow.

## Required environment variables

See `.env.example`. Never commit `.env.local`, OAuth client secrets, Supabase service-role keys, refresh tokens, or cron secrets.

## Google workflow

```text
Google Trends / research
        ↓
Content idea + keywords
        ↓
Google Docs / internal draft
        ↓
Quality + source validation
        ↓
Supabase content item
        ↓
Admin approval
        ↓
Blogger draft/publish
        ↓
Search Console + Analytics
        ↓
Sheets performance/content log
        ↓
YouTube/social repurposing
```

Current affairs, politics, emergencies, health, finance, legal topics, and unverified claims remain approval-only. The system should not auto-publish those categories.

## API endpoints implemented

- `GET /api/google/connect` — start Google OAuth
- `GET /api/google/callback` — validate OAuth state and securely store the refresh token
- `POST /api/google/blogger/publish` — protected Blogger draft/publish endpoint
- `POST /api/google/sheets/append` — protected Sheets append endpoint

Protected automation endpoints require `Authorization: Bearer <CRON_SECRET>`.

## Roadmap

1. Google OAuth + secure connection storage — implemented
2. Blogger publishing — implemented
3. Sheets content calendar — implemented
4. Drive asset management
5. Search Console reporting
6. Analytics reporting
7. YouTube publishing/repurposing workflow
8. Gmail notifications
9. Google Trends research ingestion
10. Daily scheduled research + approval queue
11. SEO dashboard and monetization readiness
