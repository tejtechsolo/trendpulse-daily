const stories = [
  { category: 'AI & Machine Learning', title: 'The New AI Era: What Businesses Should Watch Next', text: 'A practical look at the major shifts shaping AI products, workflows, and adoption.' },
  { category: 'Technology', title: 'Why Smaller, Faster Software Is Becoming the New Competitive Edge', text: 'From cloud costs to developer productivity, modern teams are rethinking their technology stack.' },
  { category: 'Business & Startups', title: 'The Signals Behind the Next Wave of Digital Business', text: 'Key patterns founders and operators should understand before planning their next move.' },
];

export default function Home() {
  return <>
    <header className="header"><div className="container nav"><div className="logo">TrendPulse <span>Daily</span></div><nav className="links"><a href="#latest">Latest</a><a href="#categories">Categories</a><a href="#about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a><a href="/admin/login">Admin</a></nav></div></header>
    <main>
      <section className="hero"><div className="container"><div className="eyebrow">The daily signal</div><h1>Understand what is changing. Stay ahead of what comes next.</h1><p>TrendPulse Daily brings together AI, technology, business, and India & world affairs in clear, useful, original stories.</p><a className="button" href="#latest">Explore latest stories →</a></div></section>
      <section className="section" id="latest"><div className="container"><div className="section-head"><h2>Latest stories</h2><span className="eyebrow">Updated daily</span></div><div className="grid">{stories.map((story) => <article className="card" key={story.title}><div className="category">{story.category}</div><h3>{story.title}</h3><p>{story.text}</p><div className="meta">5 min read · Editorial desk</div></article>)}</div></div></section>
      <section className="section" id="categories"><div className="container"><div className="section-head"><h2>Explore categories</h2></div><div className="grid">{['AI & Machine Learning','Technology','Business & Startups','India','World Affairs','Future Trends'].map((name) => <div className="card" key={name}><div className="category">TrendPulse</div><h3>{name}</h3><p>Curated updates, explainers, and context for this topic.</p></div>)}</div></div></section>
    </main>
    <footer className="footer" id="about"><div className="container">© {new Date().getFullYear()} TrendPulse Daily · Clear context for a changing world.</div></footer>
  </>;
}
