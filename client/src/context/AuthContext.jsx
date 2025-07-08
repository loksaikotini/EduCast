import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const performLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      navigate('/login');
    }
  }, [navigate]);

  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const currentToken = localStorage.getItem('token');
    
    const headers = { ...options.headers };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    try {
      const response = await fetch(`${API_URL}${url}`, { ...options, headers: headers });
      
      if (response.status === 401) {
        performLogout();
        throw new Error('Unauthorized - logging out');
      }
      return response;
    } catch (error) {
      if (error.message !== 'Unauthorized - logging out') {
        console.error("Fetch error:", error);
      }
      throw error;
    }
  }, [API_URL, performLogout]);

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage during initial load:", error);
        performLogout();
      }
    }
    setLoading(false);
  }, [performLogout]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'token' && event.newValue === null) {
        performLogout();
      }
      if (event.key === 'user' && event.newValue === null) {
        performLogout();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [performLogout]);

  const logout = performLogout;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, fetchWithAuth, loading, API_URL }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
