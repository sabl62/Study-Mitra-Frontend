import React, { createContext, useState, useEffect, useContext } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check storage once on app start
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (savedUser && token && refreshToken) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const login = (userData, tokens) => {
    // Handle both old format (single token) and new format (access + refresh)
    if (tokens.access && tokens.refresh) {
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
    } else if (typeof tokens === "string") {
      // Backward compatibility if only access token is passed
      localStorage.setItem("access_token", tokens);
    }

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("is_logged_in", "true");
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    // Use authAPI logout to ensure consistent cleanup
    authAPI.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        login,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
