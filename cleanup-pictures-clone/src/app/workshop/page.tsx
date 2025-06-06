'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../contexts/UserContext';
import AuthModal from '../../components/AuthModal';
import IPGallery from '../../components/IPGallery';
import IPDetail from '../../components/IPDetail';
import { User, UserIPCharacter } from '../../lib/supabase';

export default function WorkshopPage() {
  const { currentUser, setCurrentUser, isLoading: userLoading } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedIP, setSelectedIP] = useState<UserIPCharacter | null>(null);
  const [userIPs, setUserIPs] = useState<UserIPCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const handleIPSelect = (ip: UserIPCharacter) => {
    setSelectedIP(ip);
  };

  const handleBackToGallery = () => {
    setSelectedIP(null);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                ← 返回首页
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedIP ? selectedIP.name : '我的IP工坊'}
              </h1>
            </div>
            
            {selectedIP && (
              <button
                onClick={handleBackToGallery}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← 返回工坊
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedIP ? (
          <IPDetail 
            ipCharacter={selectedIP} 
            onBack={handleBackToGallery}
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