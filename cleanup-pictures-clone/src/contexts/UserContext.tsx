"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser } from '../lib/supabase';
import { supabase, getCurrentUser } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface UserContextType {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  logout: () => void;
  isLoading: boolean;
  isMounted: boolean;
  session: Session | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Load user from Supabase session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsMounted(true);
      setIsLoading(true);
      
      try {
        // 获取当前session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('获取session失败:', error);
          setSession(null);
          setCurrentUser(null);
          return;
        }
        
        setSession(session);
        
        if (session?.user) {
          // 从session构建AuthUser对象
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
            user_metadata: session.user.user_metadata,
            created_at: session.user.created_at || new Date().toISOString(),
          };
          
          setCurrentUser(authUser);
          console.log('从session恢复用户:', { userId: authUser.id, username: authUser.username });
        } else {
          setCurrentUser(null);
          console.log('无有效session，用户未登录');
        }
      } catch (error) {
        console.error('初始化认证失败:', error);
        setSession(null);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('认证状态变化:', event, session?.user?.id || 'no user');
      
      setSession(session);
      
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
          user_metadata: session.user.user_metadata,
          created_at: session.user.created_at || new Date().toISOString(),
        };
        setCurrentUser(authUser);
      } else {
        setCurrentUser(null);
      }
    });

    // 清理订阅
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 更新用户状态（保持Supabase session）
  const updateCurrentUser = (user: AuthUser | null) => {
    setCurrentUser(user);
    // 注意：不要手动清除session，让Supabase管理
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('登出错误:', error);
      } else {
        console.log('用户已登出');
      }
    } catch (error) {
      console.error('登出过程出错:', error);
    }
    // session和currentUser会通过onAuthStateChange自动清除
  };

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      setCurrentUser: updateCurrentUser,
      logout,
      isLoading,
      isMounted,
      session
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