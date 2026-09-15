import Link from 'next/link';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  const { supabase } = await requirePermission('articles.review');

  const { data: items, error } = await supabase
    .from('news_items')
    .select('id,title,source_name,category,status,risk_level,topic_score,processing_error,created_at,article_id')
    .in('status', ['ready_for_review', 'converted'])
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return <main className="mx-auto max-w-6xl p-6"><p className="text-red-600">Unable to load news queue: {error.message}</p></main>;
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Admin / News Intelligence</p>
          <h1 className="text-3xl font-bold">News Processing Queue</h1>
          <p className="mt-1 text-gray-600">AI-generated candidates remain unpublished until editorial review.</p>
        </div>
        <Link href="/admin" className="rounded border px-4 py-2 text-sm">Dashboard</Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="grid grid-cols-[1fr_120px_100px_90px_110px] gap-4 border-b bg-gray-50 p-4 text-xs font-semibold uppercase text-gray-500">
          <span>Story</span><span>Category</span><span>Risk</span><span>Score</span><span>Status</span>
        </div>
        {items?.length ? items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_120px_100px_90px_110px] gap-4 border-b p-4 last:border-0">
            <div>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-1 text-xs text-gray-500">{item.source_name} · {new Date(item.created_at).toLocaleString()}</p>
              {item.processing_error && <p className="mt-2 text-xs text-red-600">{item.processing_error}</p>}
              {item.article_id && <Link className="mt-2 inline-block text-sm underline" href={`/admin/articles/${item.article_id}/edit`}>Review article →</Link>}
            </div>
            <span className="text-sm">{item.category}</span>
            <span className="text-sm capitalize">{item.risk_level}</span>
            <span className="text-sm">{item.topic_score}/100</span>
            <span className="text-sm capitalize">{item.status.replaceAll('_', ' ')}</span>
          </div>
        )) : (
          <div className="p-8 text-center text-gray-500">No generated news candidates are waiting here.</div>
        )}
      </div>
    </main>
  );
}
