// api/detailed/quotes.js
import yahooFinance    from 'yahoo-finance2';
import { requireUid }  from '../_authHelper.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const uid = await requireUid(req, res);
  if (!uid) return;

  const symbols = (req.query.symbols || '')
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);

  if (!symbols.length) {
    return res.status(400).json({ error: 'Missing symbols query param' });
  }

  try {
    const raw = await yahooFinance.quote(symbols);
    return res.status(200).json(Array.isArray(raw) ? raw : [raw]);
  } catch (err) {
    console.error('detailedQuotes error:', err);
    return res.status(500).json({ error: err.message });
  }
}
