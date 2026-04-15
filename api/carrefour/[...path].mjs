// Proxy serverless para Carrefour Argentina VTEX API
// Resuelve el problema de CORS en producción (Vercel)

export default async function handler(req, res) {
  // Reconstruir el path: /api/carrefour/foo/bar → /foo/bar
  const { path = [] } = req.query;
  const upstream = `https://www.carrefour.com.ar/${Array.isArray(path) ? path.join('/') : path}`;

  const url = new URL(upstream);
  const qs  = new URLSearchParams(
    Object.entries(req.query).filter(([k]) => k !== 'path')
  ).toString();
  if (qs) url.search = qs;

  try {
    const upstream_res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    const data = await upstream_res.json();

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(upstream_res.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'upstream_error', detail: err.message });
  }
}
