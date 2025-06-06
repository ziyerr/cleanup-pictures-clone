'use client';

import { useState, useEffect } from 'react';
import { Share2, Download, Edit, Trash2, Eye, ExternalLink, Play } from 'lucide-react';
import { UserIPCharacter } from '../lib/supabase';
import MerchandiseShowcase from './MerchandiseShowcase';
import { useUser } from '../contexts/UserContext';

interface IPDetailProps {
  ipCharacter: UserIPCharacter;
  onBack: () => void;
}

export default function IPDetail({ ipCharacter, onBack }: IPDetailProps) {
  const { currentUser, isLoading } = useUser();
  const [showMerchandiseModal, setShowMerchandiseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'merchandise' | '3d-model'>('overview');

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/workshop/shared/${ipCharacter.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('分享链接已复制到剪贴板！');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = ipCharacter.main_image_url;
    link.download = `${ipCharacter.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateMoreMerchandise = () => {
    setShowMerchandiseModal(true);
  };

  const merchandiseItems = ipCharacter.merchandise_urls ? Object.entries(ipCharacter.merchandise_urls) : [];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{ipCharacter.name}</h1>
          <p className="text-gray-600 mt-1">
            创建于 {new Date(ipCharacter.created_at).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            分享
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            下载
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Edit className="w-4 h-4" />
            编辑
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-cleanup-green text-cleanup-green'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            概览
          </button>
          <button
            onClick={() => setActiveTab('merchandise')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'merchandise'
                ? 'border-cleanup-green text-cleanup-green'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            周边商品 ({merchandiseItems.length})
          </button>
          <button
            onClick={() => setActiveTab('3d-model')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === '3d-model'
                ? 'border-cleanup-green text-cleanup-green'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            3D模型
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Image */}
          <div className="space-y-6">
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              <img
                src={ipCharacter.main_image_url}
                alt={ipCharacter.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Multi-view Images */}
            {(ipCharacter.left_view_url || ipCharacter.back_view_url) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">多视图</h3>
                <div className="grid grid-cols-2 gap-4">
                  {ipCharacter.left_view_url && (
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={ipCharacter.left_view_url}
                        alt="左视图"
                        className="w-full h-full object-cover"
                      />
                      <p className="text-center text-sm text-gray-600 mt-2">左视图</p>
                    </div>
                  )}
                  {ipCharacter.back_view_url && (
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={ipCharacter.back_view_url}
                        alt="后视图"
                        className="w-full h-full object-cover"
                      />
                      <p className="text-center text-sm text-gray-600 mt-2">后视图</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">名称</dt>
                  <dd className="text-sm text-gray-900">{ipCharacter.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(ipCharacter.created_at).toLocaleString('zh-CN')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">状态</dt>
                  <dd className="text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      已完成
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">内容统计</h3>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
              <div className="space-y-3">
                <button
                  onClick={handleGenerateMoreMerchandise}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cleanup-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  生成更多周边
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  查看公开页面
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'merchandise' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">周边商品</h3>
            <button
              onClick={handleGenerateMoreMerchandise}
              className="flex items-center gap-2 px-4 py-2 bg-cleanup-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
            >
              <Play className="w-4 h-4" />
              生成更多
            </button>
          </div>

          {merchandiseItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有周边商品</h3>
              <p className="text-gray-600 mb-6">开始为您的IP形象生成精美的周边商品吧！</p>
              <button
                onClick={handleGenerateMoreMerchandise}
                className="px-6 py-3 bg-cleanup-green text-black font-semibold rounded-xl hover:bg-green-400 transition-colors"
              >
                立即生成
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {merchandiseItems.map(([type, url]) => (
                <div key={type} className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-cleanup-green transition-colors">
                  <div className="aspect-square relative">
                    <img
                      src={url}
                      alt={type}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900">
                      {type === 'keychain' && '钥匙扣'}
                      {type === 'fridge_magnet' && '冰箱贴'}
                      {type === 'handbag' && '手提袋'}
                      {type === 'phone_case' && '手机壳'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">准备就绪</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === '3d-model' && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">3D模型</h3>
          
          {ipCharacter.model_3d_url ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">3D模型文件</h4>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                    <Eye className="w-4 h-4" />
                    预览
                  </button>
                  <button
                    onClick={() => window.open(ipCharacter.model_3d_url, '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                </div>
              </div>
              
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ExternalLink className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">3D模型预览</p>
                  <p className="text-sm text-gray-500 mt-1">点击预览按钮查看模型</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有3D模型</h3>
              <p className="text-gray-600 mb-6">生成3D模型需要先创建多视图图像</p>
              <button
                onClick={handleGenerateMoreMerchandise}
                className="px-6 py-3 bg-cleanup-green text-black font-semibold rounded-xl hover:bg-green-400 transition-colors"
              >
                开始生成
              </button>
            </div>
          )}
        </div>
      )}

      {/* Merchandise Generation Modal */}
      {showMerchandiseModal && currentUser && !isLoading && (
        <MerchandiseShowcase
          originalImageUrl={ipCharacter.main_image_url}
          prompt={`为IP形象"${ipCharacter.name}"生成周边商品`}
          userId={currentUser.id}
          onClose={() => setShowMerchandiseModal(false)}
        />
      )}
    </div>
  );
}