// Proxy serverless para dolarapi.com
// Resuelve el problema de CORS en producción (Vercel)

export default async function handler(req, res) {
  const parsed  = new URL(req.url, 'http://localhost');
  const subpath = parsed.pathname.replace(/^\/api\/dolar/, '');
  const upstream = `https://dolarapi.com${subpath}${parsed.search}`;

  try {
    const upstream_res = await fetch(upstream, {
      headers: { Accept: 'application/json' },
    });
    const data = await upstream_res.json();

    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(upstream_res.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'upstream_error', detail: err.message });
  }
}
