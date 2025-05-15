import { db } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
  const today = new Date().toISOString().split("T")[0];
  const API_KEY = process.env.NEWS_API_KEY;
  const docRef = db.collection("news").doc(today);

  try {
    // 1. Check Firestore cache
    const doc = await docRef.get();
    if (doc.exists) {
      return res.status(200).json(doc.data().articles);
    }

    // 2. Fetch fresh news from NewsAPI
    const url = `https://newsapi.org/v2/everything?q=stocks+OR+economy+OR+business+OR+finance+OR+market+OR+trade+war+OR+interest+rate+OR+inflation&language=en&sortBy=publishedAt&pageSize=20&apiKey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "ok") {
      return res.status(500).json({ error: data.message || "Failed to fetch news" });
    }

    // 3. Save to Firestore to lock the day
    await docRef.set({ articles: data.articles });

    return res.status(200).json(data.articles);
  } catch (err) {
    console.error("News fetch error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
