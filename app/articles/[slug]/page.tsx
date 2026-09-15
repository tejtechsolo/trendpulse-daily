import Link from 'next/link'

const content: Record<string, { category: string; title: string; excerpt: string; body: string }> = {
  'ai-and-technology': { category: 'AI & Technology', title: 'How AI is changing the way people work and learn', excerpt: 'An introductory look at practical AI use cases across everyday workflows.', body: 'This is a starter article placeholder. Once Supabase and the editorial workflow are connected, this page will load published articles dynamically, including rich content, sources, author information, and SEO metadata.' },
  'india-digital-growth': { category: 'India', title: 'India’s digital economy: key trends to watch', excerpt: 'A placeholder editorial overview for the India current-affairs section.', body: 'This is a starter article placeholder. Production content will be reviewed for accuracy, source attribution, freshness, and sensitivity before publication.' },
  'global-business': { category: 'Business', title: 'Global business signals worth following', excerpt: 'A placeholder article for business and world-affairs coverage.', body: 'This is a starter article placeholder. The final system will render approved articles from the database.' },
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = content[slug]
  if (!article) return <main className="section container"><h1>Article not found</h1><Link className="text-link" href="/articles">← Back to articles</Link></main>
  return <main className="section container article-page"><div className="eyebrow">{article.category}</div><h1 className="page-title">{article.title}</h1><p className="article-excerpt">{article.excerpt}</p><div className="article-body"><p>{article.body}</p></div><Link className="text-link" href="/articles">← Back to articles</Link></main>
}
