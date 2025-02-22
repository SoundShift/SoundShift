"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db, functions } from "@/firebaseConfig/firebase";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  authLoaded: boolean;
  user: User | null;
  spotifyToken: string | null;
  refreshToken: string | null;
  likedTracks: Record<string, boolean> | null; // Map of liked track IDs
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [likedTracks, setLikedTracks] = useState<Record<
    string,
    boolean
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      setAuthLoaded(true);

      if (user) {
        try {
          // **Step 1: Decrypt Spotify Tokens**
          const decryptTokens = httpsCallable<
            { userId: string },
            { access_token: string; refresh_token: string }
          >(functions, "decryptTokens");

          const response = await decryptTokens({ userId: user.uid });

          if (response.data?.access_token && response.data?.refresh_token) {
            setSpotifyToken(response.data.access_token);
            setRefreshToken(response.data.refresh_token);
          }

          // **Step 2: Fetch Liked Tracks from Firestore**
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setLikedTracks(userData.likedTracks || {});
          } else {
            console.log("User document not found, setting empty likedTracks.");
            setLikedTracks({});
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setSpotifyToken(null);
        setRefreshToken(null);
        setLikedTracks(null);
      }
    });
  }, []);

  const logout = async () => {
    await signOut(auth);
    setSpotifyToken(null);
    setRefreshToken(null);
    setLikedTracks(null);
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
        likedTracks,
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
