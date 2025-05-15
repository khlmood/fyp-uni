import yahooFinance from "yahoo-finance2";

export default async function handler(req, res) {
  const query = req.query.symbols;
  const interval = req.query.interval || '5m';

  if (!query) return res.status(400).json({ error: "Missing 'symbols' query param" });

  const symbols = query.split(",").map(s => s.trim().toUpperCase());

  function getRecentTradingDay(date) {
    const day = date.getDay();
    if (day === 0) date.setDate(date.getDate() - 2);
    else if (day === 6) date.setDate(date.getDate() - 1);
    return date;
  }

  const today = new Date();
  const tradingDay = getRecentTradingDay(new Date(today));
  const period1 = new Date(tradingDay.getFullYear(), tradingDay.getMonth(), tradingDay.getDate());
  const period2 = new Date(tradingDay.getFullYear(), tradingDay.getMonth(), tradingDay.getDate() + 1);
  const period1Epoch = Math.floor(period1.getTime() / 1000);
  const period2Epoch = Math.floor(period2.getTime() / 1000);

  try {
    const results = await Promise.all(symbols.map(async symbol => {
      const data = await yahooFinance.chart(symbol, {
        period1: period1Epoch,
        period2: period2Epoch,
        interval
      });

      const timestamps = data.quotes.map(quote => quote.date);
      const prices = data.quotes.map(quote => quote.close);

      return {
        symbol,
        timestamps,
        prices,
      };
    }));

    res.json(results);
  } catch (err) {
    console.error("Error fetching intraday data:", err.message);
    res.status(500).json({ error: err.message });
  }
}
