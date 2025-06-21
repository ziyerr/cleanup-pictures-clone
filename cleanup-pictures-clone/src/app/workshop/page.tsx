'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '../../contexts/UserContext';
import AuthModal from '../../components/AuthModal';
import IPGallery from '../../components/IPGallery';
import IPDetail from '../../components/IPDetail';
import type { AuthUser, UserIPCharacter } from '../../lib/supabase';
import { LogOut, UserCircle2 } from 'lucide-react';
import Link from 'next/link';

// A simple dropdown menu component for user profile
const UserMenu = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="transition-transform duration-200 hover:scale-110">
        <Image
          src={`https://api.dicebear.com/8.x/bottts/svg?seed=${user.username}`}
          alt="User Avatar"
          width={40}
          height={40}
          className="rounded-full bg-gray-200 border-2 border-white shadow-sm"
        />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            <p className="font-semibold">{user.username}</p>
            {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <UserCircle2 className="w-4 h-4" />
            个人中心
          </Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onLogout();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </a>
        </div>
      )}
    </div>
  );
};

export default function WorkshopPage() {
  const { currentUser, setCurrentUser, isLoading: userLoading, logout } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedIP, setSelectedIP] = useState<UserIPCharacter | null>(null);
  const [userIPs, setUserIPs] = useState<UserIPCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // 获取URL参数中的ipId
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);
  
  useEffect(() => {
    // 在客户端获取URL参数
    if (typeof window !== 'undefined') {
      setUrlParams(new URLSearchParams(window.location.search));
    }
  }, []);

  const loadUserIPs = useCallback(async (retryCount = 0) => {
    if (!currentUser) {
      console.log('loadUserIPs: 没有当前用户，跳过加载');
      return;
    }
    
    console.log('loadUserIPs: 开始加载用户IP列表', { userId: currentUser.id, retryCount });
    setLoading(true);
    
    try {
      const startTime = Date.now();
      
      // 直接使用客户端Supabase调用，而不是API端点
      const { getUserIPCharacters } = await import('../../lib/supabase');
      const ips = await getUserIPCharacters(currentUser.id);
      
      const fetchTime = Date.now() - startTime;
      console.log(`loadUserIPs: 直接Supabase查询耗时 ${fetchTime}ms`);
      console.log(`loadUserIPs: 成功获取 ${ips.length} 个IP形象`, ips.map(ip => ({ id: ip.id, name: ip.name })));
      
      setUserIPs(ips);
      
      // 如果URL中有ipId但在结果中没找到，且重试次数少于3次，则等待1秒后重试
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const ipId = urlParams.get('ipId');
        if (ipId && !ips.find(ip => ip.id === ipId) && retryCount < 3) {
          console.log(`loadUserIPs: 未找到目标IP ${ipId}，${1000 * (retryCount + 1)}ms后重试...`);
          setTimeout(() => {
            loadUserIPs(retryCount + 1);
          }, 1000 * (retryCount + 1)); // 递增延迟：1s, 2s, 3s
        }
      }
    } catch (error) {
      console.error('loadUserIPs: 加载失败:', error);
      
      // 如果是网络错误，显示友好提示
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.warn('检测到网络连接问题，建议检查网络连接');
      }
      
      setUserIPs([]); // Clear previous data on error
    } finally {
      setLoading(false);
      console.log('loadUserIPs: 加载完成');
    }
  }, [currentUser]);

  // Check authentication on page load
  useEffect(() => {
    console.log('工作坊页面认证检查:', { 
      userLoading, 
      currentUser: currentUser ? { id: currentUser.id, username: currentUser.username } : null 
    });
    
    if (!userLoading) {
      if (!currentUser) {
        console.log('用户未登录，显示认证模态框');
        setShowAuthModal(true);
      } else {
        console.log('用户已登录，开始加载IP列表');
        loadUserIPs();
      }
    }
  }, [currentUser, userLoading, loadUserIPs]);

  // 处理URL参数中的ipId，自动选择对应的IP
  useEffect(() => {
    if (urlParams && userIPs.length > 0) {
      const ipId = urlParams.get('ipId');
      console.log('工作坊页面 - 检查URL参数:', { ipId, userIPsCount: userIPs.length, hasSelectedIP: !!selectedIP });
      
      if (ipId && !selectedIP) {
        const targetIP = userIPs.find(ip => ip.id === ipId);
        console.log('工作坊页面 - 查找目标IP:', { ipId, foundIP: !!targetIP, targetIP });
        
        if (targetIP) {
          console.log('工作坊页面 - 设置选中的IP:', targetIP.id);
          setSelectedIP(targetIP);
          // 清除URL参数，避免重复选择
          router.replace('/workshop');
        } else {
          console.warn('工作坊页面 - 未找到对应的IP:', { ipId, userIPs: userIPs.map(ip => ip.id) });
        }
      }
    }
  }, [urlParams, userIPs, selectedIP, router]);

  const handleIPSelect = (ip: UserIPCharacter) => {
    setSelectedIP(ip);
  };

  const handleBackToGallery = () => {
    setSelectedIP(null);
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleIPUpdate = (updatedCharacter: UserIPCharacter) => {
    console.log('工作坊页面 - 更新IP数据:', {
      id: updatedCharacter.id,
      name: updatedCharacter.name,
      merchandise_count: updatedCharacter.merchandise_urls ? Object.keys(updatedCharacter.merchandise_urls).length : 0
    });
    
    setUserIPs(prevIPs => 
      prevIPs.map(ip => 
        ip.id === updatedCharacter.id ? updatedCharacter : ip
      )
    );
    setSelectedIP(updatedCharacter); // Also update the selected IP
  };

  // Show loading state while checking user authentication or loading data
  if (userLoading || (currentUser && loading)) {
    const message = userLoading ? '正在验证登录状态...' : '正在连接数据库...';
    const subMessage = userLoading 
      ? '如果等待时间过长，请刷新页面' 
      : '首次连接可能需要几秒钟，请稍候';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-cleanup-green/5 via-blue-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-cleanup-green/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 text-center max-w-md mx-4">
          {/* Logo and brand */}
          <div className="mb-8">
            <div className="flex items-center justify-center h-16 px-6 bg-gray-900 rounded-2xl mx-auto w-fit shadow-xl">
              <span className="text-white font-bold text-xl tracking-wider">popverse.ai</span>
            </div>
          </div>
          
          {/* Loading animation */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto relative">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-cleanup-green/20"></div>
              {/* Spinning ring */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cleanup-green animate-spin"></div>
              {/* Inner dot */}
              <div className="absolute inset-4 rounded-full bg-cleanup-green/20 animate-pulse"></div>
              {/* Center dot */}
              <div className="absolute inset-6 rounded-full bg-cleanup-green animate-bounce"></div>
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {userLoading ? '验证身份中' : '加载工坊数据'}
            </h2>
            <p className="text-lg text-gray-700 font-medium">{message}</p>
            <p className="text-sm text-gray-500 leading-relaxed">{subMessage}</p>
            
            {/* Progress indicator */}
            <div className="mt-6">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cleanup-green rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-cleanup-green/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-cleanup-green/40 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span className="ml-2">正在为您准备专属IP工坊</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showAuthModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">IP工坊</h1>
            <p className="text-gray-600">
              请登录以访问您的个人IP工坊，查看和管理您的专属IP形象及周边商品。
            </p>
          </div>
          
          <AuthModal
            isOpen={true}
            onClose={() => router.push('/')}
            onSuccess={handleAuthSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="transition-transform duration-200 hover:scale-105" title="返回首页">
                <div className="flex items-center justify-center h-10 px-4 bg-gray-900 rounded-lg">
                  <span className="text-white font-bold tracking-wider">popverse.ai</span>
                </div>
              </Link>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 hidden sm:block">
                {selectedIP ? 'IP详情' : '我的IP工坊'}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {selectedIP ? (
                <button
                  onClick={handleBackToGallery}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ← 返回工坊
                </button>
              ) : (
                currentUser && <UserMenu user={currentUser} onLogout={handleLogout} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedIP ? (
          <IPDetail 
            ipCharacter={selectedIP} 
            onBack={handleBackToGallery}
            onUpdate={handleIPUpdate}
          />
        ) : (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cleanup-green mx-auto mb-4"></div>
                <p className="text-gray-600">正在加载您的IP形象...</p>
                <p className="text-gray-400 text-sm mt-2">首次连接数据库可能需要几秒钟</p>
              </div>
            ) : (
              <IPGallery 
                userIPs={userIPs}
                loading={loading}
                onIPSelect={handleIPSelect}
                onRefresh={loadUserIPs}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}