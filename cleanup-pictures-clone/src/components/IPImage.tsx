'use client';

import { useState } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface IPImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}

export default function IPImage({ src, alt, className = '', fallback }: IPImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 调试：输出图片URL到控制台
  console.log('IPImage URL:', src);

  const handleImageError = () => {
    console.error('图片加载失败:', src);
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center p-4">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">图片加载失败</p>
          {fallback && (
            <button 
              onClick={() => {
                setImageError(false);
                setIsLoading(true);
              }}
              className="text-xs text-blue-500 hover:text-blue-700 mt-1"
            >
              重试
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${className}`}>
          <div className="animate-pulse">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        crossOrigin="anonymous"
      />
    </div>
  );
}