'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '../../contexts/UserContext';
import AuthModal from '../../components/AuthModal';
import IPGallery from '../../components/IPGallery';
import IPDetail from '../../components/IPDetail';
import { AuthUser, UserIPCharacter } from '../../lib/supabase';
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

  const loadUserIPs = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/my-ips?userId=${currentUser.id}`);
      if (!response.ok) {
        throw new Error('获取IP列表失败');
      }
      const ips: UserIPCharacter[] = await response.json();
      setUserIPs(ips);
    } catch (error) {
      console.error('加载IP形象失败:', error);
      // Optionally show a user-facing error message
      setUserIPs([]); // Clear previous data on error
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Check authentication on page load
  useEffect(() => {
    if (!userLoading) {
      if (!currentUser) {
        setShowAuthModal(true);
      } else {
        loadUserIPs();
      }
    }
  }, [currentUser, userLoading, loadUserIPs]);

  // 处理URL参数中的ipId，自动选择对应的IP
  useEffect(() => {
    if (urlParams && userIPs.length > 0) {
      const ipId = urlParams.get('ipId');
      if (ipId && !selectedIP) {
        const targetIP = userIPs.find(ip => ip.id === ipId);
        if (targetIP) {
          setSelectedIP(targetIP);
          // 清除URL参数，避免重复选择
          router.replace('/workshop', undefined);
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
    setUserIPs(prevIPs => 
      prevIPs.map(ip => 
        ip.id === updatedCharacter.id ? updatedCharacter : ip
      )
    );
    setSelectedIP(updatedCharacter); // Also update the selected IP
  };

  // Show loading state while checking user authentication
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cleanup-green mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
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
          <IPGallery 
            userIPs={userIPs}
            loading={loading}
            onIPSelect={handleIPSelect}
            onRefresh={loadUserIPs}
          />
        )}
      </div>
    </div>
  );
}