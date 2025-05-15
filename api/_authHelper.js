// api/_authHelper.js
import { auth } from './_firebaseAdmin.js';

export async function requireUid(req, res) {
  const h = req.headers.authorization ?? '';
  if (!h.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return null;
  }
  const token = h.substring(7);
  try {
    const { uid } = await auth.verifyIdToken(token);
    return uid;
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}
