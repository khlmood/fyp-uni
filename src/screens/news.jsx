import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3 p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      <Skeleton className="h-48 w-full rounded-t-lg" />
      <div className="space-y-2 px-2 pb-2"> 
        <Skeleton className="h-4 w-1/3" /> 
        <Skeleton className="h-5 w-5/6" /> 
        <Skeleton className="h-4 w-full" /> 
        <Skeleton className="h-4 w-4/5" /> 
      </div>
    </div>
  );
}

function ArticleCard({ article }) {
  const { url, urlToImage, title, description, source, publishedAt } = article;
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ease-in-out border border-gray-200 dark:border-gray-700 hover:scale-[1.03]" // Added group, subtle scale, better shadow
    >
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {urlToImage ? (
          <img
            src={urlToImage}
            alt={title || 'News article image'} 
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        {(source?.name || formattedDate) && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 truncate">
            {source?.name && <span className="font-medium">{source.name}</span>}
            {source?.name && formattedDate && <span> &middot; </span>}
            {formattedDate && <span>{formattedDate}</span>}
          </div>
        )}
        <h2 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          {title || "Untitled Article"}
        </h2>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {description}
          </p>
        )}
      </div>
    </a>
  );
}

function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch("/api/news")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Network response was not ok (status: ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setArticles(Array.isArray(data) ? data : Array.isArray(data?.articles) ? data.articles : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load news:", err);
        setError("Could not load news articles. Please check your connection or try again later.");
        setLoading(false); 
      });
  }, []);
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-4">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-center" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-1">{error}</span>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="grid gap-6 p-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Render multiple skeletons */}
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)}
      </div>
    );
  }
  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-4">
        <p className="text-gray-600 dark:text-gray-400 text-lg">No news articles found at the moment.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-6 p-4 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, idx) => (
        <ArticleCard
          key={article.id || article.url || `article-${idx}`}
          article={article}
        />
      ))}
    </div>
  );
}

export default News;