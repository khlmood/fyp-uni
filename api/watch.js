// api/watch.js
import { db, FieldValue } from './_firebaseAdmin.js';
import { requireUid } from './_authHelper.js';

export default async function handler(req, res) {
  // Authenticate user
  const uid = await requireUid(req, res);
  if (!uid) return;

  // Determine category: 'favorites' or 'watchlist'
  const category = req.method === 'GET'
    ? req.query.category
    : req.body.category;
  if (!['favorites', 'watchlist'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  const field = category === 'favorites' ? 'favorite' : 'list';
  const docRef = db.collection('users').doc(uid).collection('watch').doc(category);

  try {
    if (req.method === 'GET') {
      // Retrieve list, initialize if missing
      const snap = await docRef.get();
      let list = [];
      if (!snap.exists) {
        list = category === 'favorites'
          ? ['AAPL','GOOGL','MSFT','AMZN','TSLA','NVDA','META']
          : ['NFLX','DIS','AMD','INTC','BA','IBM','CSCO','ORCL'];
        await docRef.set({ [field]: list });
      } else {
        const data = snap.data();
        list = Array.isArray(data[field]) ? data[field] : [];
      }
      // Return only the array of symbols
      return res.status(200).json(list);

    } else if (req.method === 'POST') {
      // Modify list (currently only 'remove')
      const { type, symbol } = req.body;
      if (type !== 'remove' || !symbol) {
        return res.status(400).json({ error: 'Invalid request body' });
      }
      // Remove the symbol
      await docRef.update({ [field]: FieldValue.arrayRemove(symbol) });

      // Fetch the updated list
      const updatedSnap = await docRef.get();
      const updatedData = updatedSnap.data() || {};
      const updatedList = Array.isArray(updatedData[field]) ? updatedData[field] : [];

      // Return only the updated array
      return res.status(200).json(updatedList);

    } else {
      // Method not allowed
      return res.status(405).end();
    }

  } catch (err) {
    console.error('watch handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
