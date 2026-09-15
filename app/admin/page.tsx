import Link from 'next/link';
import { requireUser } from '@/lib/rbac';

export default async function AdminPage() {
  const { supabase, user, profile } = await requireUser();
  const { data: articles } = await supabase.from('articles').select('status');
  const count = (status: string) => articles?.filter((a) => a.status === status).length ?? 0;
  const role = profile?.roles?.name ?? 'unassigned';
  const permissions = async (key: string) => {
    const { data } = await supabase.rpc('has_permission', { permission_key: key });
    return data === true;
  };
  const canCreate = await permissions('articles.create');
  const canReview = await permissions('articles.review');
  const canManageUsers = await permissions('users.manage');
  const canManageRoles = await permissions('roles.manage');

  return (
    <main className="page-shell">
      <section className="section-heading">
        <p className="eyebrow">Admin workspace</p>
        <h1>Publishing dashboard</h1>
        <p className="muted">Signed in as {user!.email} · Role: {role}</p>
      </section>
      {!profile && <div className="notice-card"><strong>RBAC setup required.</strong><p>Assign this account a role using the bootstrap SQL documented in migration 0003.</p></div>}
      <div className="stats-grid">
        <article className="stat-card"><span>Drafts</span><strong>{count('draft')}</strong></article>
        <article className="stat-card"><span>Pending review</span><strong>{count('pending_review')}</strong></article>
        <article className="stat-card"><span>Published</span><strong>{count('published')}</strong></article>
        <article className="stat-card"><span>Rejected</span><strong>{count('rejected')}</strong></article>
        <article className="stat-card"><span>Scheduled</span><strong>{count('scheduled')}</strong></article>
      </div>
      <nav className="admin-links" aria-label="Admin navigation">
        <Link href="/admin/articles">Articles</Link>
        {canCreate && <Link href="/admin/articles/new">New article</Link>}
        {canReview && <Link href="/admin/review">Review queue</Link>}
        {canManageUsers && <Link href="/admin/users">Users</Link>}
        {canManageRoles && <Link href="/admin/roles">Roles & permissions</Link>}
      </nav>
    </main>
  );
}
