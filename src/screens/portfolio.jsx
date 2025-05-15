// src/screens/portfolio.jsx
import { useState, useEffect, useContext } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { GlobalActionContext } from "./globalActionContext";
import { toast } from "sonner";
import { auth } from "../../firebaseConfig";

// register Pie elements
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState({});
  const [quotes, setQuotes] = useState({});
  const [selected, setSelected] = useState({});
  const [qty, setQty] = useState(1);
  const { action, setAction } = useContext(GlobalActionContext);

  const fetchWithAuth = async (url, opts = {}) => {
    const token = await auth.currentUser.getIdToken();
    return fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers||{}),
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const loadPortfolio = async () => {
    try {
      const res = await fetchWithAuth("/api/portfolio");
      if (!res.ok) throw new Error(await res.text());
      const { portfolio } = await res.json();
      setPortfolio(portfolio);
    } catch (err) {
      console.error("Portfolio load failed:", err);
      toast.error("Failed to load portfolio");
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (action) {
      loadPortfolio();
      setAction(false);
    }
  }, [action, setAction]);

  useEffect(() => {
    const syms = Object.keys(portfolio).join(",");
    if (!syms) return;
    fetchWithAuth(`/api/quotes?symbols=${syms}`)
      .then((r) => r.json())
      .then((arr) => {
        const map = {};
        arr.forEach((q) => (map[q.symbol] = q));
        setQuotes(map);
      })
      .catch((err) => console.error("Quotes load failed:", err));
  }, [portfolio]);

  const handleSellAll = async () => {
    const toSell = Object.keys(selected).filter((s) => selected[s]);
    if (!toSell.length) {
      toast.error("No stocks selected");
      return;
    }
    for (let sym of toSell) {
      if (portfolio[sym].netShares < qty) {
        toast.error(`Not enough shares of ${sym}`);
        return;
      }
    }
    for (let sym of toSell) {
      await fetchWithAuth("/api/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: sym, quantity: qty }),
      });
    }
    toast.success("Sold successfully!");
    setAction(true);
  };

  // build the Pie chart data
  const symbols = Object.keys(portfolio);
  let chartData;
  if (symbols.length === 0) {
    chartData = {
      labels: ["none"],
      datasets: [
        {
          data: [100],
          backgroundColor: ["#ffffff"],
          borderColor: ["#ccc"],
          borderWidth: 1,
        },
      ],
    };
  } else {
    const data = symbols.map((s) => portfolio[s].invested);
    const colors = symbols.map((_, i) =>
      ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2"][i % 4]
    );
    chartData = {
      labels: symbols,
      datasets: [{ data, backgroundColor: colors }],
    };
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📊 Portfolio</h1>

      <div className="max-w-md mx-auto">
        <Pie data={chartData} />
      </div>

      <div className="mt-6 space-y-4">
        {symbols.length === 0 && <p className="text-center mt-4">No stocks owned</p>}
        {symbols.map((sym) => {
          const { netShares, invested } = portfolio[sym];
          const price = quotes[sym]?.price ?? invested / netShares;
          const profit = (price * netShares - invested).toFixed(2);
          const pct = (
            ((price - invested / netShares) / (invested / netShares)) *
            100
          ).toFixed(2);
          return (
            <div
              key={sym}
              className="flex items-center justify-between border-b pb-2"
            >
              <label>
                <input
                  type="checkbox"
                  checked={!!selected[sym]}
                  onChange={(e) =>
                    setSelected((p) => ({ ...p, [sym]: e.target.checked }))
                  }
                />{" "}
                {sym}
              </label>
              <span>{netShares} shares</span>
              <span>${invested.toFixed(2)}</span>
              <span
                className={profit >= 0 ? "text-green-600" : "text-red-600"}
              >
                {pct}% (${profit})
              </span>
            </div>
          );
        })}

        {symbols.length > 0 && (
          <div className="flex items-center space-x-2 mt-4">
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(+e.target.value)}
              className="w-20 p-1 border"
            />
            <button onClick={handleSellAll} className="btn-red">
              Sell Selected
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
