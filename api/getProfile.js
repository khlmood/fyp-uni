// api/getProfile.js
import { db }                from './_firebaseAdmin.js';
import { requireUid }        from './_authHelper.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const uid = await requireUid(req, res);
  if (!uid) return;

  try {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(snap.data());
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: err.message });
  }
}
