// api/buy.js
import { db, FieldValue } from './_firebaseAdmin.js';
import { requireUid }     from './_authHelper.js';
import yahooFinance       from 'yahoo-finance2';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const uid = await requireUid(req, res);
  if (!uid) return;

  const { stock, quantity } = req.body;
  if (!stock || quantity <= 0) {
    return res.status(400).json({ error: 'Stock & quantity required' });
  }

  try {
    const quote = await yahooFinance.quote(stock.toUpperCase());
    const price = quote.regularMarketPrice;
    const cost  = price * quantity;

    const userRef  = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const balance  = userSnap.data().balance;

    if (balance < cost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    await userRef.update({ balance: balance - cost });
    await userRef.collection('transactions').add({
      stock,
      type:      'buy',
      quantity,
      price,
      date:      FieldValue.serverTimestamp()
    });

    return res.status(200).json({ newBalance: balance - cost });
  } catch (err) {
    console.error('buy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
