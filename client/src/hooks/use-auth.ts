import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  sendOtp: (email: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      try {
        // Check localStorage for previous auth state
        const wasAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        
        if (wasAuthenticated) {
          // Try to fetch dashboard stats to verify authentication is still valid
          await apiRequest("GET", "/api/dashboard/stats");
          setIsAuthenticated(true);
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('isAuthenticated');
        }
      } catch (error) {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const sendOtp = async (email: string): Promise<boolean> => {
    try {
      await apiRequest("POST", "/api/auth/send-otp", { email });
      return true;
    } catch (error) {
      console.error("Failed to send OTP:", error);
      return false;
    }
  };

  const login = async (email: string, token: string): Promise<boolean> => {
    try {
      await apiRequest("POST", "/api/auth/verify-otp", { email, token });
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      setLocation("/dashboard");
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      localStorage.removeItem('isAuthenticated');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsAuthenticated(false);
      localStorage.removeItem('isAuthenticated');
      setLocation("/login");
    }
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        isAuthenticated,
        login,
        logout,
        sendOtp,
        isLoading,
      }
    },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
