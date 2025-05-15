import { TrendingUp, TrendingDown } from 'lucide-react';

export const formatPrice = (price) =>
  typeof price === 'number'
    ? price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      })
    : 'N/A';

export const formatChangePercent = (pct) =>
  typeof pct === 'number' ? `${pct.toFixed(2)}%` : 'N/A';

export const getChangeColor = (changePct) =>
  changePct > 0
    ? 'text-green-600'
    : changePct < 0
    ? 'text-red-600'
    : 'text-muted-foreground';

export const GetChangeIcon = ({ changePct }) => {
  if (changePct > 0) return <TrendingUp className="h-3 w-3 mr-0.5" />;
  if (changePct < 0) return <TrendingDown className="h-3 w-3 mr-0.5" />;
  return null;
};