"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";

interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("session_token");
      if (token) {
        try {
          await axios.get("http://localhost:8000/auth/verify", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAuthenticated(true);
        } catch (error) {
          setAuthenticated(false);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = () => {
    window.location.href = "http://localhost:8000/auth/spotify/login";
  };

  const logout = () => {
    Cookies.remove("session_token");
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ authenticated, loading, login, logout }}>
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
