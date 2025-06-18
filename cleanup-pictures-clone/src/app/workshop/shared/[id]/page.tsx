'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Share2, Download, Heart, Eye, ExternalLink, Home } from 'lucide-react';
import type { UserIPCharacter } from '../../../../lib/supabase';

export default function SharedIPPage() {
  const params = useParams();
  const router = useRouter();
  const [ipCharacter, setIPCharacter] = useState<UserIPCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (params.id) {
      loadSharedIP(params.id as string);
    }
  }, [params.id]);

  const loadSharedIP = async (id: string) => {
    try {
      // TODO: Load shared IP character from database
      // For now, use mock data
      const mockIP: UserIPCharacter = {
        id: id,
        user_id: 'mock-user',
        name: 'Kawaii小熊分享版',
        main_image_url: 'https://example.com/shared-ip.png',
        left_view_url: 'https://example.com/left.png',
        back_view_url: 'https://example.com/back.png',
        model_3d_url: 'https://example.com/model.glb',
        merchandise_urls: {
          keychain: 'https://example.com/keychain.png',
          phone_case: 'https://example.com/phone.png',
          handbag: 'https://example.com/bag.png',
          fridge_magnet: 'https://example.com/magnet.png'
        },
        created_at: new Date().toISOString()
      };
      
      setIPCharacter(mockIP);
      setLikeCount(Math.floor(Math.random() * 100) + 10);
    } catch (error) {
      console.error('加载分享IP失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const shareData = {
      title: `查看这个精美的IP形象：${ipCharacter?.name}`,
      text: '这是一个用AI生成的专属IP形象，包含多种周边商品设计！',
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('分享链接已复制到剪贴板！');
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleDownload = () => {
    if (!ipCharacter) return;
    const link = document.createElement('a');
    link.href = ipCharacter.main_image_url;
    link.download = `${ipCharacter.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cleanup-green mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!ipCharacter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">IP形象不存在</h1>
          <p className="text-gray-600 mb-6">您访问的IP形象可能已被删除或链接有误</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-cleanup-green text-black font-semibold rounded-xl hover:bg-green-400 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const merchandiseItems = ipCharacter.merchandise_urls ? Object.entries(ipCharacter.merchandise_urls) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-4"
              >
                <Home className="w-5 h-5" />
                IP形象分享
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  liked 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                {likeCount}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                分享
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Main Image and Views */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              <img
                src={ipCharacter.main_image_url}
                alt={ipCharacter.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Multi-view Images */}
            {(ipCharacter.left_view_url || ipCharacter.back_view_url) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">多角度视图</h3>
                <div className="grid grid-cols-2 gap-4">
                  {ipCharacter.left_view_url && (
                    <div className="bg-white rounded-lg overflow-hidden shadow">
                      <div className="aspect-square">
                        <img
                          src={ipCharacter.left_view_url}
                          alt="左视图"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-center">
                        <p className="text-sm text-gray-600">左视图</p>
                      </div>
                    </div>
                  )}
                  {ipCharacter.back_view_url && (
                    <div className="bg-white rounded-lg overflow-hidden shadow">
                      <div className="aspect-square">
                        <img
                          src={ipCharacter.back_view_url}
                          alt="后视图"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-center">
                        <p className="text-sm text-gray-600">后视图</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Info and Actions */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{ipCharacter.name}</h1>
              <p className="text-gray-600 mb-4">
                创建于 {new Date(ipCharacter.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Eye className="w-4 h-4" />
                  <span>{Math.floor(Math.random() * 500) + 100} 次查看</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Heart className="w-4 h-4" />
                  <span>{likeCount} 个赞</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cleanup-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  下载图片
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  创建我的IP
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">内容统计</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cleanup-green">{merchandiseItems.length}</div>
                  <div className="text-sm text-gray-600">周边商品</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {ipCharacter.model_3d_url ? '1' : '0'}
                  </div>
                  <div className="text-sm text-gray-600">3D模型</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(ipCharacter.left_view_url ? 1 : 0) + (ipCharacter.back_view_url ? 1 : 0) + 1}
                  </div>
                  <div className="text-sm text-gray-600">视图角度</div>
                </div>
              </div>
            </div>

            {/* 3D Model */}
            {ipCharacter.model_3d_url && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">3D模型</h3>
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <ExternalLink className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">3D模型预览</p>
                  </div>
                </div>
                <button
                  onClick={() => window.open(ipCharacter.model_3d_url, '_blank')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  查看3D模型
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Merchandise Gallery */}
        {merchandiseItems.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">周边商品展示</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {merchandiseItems.map(([type, url]) => (
                <div key={type} className="bg-white rounded-xl overflow-hidden shadow-lg group">
                  <div className="aspect-square relative">
                    <img
                      src={url}
                      alt={type}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <button
                        onClick={() => window.open(url, '_blank')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 rounded-full hover:bg-white"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900">
                      {type === 'keychain' && '钥匙扣'}
                      {type === 'fridge_magnet' && '冰箱贴'}
                      {type === 'handbag' && '手提袋'}
                      {type === 'phone_case' && '手机壳'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">AI生成设计</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center bg-gradient-to-r from-cleanup-green/10 to-blue-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">喜欢这个IP形象？</h2>
          <p className="text-gray-600 mb-6">
            立即创建您自己的专属IP形象，生成独特的周边商品设计！
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-cleanup-green text-black font-bold rounded-xl hover:bg-green-400 transition-colors"
          >
            开始创建我的IP
          </button>
        </div>
      </div>
    </div>
  );
}