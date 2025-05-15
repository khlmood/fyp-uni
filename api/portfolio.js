// api/portfolio.js
import { db, FieldValue }    from './_firebaseAdmin.js';
import { requireUid }        from './_authHelper.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const uid = await requireUid(req, res);
  if (!uid) return;

  try {
    const snap = await db
      .collection('users').doc(uid)
      .collection('transactions')
      .orderBy('date', 'asc')
      .get();

    const holdings = {};
    snap.docs.forEach(d => {
      const { stock, type, quantity, price } = d.data();
      if (!holdings[stock]) holdings[stock] = [];
      if (type === 'buy') {
        holdings[stock].push({ quantity, price });
      } else {
        let toSell = quantity;
        while (toSell > 0 && holdings[stock].length) {
          const lot = holdings[stock][0];
          if (lot.quantity <= toSell) {
            toSell -= lot.quantity;
            holdings[stock].shift();
          } else {
            lot.quantity -= toSell;
            toSell = 0;
          }
        }
      }
    });

    const portfolio = {};
    for (const [stock, lots] of Object.entries(holdings)) {
      const netShares = lots.reduce((sum, l) => sum + l.quantity, 0);
      if (netShares > 0) {
        const invested = lots.reduce((sum, l) => sum + l.quantity * l.price, 0);
        portfolio[stock] = { netShares, invested };
      }
    }

    return res.status(200).json({ portfolio });
  } catch (err) {
    console.error('portfolio error:', err);
    return res.status(500).json({ error: err.message });
  }
}
