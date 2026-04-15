// Proxy serverless para dolarapi.com
// Resuelve el problema de CORS en producción (Vercel)

export default async function handler(req, res) {
  const { path = [] } = req.query;
  const upstream = `https://dolarapi.com/${Array.isArray(path) ? path.join('/') : path}`;

  try {
    const upstream_res = await fetch(upstream, {
      headers: { Accept: 'application/json' },
    });
    const data = await upstream_res.json();

    // El tipo de cambio no cambia tan seguido — cachear 3 min
    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(upstream_res.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'upstream_error', detail: err.message });
  }
}
