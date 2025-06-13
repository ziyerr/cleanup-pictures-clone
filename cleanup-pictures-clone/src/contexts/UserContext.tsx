"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser } from '../lib/supabase';

interface UserContextType {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  logout: () => void;
  isLoading: boolean;
  isMounted: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Load user from localStorage on mount (client-side only)
  useEffect(() => {
    const loadUser = () => {
      setIsMounted(true);
      
      // Ensure we're on the client side
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      try {
        const savedUser = localStorage.getItem('popverse_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          // Validate the user object
          if (user && user.id && user.username) {
            setCurrentUser(user);
          } else {
            // Invalid user data, remove it
            localStorage.removeItem('popverse_user');
          }
        }
      } catch (error) {
        console.error('Failed to load user from localStorage:', error);
        // Clear invalid data
        try {
          localStorage.removeItem('popverse_user');
        } catch (removeError) {
          console.error('Failed to remove invalid user data:', removeError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Delay loading slightly to avoid hydration issues
    const timer = setTimeout(loadUser, 0);
    return () => clearTimeout(timer);
  }, []);

  // Custom setCurrentUser that also updates localStorage
  const updateCurrentUser = (user: AuthUser | null) => {
    setCurrentUser(user);
    
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      if (user) {
        // Save user to localStorage
        try {
          localStorage.setItem('popverse_user', JSON.stringify(user));
        } catch (error) {
          console.error('Failed to save user to localStorage:', error);
        }
      } else {
        // Remove user from localStorage
        try {
          localStorage.removeItem('popverse_user');
        } catch (error) {
          console.error('Failed to remove user from localStorage:', error);
        }
      }
    }
  };

  const logout = () => {
    updateCurrentUser(null);
  };

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      setCurrentUser: updateCurrentUser,
      logout,
      isLoading,
      isMounted
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}