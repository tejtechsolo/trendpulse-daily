import Link from 'next/link';
import { requireUser } from '@/lib/rbac';

export default async function AdminPage() {
  const { supabase, user, profile } = await requireUser();
  const [{ data: articles }, { count: aiGenerated }] = await Promise.all([
    supabase.from('articles').select('status,published_at'),
    supabase.from('news_items').select('id', { count: 'exact', head: true }).not('generated_at', 'is', null),
  ]);
  const count = (status: string) => articles?.filter((a) => a.status === status).length ?? 0;
  const publishedToday = articles?.filter((a) => a.status === 'published' && a.published_at && new Date(a.published_at).toDateString() === new Date().toDateString()).length ?? 0;
  const role = profile?.roles?.name ?? 'unassigned';
  const permissions = async (key: string) => { const { data } = await supabase.rpc('has_permission', { permission_key: key }); return data === true; };
  const canCreate = await permissions('articles.create');
  const canReview = await permissions('articles.review');
  const canManageUsers = await permissions('users.manage');
  const canManageRoles = await permissions('roles.manage');
  const canManageSettings = await permissions('categories.manage');

  return <main className="page-shell">
    <section className="section-heading"><p className="eyebrow">Admin workspace</p><h1>Publishing dashboard</h1><p className="muted">Signed in as {user!.email} · Role: {role}</p></section>
    {!profile && <div className="notice-card"><strong>RBAC setup required.</strong><p>Assign this account a role using the bootstrap SQL documented in migration 0003.</p></div>}
    <div className="stats-grid">
      <article className="stat-card"><span>Drafts</span><strong>{count('draft')}</strong></article><article className="stat-card"><span>Pending review</span><strong>{count('pending_review')}</strong></article><article className="stat-card"><span>Scheduled</span><strong>{count('scheduled')}</strong></article><article className="stat-card"><span>Published today</span><strong>{publishedToday}</strong></article><article className="stat-card"><span>AI generated</span><strong>{aiGenerated ?? 0}</strong></article><article className="stat-card"><span>Rejected</span><strong>{count('rejected')}</strong></article>
    </div>
    <nav className="admin-links" aria-label="Admin navigation">
      <Link href="/admin/articles">Articles</Link>{canCreate && <Link href="/admin/articles/new">New article</Link>}{canReview && <><Link href="/admin/review">Review queue</Link><Link href="/admin/news">News intelligence</Link><Link href="/admin/automation">Automation monitor</Link></>}{canManageSettings && <><Link href="/admin/analytics">Analytics</Link><Link href="/admin/seo">SEO & quality</Link><Link href="/admin/revenue">Revenue</Link></>}{canManageUsers && <Link href="/admin/users">Users</Link>}{canManageRoles && <Link href="/admin/roles">Roles & permissions</Link>}
    </nav>
  </main>;
}
