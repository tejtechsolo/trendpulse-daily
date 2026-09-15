'use client';

import { useEffect } from 'react';

export default function PageView({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `tp-viewed-${articleId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    void fetch('/api/analytics/pageview', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, referrer: document.referrer || null, source: new URLSearchParams(window.location.search).get('utm_source') || null }),
      keepalive: true,
    });
  }, [articleId]);
  return null;
}
