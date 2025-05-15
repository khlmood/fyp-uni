import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const StockSkeleton = ({ type = 'card' }) => {
  if (type === 'favorite') {
    return (
      <Card className="w-48 md:w-56 flex-shrink-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent className="pb-2 px-4">
          <Skeleton className="h-7 w-1/2 mb-2" />
          <div className="h-16 -mx-4 -mb-2 mt-1 flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent className="flex-grow px-4 pb-3">
        {type === 'card' && (
          <>
            <Skeleton className="h-16 w-full mb-2" />
            <Skeleton className="h-4 w-1/2 mt-1" />
            <Skeleton className="h-4 w-1/3 mt-1" />
          </>
        )}
        {type === 'list' && (
          <>
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const WatchlistItemSkeleton = () => (
  <div className="flex items-center justify-between p-3 border-b last:border-b-0">
    <div className="flex-1 space-y-1">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <div className="text-right space-y-1">
      <Skeleton className="h-4 w-16 ml-auto" />
      <Skeleton className="h-3 w-12 ml-auto" />
    </div>
    <Skeleton className="h-6 w-6 ml-2 rounded-full" />
  </div>
);

export default StockSkeleton;