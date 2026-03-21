import type { NextApiRequest, NextApiResponse } from 'next/types';

// Server-side internal URL — never exposed to the browser
const BEESPECTOR_INTERNAL = process.env.BEESPECTOR_INTERNAL_URL || 'http://beespector:8001';

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path, ...query } = req.query;
  const subPath = Array.isArray(path) ? path.join('/') : path ?? '';
  const qs = new URLSearchParams(query as Record<string, string>).toString();
  const url = `${BEESPECTOR_INTERNAL}/api/${subPath}${qs ? `?${qs}` : ''}`;

  const fetchOptions: RequestInit = {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = JSON.stringify(req.body);
  }

  const upstream = await fetch(url, fetchOptions);
  const data = await upstream.json().catch(() => null);
  res.status(upstream.status).json(data);
}
