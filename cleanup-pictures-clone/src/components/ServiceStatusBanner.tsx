'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, X } from 'lucide-react';

interface ServiceStatusBannerProps {
  onRetry?: () => void;
}

export default function ServiceStatusBanner({ onRetry }: ServiceStatusBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    
    // 简单的服务状态检查
    try {
      const response = await fetch('/api/test-ai');
      const data = await response.json();
      
      if (data.success) {
        setIsVisible(false);
        if (onRetry) onRetry();
      }
    } catch (error) {
      console.error('Service check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            AI图像生成服务暂时维护中
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>我们的AI图像生成服务正在进行例行维护，预计很快恢复。</p>
            <div className="mt-3 space-y-2">
              <p className="font-medium">您可以：</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>稍后重试生成功能</li>
                <li>先上传图片准备素材</li>
                <li>浏览已有的IP形象作品</li>
                <li>联系客服获取最新状态</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-3">
            <button
              onClick={handleRetry}
              disabled={isChecking}
              className="inline-flex items-center px-3 py-1.5 border border-amber-300 text-sm font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  检查中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  重新检查
                </>
              )}
            </button>
            <span className="text-xs text-amber-600">
              最后更新: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-amber-400 hover:text-amber-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
