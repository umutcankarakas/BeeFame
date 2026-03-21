import type { NextApiRequest, NextApiResponse } from 'next/types';
import http from 'http';
import https from 'https';

const BACKEND = process.env.BACKEND_INTERNAL_URL || 'http://backend:8000';

export const config = {
  api: { bodyParser: true, responseLimit: false },
};

function proxyRequest(url: string, req: NextApiRequest): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };

    const proxyReq = transport.request(options, (proxyRes) => {
      // Follow redirects internally (307, 301, 302, 308)
      if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        proxyRequest(proxyRes.headers.location, req).then(resolve).catch(reject);
        return;
      }
      let body = '';
      proxyRes.on('data', (chunk) => { body += chunk; });
      proxyRes.on('end', () => resolve({ status: proxyRes.statusCode || 500, body }));
    });

    proxyReq.on('error', reject);
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      proxyReq.write(JSON.stringify(req.body));
    }
    proxyReq.end();
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path, ...query } = req.query;
  const subPath = Array.isArray(path) ? path.join('/') : path ?? '';
  const qs = new URLSearchParams(query as Record<string, string>).toString();
  const url = `${BACKEND}/${subPath}${qs ? `?${qs}` : ''}`;

  try {
    const result = await proxyRequest(url, req);
    const contentType = result.body.startsWith('{') || result.body.startsWith('[') ? 'application/json' : 'text/plain';
    res.setHeader('Content-Type', contentType);
    res.status(result.status).send(result.body);
  } catch (err: any) {
    res.status(502).json({ error: 'Proxy error', detail: err.message });
  }
}
