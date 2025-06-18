'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useUser } from '../../../contexts/UserContext';
import type { AuthUser } from '../../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const { setCurrentUser } = useUser();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 获取URL中的认证信息
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('认证回调错误:', error);
          router.push('/?error=auth_failed');
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          
          const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            username: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
            user_metadata: user.user_metadata,
            created_at: user.created_at || new Date().toISOString(),
          };

          console.log('Google认证成功:', { userId: authUser.id, username: authUser.username });
          
          // 更新用户状态
          setCurrentUser(authUser);
          
          // 预热数据库连接
          console.log('开始预热数据库连接...');
          try {
            const warmupResponse = await fetch('/api/warmup');
            const warmupResult = await warmupResponse.json();
            console.log('数据库预热结果:', warmupResult);
          } catch (error) {
            console.warn('数据库预热失败，但不影响后续流程:', error);
          }
          
          // 检查是否有待保存的IP形象
          const pendingIP = sessionStorage.getItem('pending_ip_save');
          if (pendingIP) {
            // 不要在这里清除数据，让首页处理
            // 跳转到首页并触发保存流程
            router.push('/?save_ip=true');
          } else {
            // 直接跳转到工作坊
            router.push('/workshop');
          }
        } else {
          console.error('认证回调中没有用户信息');
          router.push('/?error=no_user');
        }
      } catch (error) {
        console.error('处理认证回调时出错:', error);
        router.push('/?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [router, setCurrentUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cleanup-green mx-auto mb-4"></div>
        <p className="text-gray-600">正在完成登录...</p>
      </div>
    </div>
  );
}