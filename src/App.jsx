import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./../firebaseConfig";
import { GlobalActionProvider } from "./screens/globalActionContext";
import Layout from "./screens/layout";
import Dashboard from "./screens/dashboard";
import LoginPage from "./screens/login";
import SignupPage from "./screens/signup";
import News from "./screens/news";
import Portfolio from "./screens/portfolio";
import Chatbot from "./screens/chatbot";
import { Toaster } from "sonner";
import { FiWifiOff } from "react-icons/fi";
import "./App.css";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    // you can render a spinner here
    return null;
  }
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  return (
    <Router>
      <Toaster position="top-center" />
      {!isOnline && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <FiWifiOff size={72} className="text-white" />
          <p className="text-white mt-4 text-2xl">No Internet Connection</p>
        </div>
      )}
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        {/* Private */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <GlobalActionProvider>
                <Layout />
              </GlobalActionProvider>
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="news" element={<News />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="chatbot" element={<Chatbot />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
