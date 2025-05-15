import { useState, useEffect, useContext } from "react";
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GlobalActionContext } from "./globalActionContext";
import { fetchWithAuth } from "./fetchHelper";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-sm p-2 border border-border rounded shadow-lg text-foreground text-sm">
        <p className="label">{`Time: ${label}`}</p>
        <p className="intro">{`Price: $${payload[0].value?.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

const formatPrice = (price) => {
  return price?.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

export default function StockModal({ isOpen, onClose, stock }) {
  const [quote, setQuote] = useState(null);
  const [intraday, setIntraday] = useState(null);
  const [historical, setHistorical] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [chartMode, setChartMode] = useState("intraday");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [error, setError] = useState(null);

  const { setAction } = useContext(GlobalActionContext);

  useEffect(() => {
    if (!isOpen || !stock?.symbol) {
      setLoadingInitial(true);
      setQuote(null);
      setIntraday(null);
      setHistorical(null);
      setError(null);
      setChartMode("intraday");
      return;
    }

    const fetchInitialData = async () => {
      setLoadingInitial(true);
      setError(null);
      try {
        const quoteData = await fetchWithAuth(`/api/quotes?symbols=${stock.symbol}`);
        const currentQuote = quoteData.find((x) => x.symbol === stock.symbol);
        setQuote(currentQuote);

        const intradayData = await fetchWithAuth(`/api/intraday?symbols=${stock.symbol}&interval=5m`);
        const intr = intradayData[0];

        if (intr && Array.isArray(intr.timestamps) && Array.isArray(intr.prices)) {
          const chartData = intr.timestamps.map((t, i) => {
            const ms = typeof t === "number" && t < 1e12 ? t * 1000 : t;
            const dateObj = new Date(ms);
            return {
              time: dateObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
              price: intr.prices[i],
            };
          }).sort((a, b) => new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`));
          setIntraday(chartData);
        } else {
          setIntraday([]);
        }
      } catch (err) {
        setError(err.message || "Failed to load stock details.");
        setQuote(null);
        setIntraday(null);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitialData();
  }, [isOpen, stock?.symbol]);

  const fetchHistoricalData = async () => {
    if (historical || loadingHistorical) return;

    setLoadingHistorical(true);
    try {
      const data = await fetchWithAuth(`/api/monthly-history?symbols=${stock.symbol}&years=5`);
      const histData = data[0]?.history;

      if (Array.isArray(histData)) {
        const chartData = histData.map((item) => ({
          time: new Date(item.date).toLocaleDateString([], { year: "numeric", month: "short" }),
          price: item.close,
        })).sort((a, b) => new Date(a.time) - new Date(b.time));
        setHistorical(chartData);
      } else {
        setHistorical([]);
        toast.error("Could not load historical data.");
      }
    } catch (e) {
      toast.error(`Historical load failed: ${e.message}`);
    } finally {
      setLoadingHistorical(false);
    }
  };

  const handleTrade = async (type) => {
    if (!quote || !quantity || quantity < 1) {
      toast.warning("Cannot perform trade. Check quote data and quantity.");
      return;
    }
    const tradeVerb = type === "buy" ? "Buying" : "Selling";
    const tradePast = type === "buy" ? "Bought" : "Sold";

    const toastId = toast.loading(`${tradeVerb} ${quantity} share(s) of ${stock.symbol}...`);

    try {
      const res = await fetchWithAuth(`/api/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: stock.symbol, quantity }),
      });

      toast.success(`${tradePast} ${quantity} share(s) successfully!`, { id: toastId });
      setAction((prevState) => !prevState);
      onClose();
    } catch (e) {
      toast.error(`Trade failed: ${e.message}`, { id: toastId });
    }
  };

  const isLoading = loadingInitial;
  const quoteDataAvailable = !isLoading && !!quote;
  const chartData = chartMode === "historical" ? historical : intraday;
  const isTradeDisabled = isLoading || !quoteDataAvailable || quantity < 1;

  const changeColor = quote?.changePct > 0 ? "text-green-600" : quote?.changePct < 0 ? "text-red-600" : "text-muted-foreground";
  const changeIcon = quote?.changePct > 0 ? <TrendingUp className="inline h-4 w-4 ml-1" /> : quote?.changePct < 0 ? <TrendingDown className="inline h-4 w-4 ml-1" /> : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : error ? (
            <DialogTitle className="text-red-600">Error Loading Data</DialogTitle>
          ) : (
            <DialogTitle className="flex items-center justify-between">
              <span>{stock?.name} ({stock?.symbol})</span>
              {quoteDataAvailable && (
                <Badge variant={quote.changePct > 0 ? "success" : quote.changePct < 0 ? "destructive" : "secondary"}>
                  {formatPrice(quote.price)}
                </Badge>
              )}
            </DialogTitle>
          )}
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {error && !isLoading && (
            <Alert variant="destructive">
              <AlertTitle>Loading Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!error && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Price</p>
                {isLoading ? <Skeleton className="h-5 w-20" /> : <p className="font-semibold text-lg">{formatPrice(quote?.price) ?? "N/A"}</p>}
              </div>
              <div>
                <p className="text-muted-foreground">Change</p>
                {isLoading ? <Skeleton className="h-5 w-24" /> : (
                  <p className={`font-semibold text-lg ${changeColor}`}>
                    {quote?.change?.toFixed(2) ?? "0.00"} ({quote?.changePct?.toFixed(2) ?? "0.00"}%)
                    {changeIcon}
                  </p>
                )}
              </div>
            </div>
          )}

          {!error && (
            <Tabs value={chartMode} onValueChange={setChartMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="intraday" disabled={isLoading}>Intraday</TabsTrigger>
                <TabsTrigger value="historical" onClick={fetchHistoricalData} disabled={loadingHistorical || isLoading}>
                  {loadingHistorical ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  5Y History
                </TabsTrigger>
              </TabsList>

              <TabsContent value={chartMode} className="mt-4 min-h-[200px]">
                {isLoading ? (
                  <div className="w-full h-[200px] flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : chartData && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis
                         domain={["auto", "auto"]}
                         fontSize={10}
                         tickLine={false}
                         axisLine={false}
                         tickFormatter={(value) => `$${value.toFixed(0)}`}
                         width={40}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }} />
                      <Line
                         type="monotone"
                         dataKey="price"
                         stroke="#2B82B7" // Ensure visible line color
                         strokeWidth={2}
                         dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    {chartMode === 'intraday' && !intraday ? 'Loading chart...' : 'No chart data available.'}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        {!error && (
          <DialogFooter className="p-6 pt-4 border-t flex-col sm:flex-row sm:justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20"
                aria-label="Quantity"
                disabled={isLoading || !quoteDataAvailable}
              />
              <label htmlFor="quantity" className="text-sm text-muted-foreground">Shares</label>
            </div>
            <div className="flex space-x-2">
              <Button variant="destructive" onClick={() => handleTrade("sell")} disabled={isTradeDisabled}>Sell</Button>
              <Button variant="success" onClick={() => handleTrade("buy")} disabled={isTradeDisabled}>Buy</Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
