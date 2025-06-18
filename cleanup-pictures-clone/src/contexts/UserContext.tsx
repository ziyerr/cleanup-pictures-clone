"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser } from '../lib/supabase';
import { supabase } from '../lib/supabase';
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
        console.log('UserContext: 开始初始化认证');
        const startTime = Date.now();
        
        // 从Supabase session获取
        const { data: { session }, error } = await supabase.auth.getSession();
        const fetchTime = Date.now() - startTime;
        
        console.log(`UserContext: getSession耗时 ${fetchTime}ms`);
        
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
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '',
            user_metadata: session.user.user_metadata,
            created_at: session.user.created_at || new Date().toISOString(),
          };
          
          setCurrentUser(authUser);
          console.log('从session恢复用户:', { userId: authUser.id, username: authUser.username });
        } else {
          setCurrentUser(null);
          console.log('无有效用户，用户未登录');
        }
      } catch (error) {
        console.error('初始化认证失败:', error);
        setSession(null);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
        console.log('UserContext: 认证初始化完成');
      }
    };

    // 添加超时机制
    const timeoutId = setTimeout(() => {
      console.warn('UserContext: 认证初始化超时，强制设置为未加载状态');
      setIsLoading(false);
    }, 10000); // 10秒超时

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('认证状态变化:', event, session?.user?.id || 'no user');
      
      setSession(session);
      
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '',
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
      // 清除Supabase session
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('登出错误:', error);
      } else {
        console.log('用户已登出');
      }
      
      // 用户状态会通过onAuthStateChange自动清除
    } catch (error) {
      console.error('登出过程出错:', error);
      // 即使出错也要清除状态
      setCurrentUser(null);
    }
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