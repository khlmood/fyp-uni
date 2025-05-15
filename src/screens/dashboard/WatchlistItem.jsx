import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WatchlistItemSkeleton } from './StockSkeleton';
import { formatPrice, formatChangePercent, getChangeColor, GetChangeIcon } from './utils';

const WatchlistItem = ({ symbol, stockData, loading, handleOpenModal, handleDelete }) => {
  const data = stockData[symbol];
  const quote = data?.quote;
  const isLoading = loading.quotes || !quote;

  if (isLoading) {
    return <WatchlistItemSkeleton />;
  }

  const changeColor = getChangeColor(quote?.changePct);

  return (
    <div
      className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 group"
      onClick={() => handleOpenModal(symbol)}
    >
      <div className="flex-1 overflow-hidden mr-2">
        <p className="text-sm font-semibold truncate" title={quote.name || symbol}>{symbol}</p>
        <p className="text-xs text-muted-foreground truncate" title={quote.name || symbol}>{quote.name || 'N/A'}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{formatPrice(quote.price)}</p>
        <p className={`text-xs ${changeColor} flex items-center justify-end`}>
          <GetChangeIcon changePct={quote.changePct} />
          {formatChangePercent(quote.changePct)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="ml-2 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); handleDelete('watchlist', symbol); }}
        aria-label={`Remove ${symbol} from watchlist`}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default WatchlistItem;