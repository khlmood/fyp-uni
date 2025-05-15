import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StockSkeleton from './StockSkeleton';
import MiniChartTooltip from './MiniChartTooltip';
import { formatPrice, formatChangePercent, getChangeColor } from './utils';
import { toast } from 'sonner';

const OwnedStockCard = ({ symbol, stockData, loading, handleOpenModal, handleDelete }) => {
  const data = stockData[symbol];
  const quote = data?.quote;
  const intraday = data?.intraday;
  const isLoading = loading.intradayOwned || loading.quotes || !data;

  if (isLoading) return <StockSkeleton type="card" />;

  const changeColor = getChangeColor(quote?.changePct);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow relative group"
      onClick={() => handleOpenModal(symbol)}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete('owned', symbol);
          toast('Temporarily removed');
        }}
        aria-label={`Remove ${symbol} from portfolio`}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-3 px-4">
        <div>
          <CardTitle className="text-sm font-medium truncate" title={quote?.name || symbol}>{symbol}</CardTitle>
          <p className="text-xs text-muted-foreground truncate" title={quote?.name || symbol}>{quote?.name || 'N/A'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{formatPrice(quote?.price)}</p>
          <p className={`text-xs font-medium ${changeColor}`}>{formatChangePercent(quote?.changePct)}</p>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="h-24 -mx-4 -mb-2 mt-1">
          {intraday && intraday.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={intraday} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <Tooltip content={<MiniChartTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <XAxis dataKey="time" fontSize={9} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis domain={[ 'auto', 'auto' ]} fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} width={35} />
                <Line type="monotone" dataKey="price" stroke={quote?.changePct >= 0 ? "#22c55e" : "#ef4444"} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              {loading.intradayOwned ? <Loader2 className="h-4 w-4 animate-spin" /> : 'No Chart Data'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnedStockCard;
