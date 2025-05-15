// api/monthly-history.js
import yahooFinance    from 'yahoo-finance2';
import { requireUid }  from './_authHelper.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const uid = await requireUid(req, res);
  if (!uid) return;

  const symbols = (req.query.symbols || '')
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
  const years = parseInt(req.query.years) || 10;

  if (!symbols.length) {
    return res.status(400).json({ error: 'Missing symbols query param' });
  }

  try {
    const today     = new Date();
    const startYear = today.getFullYear() - years;
    const startDate = new Date(startYear, today.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const results = await Promise.all(symbols.map(async symbol => {
      const hist = await yahooFinance.historical(symbol, {
        period1: startDate,
        interval: '1mo',
      });
      return {
        symbol,
        history: hist.map(item => ({ date: item.date, close: item.close })),
      };
    }));
    return res.status(200).json(results);
  } catch (err) {
    console.error('monthlyHistory error:', err);
    return res.status(500).json({ error: err.message });
  }
}
