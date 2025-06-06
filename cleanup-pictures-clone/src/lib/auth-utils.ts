import type { User } from './supabase';

// Utility functions for authentication

// Check if user session is valid (could add token expiration logic here)
export const isValidUserSession = (user: User | null): boolean => {
  if (!user) return false;
  
  // Add additional validation if needed
  // For example, check if user token is expired
  return true;
};

// Get user display name
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Guest';
  return user.username || user.email || 'User';
};

// Check if user has completed profile
export const hasCompleteProfile = (user: User | null): boolean => {
  if (!user) return false;
  return Boolean(user.username);
};

// Get user avatar URL (placeholder for future implementation)
export const getUserAvatarUrl = (user: User | null): string | null => {
  // Could return user.avatar_url if we add this field later
  return null;
};

// Clear all user-related data from localStorage
export const clearUserData = (): void => {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('popverse_user');
    localStorage.removeItem('popverse_user_preferences');
    // Clear welcome toast flags for all users
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('welcome_shown_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear user data:', error);
  }
};

// Get user preferences from localStorage
export const getUserPreferences = (): Record<string, unknown> => {
  // Only run on client side
  if (typeof window === 'undefined') return {};
  
  try {
    const prefs = localStorage.getItem('popverse_user_preferences');
    return prefs ? JSON.parse(prefs) : {};
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return {};
  }
};

// Save user preferences to localStorage
export const saveUserPreferences = (preferences: Record<string, unknown>): void => {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('popverse_user_preferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
};