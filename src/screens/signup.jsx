// src/screens/signup.jsx
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function SignupPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const navigate = useNavigate();

  // redirect if already signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/dashboard", { replace: true });
    });
    return unsub;
  }, [navigate]);

  const handleSignup = async () => {
    setError("");
    try {
      // 1️⃣ create the Auth user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // 2️⃣ create their Firestore "users" doc
      await setDoc(doc(db, "users", user.uid), {
        username: user.email,
        balance: 10000
      });

      // 3️⃣ navigate to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-80">
        <h2 className="text-xl font-bold mb-4 text-center">Sign Up</h2>
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <Button
          onClick={handleSignup}
          className="w-full bg-green-600 text-white mb-2"
        >
          Sign Up
        </Button>
        <Button
          onClick={() => navigate("/login")}
          className="w-full bg-gray-200 text-black"
        >
          Back to Login
        </Button>
      </div>
    </div>
  );
}
