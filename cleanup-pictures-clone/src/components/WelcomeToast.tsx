'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, X, Sparkles } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import ClientOnly from './ClientOnly';

function WelcomeToastContent() {
  const { currentUser, isLoading, isMounted } = useUser();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only run when component is mounted and user is loaded
    if (!isMounted || isLoading || !currentUser) return;
    
    try {
      // Check if this is first time showing welcome for this user
      const welcomeShown = localStorage.getItem(`welcome_shown_${currentUser.id}`);
      
      if (!welcomeShown) {
        setShow(true);
        localStorage.setItem(`welcome_shown_${currentUser.id}`, 'true');
        
        // Auto hide after 5 seconds
        const timer = setTimeout(() => {
          setShow(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Failed to access localStorage for welcome toast:', error);
    }
  }, [currentUser, isLoading, isMounted]);

  if (!show || !currentUser) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-white border border-cleanup-green/20 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-cleanup-green rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              欢迎，{currentUser.username}！
            </h4>
            <p className="text-sm text-gray-600">
              登录成功！现在您可以保存IP形象到工坊，并随时查看您的创作。
            </p>
          </div>
          
          <button
            onClick={() => setShow(false)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => window.location.href = '/workshop'}
            className="flex-1 px-3 py-2 bg-cleanup-green text-black text-sm font-medium rounded hover:bg-green-400 transition-colors"
          >
            查看我的工坊
          </button>
          <button
            onClick={() => setShow(false)}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WelcomeToast() {
  return (
    <ClientOnly>
      <WelcomeToastContent />
    </ClientOnly>
  );
}