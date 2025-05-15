// api/transactions.js
import { db }             from './_firebaseAdmin.js';
import { requireUid }     from './_authHelper.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const uid = await requireUid(req, res);
  if (!uid) return;

  try {
    const snap = await db
      .collection('users').doc(uid)
      .collection('transactions')
      .orderBy('date', 'desc')
      .get();

    const transactions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ transactions });
  } catch (err) {
    console.error('transactions error:', err);
    return res.status(500).json({ error: err.message });
  }
}
