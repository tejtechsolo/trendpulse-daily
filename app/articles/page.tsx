import Link from 'next/link';
import { getPublishedArticles } from '@/lib/articles';

export const revalidate = 60;

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();

  return (
    <main>
      <section className="section container">
        <div className="section-head">
          <div><div className="eyebrow">The latest</div><h1 className="page-title">All articles</h1></div>
          <Link className="text-link" href="/">← Home</Link>
        </div>
        {articles.length === 0 ? (
          <div className="empty-state"><h2>No published articles yet</h2><p>Check back soon for the latest AI, technology, business, India and world updates.</p></div>
        ) : (
          <div className="grid">
            {articles.map((article) => (
              <article className="card" key={article.id}>
                <div className="category">{article.categories?.name ?? 'News'}</div>
                <h3><Link href={`/articles/${article.slug}`}>{article.title}</Link></h3>
                {article.excerpt && <p>{article.excerpt}</p>}
                <div className="meta">{article.published_at ? new Date(article.published_at).toLocaleDateString('en-IN') : ''}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
