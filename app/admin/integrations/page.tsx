import { createAdminClient } from '@/lib/supabase/admin';

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const params = await searchParams;
  let connection: { email?: string | null; scopes?: string[] } | null = null;
  let error = '';
  try {
    const supabase = createAdminClient();
    const result = await supabase.from('google_connections').select('email,scopes,updated_at').eq('provider','google').order('updated_at',{ascending:false}).limit(1).maybeSingle();
    connection = result.data;
    if (result.error) error = result.error.message;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Supabase is not configured.';
  }

  const status = params.google;
  return (
    <main style={{maxWidth:900,margin:'0 auto',padding:'48px 24px',fontFamily:'system-ui'}}>
      <p style={{color:'#666'}}>TrendPulse Daily</p>
      <h1>Google Creator OS</h1>
      <p>Connect one Google account to power Blogger, Drive, Sheets, Analytics, Search Console and YouTube integrations.</p>
      {status === 'connected' && <div style={{padding:16,background:'#e8f5e9',margin:'20px 0'}}>Google account connected successfully.</div>}
      {status === 'error' && <div style={{padding:16,background:'#ffebee',margin:'20px 0'}}>Google connection failed. Check the server logs and OAuth configuration.</div>}
      {error && <div style={{padding:16,background:'#fff3e0',margin:'20px 0'}}>Configuration: {error}</div>}
      <section style={{border:'1px solid #ddd',borderRadius:16,padding:24,marginTop:24}}>
        <h2>Google Account</h2>
        {connection ? <>
          <p><strong>Connected:</strong> {connection.email ?? 'Google account'}</p>
          <p><strong>Granted scopes:</strong> {connection.scopes?.length ?? 0}</p>
        </> : <p>No Google account connected yet.</p>}
        <a href="/api/google/connect" style={{display:'inline-block',marginTop:12,padding:'12px 18px',borderRadius:10,background:'#111',color:'#fff',textDecoration:'none'}}>
          {connection ? 'Reconnect Google' : 'Connect Google'}
        </a>
      </section>
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginTop:24}}>
        {['Blogger','Drive','Sheets','Analytics','Search Console','YouTube','Gmail','Trends'].map((name) => <div key={name} style={{border:'1px solid #ddd',borderRadius:14,padding:18}}><strong>{name}</strong><p style={{color:'#666',fontSize:14}}>Google integration</p></div>)}
      </section>
    </main>
  );
}
