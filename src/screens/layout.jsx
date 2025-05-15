import { useState, useEffect, useContext } from "react";
import { Input } from "@/components/ui/input";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { GlobalActionContext } from "./globalActionContext";
import StockModal from "./stockModal";
import stockData from "../data_/stocks.json";

import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";

export default function Layout() {
  const [search, setSearch] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [balance, setBalance] = useState(0);
  const [username, setUsername] = useState("");

  const { action, setAction } = useContext(GlobalActionContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  const fetchProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken(true);
    const res = await fetch(`/api/getProfile`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) {
      console.error("Profile fetch failed:", await res.text());
      return;
    }
    const data = await res.json();
    setBalance(data.balance ?? 0);
    setUsername(data.username ?? "");
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) fetchProfile();
      else navigate("/login", { replace: true });
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (action) {
      fetchProfile();
      setAction(false);
    }
  }, [action, setAction]);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearch(q);
    if (q) {
      const results = stockData.filter(
        (s) =>
          s.Name.toLowerCase().includes(q.toLowerCase()) ||
          s.Symbol.toLowerCase().includes(q.toLowerCase())
      );
      setSearchResults(results);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSelectStock = (stock) => {
    setSelectedStock({ ...stock, name: stock.Name, symbol: stock.Symbol });
    setSearch("");
    setShowSearchDropdown(false);
  };

  const navLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "News", path: "/news" },
    { name: "Portfolio", path: "/portfolio" },
    { name: "Chatbot", path: "/chatbot" },
  ];

  return (
    <div>
      <nav className="fixed top-0 left-1/2 transform -translate-x-1/2 bg-white shadow-md rounded-full mt-[9px] px-8 py-3 flex justify-between items-center z-50">
        <div className="flex space-x-4">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`px-4 py-2 rounded-full transition-all ${isActive
                    ? "ring-2 ring-blue-600 text-blue-600"
                    : "text-gray-700 hover:ring-2 hover:ring-blue-600 hover:text-blue-600"
                  }`}
              >
                {link.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-blue-600 font-bold">${balance.toFixed(3)}</span>

          <div className="relative">
            <Input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={handleSearchChange}
              className="w-48 rounded-full"
            />
            {showSearchDropdown && (
              <div className="absolute bg-white shadow-md w-full rounded-md z-10">
                {searchResults.length > 0 ? (
                  searchResults.map((s) => (
                    <div
                      key={s.Symbol}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectStock(s)}
                    >
                      {s.Name} ({s.Symbol})
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500">No result</div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="text-gray-600 hover:text-blue-600"
              onClick={() => setShowUserDropdown((v) => !v)}
            >
              <FaUserCircle size={28} />
            </button>
            {showUserDropdown && (
              <div className="absolute right-0 top-12 bg-white shadow-md rounded w-32 py-2 z-10">
                <div className="px-4 py-2 border-b border-gray-200 text-sm font-bold">
                  {username}
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-20">
        <Outlet />
      </div>
      {selectedStock && (
        <StockModal
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
          stock={selectedStock}
        />
      )}
    </div>
  );
}
