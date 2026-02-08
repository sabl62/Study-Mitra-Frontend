import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check storage once on app start
        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("access_token");
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
            setIsLoggedIn(true);
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        localStorage.setItem("access_token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("is_logged_in", "true");
        setUser(userData);
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);