# Google Search Console integration setup

This integration imports finalized Search Console performance rows into Supabase and exposes them in the admin dashboard.

## 1. Verify the Search Console property

1. Open [Google Search Console](https://search.google.com/search-console).
2. Verify the production website as either a URL-prefix property (for example, `https://example.com/`) or a Domain property.
3. Copy the exact property identifier. For a URL-prefix property, include the trailing slash when it is part of the registered property. For a Domain property, use `sc-domain:example.com`.

## 2. Create a Google Cloud service account

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a project.
3. Enable the **Google Search Console API** for that project.
4. Create a service account and generate a JSON key.
5. Keep the downloaded JSON key private. Never commit it to GitHub or expose it in a browser/client bundle.

## 3. Grant Search Console access

In Search Console, open the verified property and add the service account email (the JSON key's `client_email`) as a delegated owner/user with sufficient access to read performance data. The account running the integration must have access to the exact property configured below.

## 4. Configure Vercel environment variables

Add these variables to the Vercel project for the Production environment:

| Variable | Value |
| --- | --- |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Exact Search Console property identifier |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account JSON `client_email` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Service account JSON `private_key` |

For `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, paste the private key value. If your environment editor expects a single line, preserve newline characters as literal `\n` sequences. Do not paste the entire JSON key file into this variable.

The app also needs the existing `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CRON_SECRET` production variables.

After saving environment variables, redeploy the Vercel project so the serverless functions receive them.

## 5. Apply the database migration

Run `supabase/migrations/0013_search_performance.sql` against the production Supabase project using the Supabase SQL Editor or your established migration workflow.

The migration creates `public.search_performance`, indexes it, enables RLS, and allows users with the existing `categories.manage` permission to read the dashboard data. The cron writes using the server-only service-role key.

## 6. Run the first sync

In GitHub, open **Actions → TrendPulse Search Console Sync → Run workflow**. The workflow calls:

`GET /api/cron/search-console`

It imports a rolling 28-day window ending three days before the current UTC date. This delay avoids relying on recent, potentially incomplete Search Console data. Repeated runs safely upsert the same date/dimension rows.

The workflow then runs daily at 06:15 UTC (11:45 India Standard Time). It uses the existing GitHub Actions secrets `TRENDPULSE_APP_URL` and `CRON_SECRET`.

## 7. View results

Sign in with an account that has `categories.manage` and open:

`/admin/search-console`

The dashboard shows clicks, impressions, CTR, average position, top queries, and top landing pages for the rows currently stored in Supabase.

## Troubleshooting

- **403 / permission denied:** Confirm the Search Console API is enabled and the service account email has access to the exact property.
- **No rows returned:** Confirm the property identifier exactly matches Search Console and that the property has finalized search data for the selected date range.
- **Invalid JWT / private key:** Confirm the email and private key come from the same service-account JSON key. Preserve the private key newlines.
- **Unauthorized cron:** Ensure the Vercel `CRON_SECRET` matches the GitHub Actions secret exactly.
- **Dashboard permission denied:** Assign the existing `categories.manage` permission to the intended SEO/admin role.

Search Console API responses are subject to Google's data availability and row limits; this dashboard should be treated as a useful performance view, not a guarantee that every query row Google holds is exposed.
