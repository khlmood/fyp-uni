// api/sell.js
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
    const revenue = price * quantity;

    const userRef = db.collection('users').doc(uid);
    const txSnap  = await userRef
      .collection('transactions')
      .where('stock', '==', stock.toUpperCase())
      .orderBy('date', 'asc')
      .get();

    let toSell = quantity;
    txSnap.docs.forEach(d => {
      if (d.data().type === 'buy' && toSell > 0) {
        toSell -= d.data().quantity;
      }
    });
    if (toSell > 0) {
      return res.status(400).json({ error: 'Not enough shares' });
    }

    const userSnap  = await userRef.get();
    const newBalance = userSnap.data().balance + revenue;

    await userRef.update({ balance: newBalance });
    await userRef.collection('transactions').add({
      stock,
      type:      'sell',
      quantity,
      price,
      date:      FieldValue.serverTimestamp()
    });

    return res.status(200).json({ newBalance });
  } catch (err) {
    console.error('sell error:', err);
    return res.status(500).json({ error: err.message });
  }
}
