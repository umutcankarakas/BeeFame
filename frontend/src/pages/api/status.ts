import type { NextApiRequest, NextApiResponse } from 'next/types';

const PACKAGE_VERSION = require('/package.json').version;

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ name: 'BeeFAME', version: PACKAGE_VERSION });
}
