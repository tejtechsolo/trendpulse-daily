import { NextResponse } from 'next/server';

export function GET() {
  const publisherId = process.env.ADSENSE_PUBLISHER_ID?.trim();
  if (!publisherId) {
    return new NextResponse('Not configured\n', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  const normalized = publisherId.startsWith('pub-') ? publisherId : `pub-${publisherId}`;
  return new NextResponse(`google.com, ${normalized}, DIRECT, f08c47fec0942fa0\n`, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
