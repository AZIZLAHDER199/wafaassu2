// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (token: string, isAdmin: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with Django backend
      axios
        .get('http://127.0.0.1:8000/api/verify-token/', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(response => {
          setIsLoggedIn(true);
          setIsAdmin(response.data.is_admin);
        })
        .catch(() => {
          setIsLoggedIn(false);
          setIsAdmin(false);
          localStorage.removeItem('token');
          localStorage.removeItem('is_admin');
          localStorage.removeItem('isLoggedIn');
        });
    }
  }, []);

  const login = (token: string, isAdmin: boolean) => {
    localStorage.setItem('token', token);
    localStorage.setItem('is_admin', isAdmin.toString());
    localStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
    setIsAdmin(isAdmin);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};