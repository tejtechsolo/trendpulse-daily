import { NextResponse } from 'next/server';
import { getStoredGoogleAuth } from '@/lib/google-auth';
import { getSheets } from '@/lib/google';

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expected || supplied !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) return NextResponse.json({ error: 'GOOGLE_SHEETS_SPREADSHEET_ID is not configured' }, { status: 500 });

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.values)) return NextResponse.json({ error: 'values must be a 2D array' }, { status: 400 });

  try {
    const { client } = await getStoredGoogleAuth();
    const sheets = getSheets(client);
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: process.env.GOOGLE_SHEETS_CONTENT_RANGE || 'Content!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: body.values }
    });
    return NextResponse.json({ updatedRange: result.data.updates?.updatedRange ?? null });
  } catch (err) {
    console.error('Sheets append failed', err);
    return NextResponse.json({ error: 'Google Sheets operation failed' }, { status: 500 });
  }
}
