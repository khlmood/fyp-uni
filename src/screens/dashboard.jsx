// dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import StockModal from './stockModal';
import {
  fetchQuotes,
  fetchIntraday,
  fetchWithAuth,
  fetchFavorites,
  fetchWatchlist,
  removeFavorite,
  removeWatchlist
} from './fetchHelper';
import FavoriteStockCard from './dashboard/FavoriteStockCard';
import WatchlistItem from './dashboard/WatchlistItem';
import OwnedStockCard from './dashboard/OwnedStockCard';
import StockSkeleton, { WatchlistItemSkeleton } from './dashboard/StockSkeleton';
import './dashboard/dashboard.css';

export default function Dashboard() {
  const [owned, setOwned] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);

  const [stockData, setStockData] = useState({});
  // Add a state for initial loading of the lists themselves
  const [isLoadingInitialLists, setIsLoadingInitialLists] = useState(true);
  const [loading, setLoading] = useState({ quotes: false, intradayFav: false, intradayOwned: false });
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

  // load portfolio, favorites, and watchlist on mount
  useEffect(() => {
    async function loadAll() {
      try {
        const port = await fetchWithAuth('/api/portfolio');
        // Ensure port is an object before checking portfolio
        if (typeof port === 'object' && port !== null && port.portfolio) {
          setOwned(Object.keys(port.portfolio));
        } else {
           setOwned([]); // Ensure state is an empty array if fetch fails or returns unexpected structure
        }
        const favs = await fetchFavorites();
        setFavorites(favs);
        const wl = await fetchWatchlist();
        setWatchlist(wl);
      } catch (e) {
        console.error('Error loading initial data:', e);
        setError(e.message);
        // Set lists to empty in case of partial failure
        setOwned([]);
        setFavorites([]);
        setWatchlist([]);
      } finally {
        // Set initial loading to false only after all lists are attempted to be fetched
        setIsLoadingInitialLists(false);
      }
    }
    loadAll();
  }, []); // Empty dependency array means this runs only once on mount

  const allSymbols = useMemo(
    // Ensure lists are treated as arrays for safety, even if state initialization fails
    () => [...new Set([...(Array.isArray(favorites) ? favorites : []), ...(Array.isArray(watchlist) ? watchlist : []), ...(Array.isArray(owned) ? owned : [])])],
    [favorites, watchlist, owned]
  );

  // Fetch data for all symbols whenever lists change
  const fetchDashboardData = useCallback(async () => {
    // Only fetch if initial lists have loaded and there are symbols to fetch data for
    if (isLoadingInitialLists || allSymbols.length === 0) {
        // If initial loading is still happening, or no symbols, just reset data and loading
         setStockData({});
         setLoading({ quotes: false, intradayFav: false, intradayOwned: false });
         return;
    }

    // Set specific loading states based on which data will be fetched
    setLoading(prev => ({
        quotes: true, // Always fetch quotes for all symbols if allSymbols is not empty
        intradayFav: favorites.length > 0, // Only fetch intraday for favorites if list is not empty
        intradayOwned: owned.length > 0, // Only fetch intraday for owned if list is not empty
    }));
    setError(null); // Clear previous errors when fetching new data

    try {
      // Fetch quotes for all symbols, intraday only for non-empty lists
      const [quotesResult, intradayFavResult, intradayOwnedResult] = await Promise.all([
        fetchQuotes(allSymbols),
        favorites.length > 0 ? fetchIntraday(favorites) : [], // Fetch intraday for favorites only if favorites list is not empty
        owned.length > 0 ? fetchIntraday(owned) : [],       // Fetch intraday for owned only if owned list is not empty
      ]);

      const newData = {};
      // Process quotes
      quotesResult.forEach(q => {
        newData[q.symbol] = { ...newData[q.symbol], quote: q };
      });

      // Process intraday data
      const processIntraday = results => {
        results.forEach(item => {
          if (item?.symbol && item.timestamps && item.prices) {
            newData[item.symbol] = {
              ...newData[item.symbol],
              intraday: item.timestamps.map((ts, i) => ({ time: ts, price: item.prices[i] })),
            };
          } else if (item?.symbol) {
            // console.warn('Incomplete intraday for', item.symbol); // Warning might be noisy
             newData[item.symbol] = { ...newData[item.symbol], intraday: [] }; // Ensure intraday is an array
          }
        });
      };

      processIntraday(intradayFavResult);
      processIntraday(intradayOwnedResult);
      setStockData(newData);

    } catch (e) {
      console.error('Error fetching dashboard data:', e); // More specific error logging
      setError(e.message);
    } finally {
      // Clear all specific loading states once this compound fetch is done
      setLoading({ quotes: false, intradayFav: false, intradayOwned: false });
    }
  }, [isLoadingInitialLists, favorites, owned, allSymbols]); // Depend on lists and initial loading state

  useEffect(() => {
    // Trigger fetching dashboard data whenever the lists or initial loading state changes
    fetchDashboardData();
  }, [fetchDashboardData]); // Dependency on useCallback ensures it runs when the dependency array of fetchDashboardData changes

  const handleOpenModal = symbol => {
    const quote = stockData[symbol]?.quote;
    // Pass potentially incomplete stock data to modal, let modal handle its loading state
    setSelectedStock({ symbol, name: quote?.name || symbol, quote: quote, intraday: stockData[symbol]?.intraday });
  };

  // remove via API then update state
  const handleDelete = async (listType, symbol) => {
    try {
      let updatedList;
      if (listType === 'favorites') {
        updatedList = await removeFavorite(symbol);
        setFavorites(updatedList);
      } else if (listType === 'watchlist') {
        updatedList = await removeWatchlist(symbol);
        setWatchlist(updatedList);
      } else if (listType === 'owned') {
        // Portfolio removal not implemented in watch.js, assuming client-side removal for now
        setOwned(prev => prev.filter(s => s !== symbol));
        // **NOTE:** If 'owned' also requires an API call, add it here similar to favorites/watchlist
      }
      // Re-fetch dashboard data to update quotes/intraday if needed (optional, depending on desired behavior)
      // fetchDashboardData(); // This might be too aggressive, state update already triggers useEffect
    } catch (e) {
      console.error(`Delete from ${listType} failed:`, e);
      setError(e.message);
    }
  };

  const handleAdd = listType => alert(`Add for ${listType} not implemented.`);

  // Helper function to determine if a section is actively loading its *item data* after initial lists loaded
  const isSectionLoadingData = (listType) => {
      if (listType === 'favorites') return loading.intradayFav;
      if (listType === 'watchlist') return loading.quotes; // Watchlist items only show quote data currently
      if (listType === 'owned') return loading.intradayOwned || loading.quotes; // Owned shows quote + intraday
      return false;
  }

  // Determine if *any* loading is happening for a section, including initial list loading
  const isSectionLoading = (listType) => {
      if (isLoadingInitialLists) return true; // Still loading the list itself
      if (listType === 'favorites') return loading.intradayFav;
      if (listType === 'watchlist') return loading.quotes;
      if (listType === 'owned') return loading.intradayOwned || loading.quotes;
      return false; // No loading happening for this section
  }


  return (
    <div className="p-6 bg-background min-h-screen space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Favorites ticker */}
      <section aria-labelledby="favorites-title">
        <div className="flex items-center justify-between mb-3">
          <h2 id="favorites-title" className="text-lg font-semibold">Favorites</h2>
          <Button variant="ghost" size="icon" onClick={() => handleAdd('favorites')} aria-label="Add favorite">
            <PlusCircle />
          </Button>
        </div>
        {/* Show skeletons if the section is loading AND there are items in the list OR it's initial loading */}
        {isSectionLoading('favorites') && (favorites.length > 0 || isLoadingInitialLists) && (
           <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-thin">
             {/* If initial loading, show a fixed number of skeletons to fill space */}
             {isLoadingInitialLists ? (
                 <>
                    <StockSkeleton type="favorite" /><StockSkeleton type="favorite" /><StockSkeleton type="favorite" />
                    {/* Add more if needed to fill the visual space */}
                 </>
             ) : (
                 // If list loaded but item data loading, show one skeleton per item
                 favorites.map(symbol => <StockSkeleton key={symbol} type="favorite" />)
             )}
           </div>
         )}

         {/* Show actual ticker if the section is NOT loading AND list has items */}
         {!isSectionLoading('favorites') && favorites.length > 0 && (
           <div className="ticker overflow-hidden">
             <div className="ticker__move flex">
               {[...favorites, ...favorites].map((symbol, idx) => (
                 // Use index in key only for duplicates in ticker animation, otherwise use symbol alone
                 <div key={`${symbol}-${idx}`} className="w-48 md:w-56 flex-shrink-0">
                   <FavoriteStockCard
                     symbol={symbol}
                     stockData={stockData}
                     loading={loading} // Pass specific loading states down
                     handleOpenModal={handleOpenModal}
                     handleDelete={handleDelete}
                   />
                 </div>
               ))}
             </div>
           </div>
         )}

        {/* Show "No favorites" only if the section is NOT loading AND list is empty AND no error */}
        {!isSectionLoading('favorites') && favorites.length === 0 && !error && (
          <p className="text-center text-sm py-4">No favorites. Click+' to add.</p>
        )}
      </section>

      {/* Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-labelledby="watchlist-title" className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 id="watchlist-title" className="text-lg font-semibold">Watchlist</h2>
            <Button variant="ghost" size="icon" onClick={() => handleAdd('watchlist')} aria-label="Add to watchlist">
              <PlusCircle />
            </Button>
          </div>
          <Card>
             {/* Show skeletons if the section is loading AND there are items in the list OR it's initial loading */}
             {isSectionLoading('watchlist') && (watchlist.length > 0 || isLoadingInitialLists) && (
                 // If initial loading, show a fixed number of skeletons
                 isLoadingInitialLists ? (
                     <>
                         <WatchlistItemSkeleton /><WatchlistItemSkeleton /><WatchlistItemSkeleton />
                     </>
                 ) : (
                     // If list loaded but item data loading, show one skeleton per item
                     watchlist.map(symbol => <WatchlistItemSkeleton key={symbol} />)
                 )
             )}

            {/* Show actual items if the section is NOT loading AND list has items */}
            {!isSectionLoading('watchlist') && watchlist.length > 0 && watchlist.map(symbol => (
              <WatchlistItem
                key={symbol}
                symbol={symbol}
                stockData={stockData}
                loading={loading} // Pass specific loading states down
                handleOpenModal={handleOpenModal}
                handleDelete={handleDelete}
              />
            ))}

            {/* Show "No watchlist" only if the section is NOT loading AND list is empty */}
            {!isSectionLoading('watchlist') && watchlist.length === 0 && !error && (
              <p className="text-center p-6 text-sm">No watchlist. Click+' to add.</p>
            )}
          </Card>
        </section>

        {/* Portfolio */}
        <section aria-labelledby="portfolio-title" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 id="portfolio-title" className="text-lg font-semibold">My Portfolio</h2>
            <Button variant="ghost" size="icon" onClick={() => handleAdd('owned')} aria-label="Add owned stock">
              <PlusCircle />
            </Button>
          </div>
           {/* Show skeletons if the section is loading AND there are items in the list OR it's initial loading */}
           {isSectionLoading('owned') && (owned.length > 0 || isLoadingInitialLists) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* If initial loading, show a fixed number of skeletons */}
                    {isLoadingInitialLists ? (
                        <>
                            <StockSkeleton type="card" /><StockSkeleton type="card" />
                            {/* Add more if needed */}
                        </>
                    ) : (
                        // If list loaded but item data loading, show one skeleton per item
                        owned.map(symbol => <StockSkeleton key={symbol} type="card" />)
                    )}
                </div>
            )}

          {/* Show actual items if the section is NOT loading AND list has items */}
          {!isSectionLoading('owned') && !isSectionLoading('owned') && owned.length > 0 && ( // Fixed redundancy here
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {owned.map(symbol => (
                <OwnedStockCard
                  key={symbol}
                  symbol={symbol}
                  stockData={stockData}
                  loading={loading} // Pass specific loading states down
                  handleOpenModal={handleOpenModal}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Show "No portfolio" only if the section is NOT loading AND list is empty */}
          {!isSectionLoading('owned') && owned.length === 0 && !error && (
            <p className="text-center py-6 text-sm">No portfolio. Click+' to add.</p>
          )}
        </section>
      </div>

      {selectedStock && (
        <StockModal isOpen onClose={() => setSelectedStock(null)} stock={selectedStock} />
      )}
    </div>
  );
}