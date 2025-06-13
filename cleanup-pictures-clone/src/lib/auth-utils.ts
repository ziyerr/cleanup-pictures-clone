import type { AuthUser } from './supabase';

// Utility functions for user authentication and management

// Check if user session is valid (could add token expiration logic here)
export const isValidUserSession = (user: AuthUser | null): boolean => {
  return user !== null && !!user.id && !!user.username;
};

// Get user display name
export const getUserDisplayName = (user: AuthUser | null): string => {
  if (!user) return 'Guest';
  return user.username || user.email || 'User';
};

// Check if user has completed profile
export const hasCompleteProfile = (user: AuthUser | null): boolean => {
  return user !== null && !!user.username && !!user.email;
};

// Get user avatar URL (placeholder for future implementation)
export const getUserAvatarUrl = (user: AuthUser | null): string | null => {
  if (!user) return null;
  return `https://api.dicebear.com/8.x/bottts/svg?seed=${user.username}`;
};

// Clear all user-related data from localStorage
export const clearUserData = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('popverse_user');
      localStorage.removeItem('user_preferences');
      localStorage.removeItem('user_session');
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }
};

// Get user preferences from localStorage
export const getUserPreferences = (): Record<string, unknown> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const prefs = localStorage.getItem('user_preferences');
    return prefs ? JSON.parse(prefs) : {};
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return {};
  }
};

// Save user preferences to localStorage
export const saveUserPreferences = (preferences: Record<string, unknown>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
};

export const isUserLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const savedUser = localStorage.getItem('popverse_user');
    if (!savedUser) return false;
    
    const user = JSON.parse(savedUser);
    return isValidUserSession(user);
  } catch (error) {
    console.error('Failed to check login status:', error);
    return false;
  }
};