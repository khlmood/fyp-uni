import { auth } from "../../firebaseConfig";

// --- Helper function for authenticated API requests ---
export const fetchWithAuth = async (url, opts = {}) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");
    const token = await user.getIdToken();

    const response = await fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (e) { }
      throw new Error(errorMsg);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return response; 
    }

  } catch (err) {
    console.error("API Fetch Error:", err);
    throw err;
  }
};

// --- API Calls using fetchWithAuth ---
export async function fetchQuotes(symbols) {
  if (!symbols || symbols.length === 0) return [];
  const symbolString = symbols.join(",");
  const data = await fetchWithAuth(`/api/quotes?symbols=${symbolString}`, {
    method: 'GET',
  });
  return data;
}

export async function fetchIntraday(symbols) {
   if (!symbols || symbols.length === 0) return [];
  const symbolString = symbols.join(",");
  const data = await fetchWithAuth(`/api/intraday?symbols=${symbolString}&interval=5m`, {
    method: 'GET',
  });
   return data; 
}


// --- For the Dashboard ---
export async function fetchFavorites() {
  const data = await fetchWithAuth('/api/watch?category=favorites', { method: 'GET' });
  const list = Array.isArray(data) ? data : [];
  console.log("Fav:", list);
  return list.filter(item => typeof item === 'string');
}

export async function fetchWatchlist() {
  const data = await fetchWithAuth('/api/watch?category=watchlist', { method: 'GET' });
  const list = Array.isArray(data) ? data : [];
  console.log("Watch:", list);
  return list.filter(item => typeof item === 'string');
}

export async function removeFavorite(symbol) {
  const updatedList = await fetchWithAuth('/api/watch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'favorites', type: 'remove', symbol }),
  });
  const updated = Array.isArray(updatedList) ? updatedList : [];
  return updated.filter(item => typeof item === 'string');
}

export async function removeWatchlist(symbol) {
  const updatedList = await fetchWithAuth('/api/watch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'watchlist', type: 'remove', symbol }),
  });
  const updated = Array.isArray(updatedList) ? updatedList : [];
  return updated.filter(item => typeof item === 'string');
}