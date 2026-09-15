import Link from 'next/link'

const articles = [
  { slug: 'ai-and-technology', category: 'AI & Technology', title: 'How AI is changing the way people work and learn', excerpt: 'An introductory look at practical AI use cases across everyday workflows.', date: 'Coming soon' },
  { slug: 'india-digital-growth', category: 'India', title: 'India’s digital economy: key trends to watch', excerpt: 'A placeholder editorial overview for the India current-affairs section.', date: 'Coming soon' },
  { slug: 'global-business', category: 'Business', title: 'Global business signals worth following', excerpt: 'A placeholder article for business and world-affairs coverage.', date: 'Coming soon' },
]

export default function ArticlesPage() {
  return (
    <main>
      <section className="section container">
        <div className="section-head">
          <div><div className="eyebrow">The latest</div><h1 className="page-title">All articles</h1></div>
          <Link className="text-link" href="/">← Home</Link>
        </div>
        <div className="grid">
          {articles.map((article) => (
            <article className="card" key={article.slug}>
              <div className="category">{article.category}</div>
              <h3><Link href={`/articles/${article.slug}`}>{article.title}</Link></h3>
              <p>{article.excerpt}</p>
              <div className="meta">{article.date}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
