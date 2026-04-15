// Proxy serverless para CallMeBot WhatsApp API
// Resuelve el problema de CORS en producción (Vercel)

export default async function handler(req, res) {
  const parsed   = new URL(req.url, 'http://localhost');
  const subpath  = parsed.pathname.replace(/^\/api\/callmebot/, '');
  const upstream = `https://api.callmebot.com${subpath}${parsed.search}`;

  try {
    const upstream_res = await fetch(upstream);
    const text = await upstream_res.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream_res.status).send(text);
  } catch (err) {
    res.status(502).json({ error: 'upstream_error', detail: err.message });
  }
}
