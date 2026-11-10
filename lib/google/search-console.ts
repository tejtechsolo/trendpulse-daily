import { google } from 'googleapis';

type SearchConsoleRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

function serviceAccountKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!raw) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
  return raw.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
}

export async function fetchSearchPerformance(startDate: string, endDate: string) {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!siteUrl || !email) {
    throw new Error('Missing GOOGLE_SEARCH_CONSOLE_SITE_URL or GOOGLE_SERVICE_ACCOUNT_EMAIL');
  }

  const auth = new google.auth.JWT({
    email,
    key: serviceAccountKey(),
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchConsole = google.searchconsole({ version: 'v1', auth });
  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date', 'query', 'page', 'country', 'device'],
      rowLimit: 25000,
      dataState: 'final',
    },
  });

  return (response.data.rows ?? []) as SearchConsoleRow[];
}

export function mapSearchPerformanceRow(row: SearchConsoleRow) {
  const [date, query, page, country, device] = row.keys ?? [];
  const dimensions = { date, query, page, country, device };
  return {
    report_date: date,
    dimension_key: JSON.stringify(dimensions),
    dimensions,
    query_text: query || null,
    page_url: page || null,
    country: country || null,
    device: device || null,
    clicks: Math.max(0, Math.round(row.clicks ?? 0)),
    impressions: Math.max(0, Math.round(row.impressions ?? 0)),
    ctr: Math.min(1, Math.max(0, row.ctr ?? 0)),
    average_position: Math.max(0, row.position ?? 0),
    synced_at: new Date().toISOString(),
  };
}
