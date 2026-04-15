// Proxy serverless para CallMeBot WhatsApp API
// Resuelve el problema de CORS en producción (Vercel)

export default async function handler(req, res) {
  const { path = [] } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : path;
  const upstream = `https://api.callmebot.com/${pathStr}`;

  const url = new URL(upstream);
  const qs  = new URLSearchParams(
    Object.entries(req.query).filter(([k]) => k !== 'path')
  ).toString();
  if (qs) url.search = qs;

  try {
    const upstream_res = await fetch(url.toString());
    const text = await upstream_res.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream_res.status).send(text);
  } catch (err) {
    res.status(502).json({ error: 'upstream_error', detail: err.message });
  }
}
