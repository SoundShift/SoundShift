"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, functions } from "@/firebaseConfig/firebase";
import { httpsCallable } from "firebase/functions";

interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  authLoaded: boolean;
  user: User | null;
  spotifyToken: string | null;
  refreshToken: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      setAuthLoaded(true);

      if (user) {
        try {
          const decryptTokens = httpsCallable<
            { userId: string },
            { access_token: string; refresh_token: string }
          >(functions, "decryptTokens");

          const response = await decryptTokens({ userId: user.uid });

          if (response.data?.access_token && response.data?.refresh_token) {
            setSpotifyToken(response.data.access_token);
            setRefreshToken(response.data.refresh_token);
          }
        } catch (error) {
          console.error("Error fetching Spotify tokens:", error);
        }
      } else {
        setSpotifyToken(null);
        setRefreshToken(null);
      }
    });
  }, []);

  const logout = async () => {
    await signOut(auth);
    setSpotifyToken(null);
    setRefreshToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authenticated: !!user,
        loading,
        authLoaded,
        user,
        spotifyToken,
        refreshToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("Error, not in context");
  }
  return context;
};
