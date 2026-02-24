import { useState, useEffect } from "react";
import { auth } from "../firebase"; // Changed from "../../src/services/firebase"
import api from "../api"; // This is correct

export interface User {
  id: number; // Database ID
  firebase_uid: string;
  email: string;
  name?: string;
  role: string;
  avatar?: string;
  is_verified: boolean;
  consultant?: any;
  profile?: any;
  wallet?: any;
}

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      setError(null);

      if (firebaseUser) {
        try {
          console.log("🔥 Firebase user detected:", firebaseUser.email);

          // Fetch user data from your backend using the /auth/me endpoint
          const response = await api.post("/auth/me", {
            email: firebaseUser.email,
          });

          console.log("✅ Backend user data:", response.data);
          console.log("✅ User database ID:", response.data.id);

          // Store in sessionStorage for other components that might need it
          sessionStorage.setItem("user", JSON.stringify(response.data));

          setUser(response.data);
        } catch (err: any) {
          console.error("❌ Failed to fetch user data:", err);
          setError(err.message);
          setUser(null);
        }
      } else {
        console.log("❌ No Firebase user");
        sessionStorage.removeItem("user");
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (!user) return;

    try {
      const response = await api.post("/auth/me", {
        email: user.email,
      });
      setUser(response.data);
      sessionStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    } catch (err: any) {
      console.error("❌ Failed to refresh user:", err);
    }
  };

  return { user, loading, error, refreshUser };
};
