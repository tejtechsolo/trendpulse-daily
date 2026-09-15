# TrendPulse Daily SEO Operations

## Production configuration

Set these Vercel environment variables when the corresponding Google services are configured:

```env
NEXT_PUBLIC_SITE_URL=https://your-production-domain
GOOGLE_SITE_VERIFICATION=your-search-console-verification-token
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://your-production-domain/
```

`metadataBase` and the Google verification metadata are generated from these values.

## Search Console

1. Open Google Search Console.
2. Add the production site as a Domain or URL-prefix property.
3. Use the `GOOGLE_SITE_VERIFICATION` token for URL-prefix verification when using the HTML-tag method.
4. Submit the production sitemap: `/sitemap.xml`.
5. Inspect important article URLs after publishing.
6. Review indexing, queries, impressions and clicks after Google has collected enough data.

The application does not fabricate Search Console metrics. Google Search Console data should only be displayed after a real property/API connection is configured.

## Analytics

If `NEXT_PUBLIC_GA_MEASUREMENT_ID` is configured, the application loads Google Analytics and also records first-party article page-view events in Supabase. No raw IP address is stored by the first-party event tracker.

## Automated SEO audit

GitHub Actions calls:

```text
GET /api/cron/seo-audit
```

using `CRON_SECRET`.

The audit checks published articles for:

- title length
- excerpt quality
- content length
- SEO title
- SEO description
- tags
- source attribution
- editorial quality score
- cover image

Results are recorded in `automation_runs` and are available from `/admin/seo`.

## Editorial rule

A good SEO score does not override editorial review. Current-affairs and high-risk articles remain subject to the existing review and source-verification workflow.

## Recommended operating cadence

- Hourly: news collection, AI processing, scheduled publishing and SEO audit.
- Daily: review failed automation runs and articles below the SEO threshold.
- Weekly: review Search Console queries and update underperforming articles.
- Monthly: review traffic, revenue and content categories.
