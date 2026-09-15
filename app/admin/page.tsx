import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  return (
    <main className="page-shell">
      <section className="section-heading">
        <p className="eyebrow">Admin workspace</p>
        <h1>Publishing dashboard</h1>
        <p className="muted">Signed in as {user.email}. Article management and review queues will be added next.</p>
      </section>
      <div className="stats-grid">
        <article className="stat-card"><span>Drafts</span><strong>—</strong></article>
        <article className="stat-card"><span>Pending review</span><strong>—</strong></article>
        <article className="stat-card"><span>Published</span><strong>—</strong></article>
      </div>
    </main>
  );
}
