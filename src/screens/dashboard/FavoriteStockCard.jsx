import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StockSkeleton from './StockSkeleton';
import MiniChartTooltip from './MiniChartTooltip';
import { formatPrice, formatChangePercent, getChangeColor } from './utils';

const FavoriteStockCard = ({ symbol, stockData, loading, handleOpenModal, handleDelete }) => {
  const data = stockData[symbol];
  const quote = data?.quote;
  const intraday = data?.intraday;
  const isLoading = loading.intradayFav || loading.quotes || !data;

  if (isLoading) return <div className="w-48 md:w-56 flex-shrink-0"><StockSkeleton type="card" /></div>;

  const changeColor = getChangeColor(quote?.changePct);

  return (
    <Card
      className="w-48 md:w-56 flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow relative group"
      onClick={() => handleOpenModal(symbol)}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={(e) => { e.stopPropagation(); handleDelete('favorites', symbol); }}
        aria-label={`Remove ${symbol} from favorites`}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium truncate" title={quote?.name || symbol}>{symbol}</CardTitle>
        <span className={`text-xs font-semibold ${changeColor}`}>
          {formatChangePercent(quote?.changePct)}
        </span>
      </CardHeader>
      <CardContent className="pb-2 px-4">
        <div className="text-lg font-bold">{formatPrice(quote?.price)}</div>
        <div className="h-16 -mx-4 -mb-2 mt-1">
          {intraday && intraday.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={intraday} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <Tooltip content={<MiniChartTooltip />} cursor={false} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={quote?.changePct >= 0 ? "#22c55e" : "#ef4444"}
                  strokeWidth={2}
                  dot={false}
                />
                <XAxis hide dataKey="time" />
                <YAxis hide domain={['dataMin', 'dataMax']} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No Chart</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FavoriteStockCard;