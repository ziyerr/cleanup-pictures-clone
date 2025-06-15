'use client';

import { useState } from 'react';
import { Plus, Search, Filter, Grid, List, Share2, Download, Eye } from 'lucide-react';
import { UserIPCharacter } from '../lib/supabase';
import IPImage from './IPImage';

interface IPGalleryProps {
  userIPs: UserIPCharacter[];
  loading: boolean;
  onIPSelect: (ip: UserIPCharacter) => void;
  onRefresh: () => void;
}

export default function IPGallery({ userIPs, loading, onIPSelect, onRefresh }: IPGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  const filteredIPs = userIPs
    .filter(ip => ip.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleShareIP = (ip: UserIPCharacter, event: React.MouseEvent) => {
    event.stopPropagation();
    const shareUrl = `${window.location.origin}/workshop/shared/${ip.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('分享链接已复制到剪贴板！');
  };

  const handleDownloadIP = (ip: UserIPCharacter, event: React.MouseEvent) => {
    event.stopPropagation();
    const link = document.createElement('a');
    link.href = ip.main_image_url;
    link.download = `${ip.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cleanup-green mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-cleanup-green/10 to-blue-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎来到您的IP工坊</h2>
            <p className="text-gray-600">
              在这里管理您的所有IP形象，生成周边商品，并与朋友分享您的创作。
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-cleanup-green text-black font-semibold rounded-xl hover:bg-green-400 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            创建新IP
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索IP形象..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cleanup-green focus:border-cleanup-green"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cleanup-green focus:border-cleanup-green"
          >
            <option value="newest">最新创建</option>
            <option value="oldest">最早创建</option>
            <option value="name">按名称</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{userIPs.length}</div>
          <div className="text-sm text-gray-600">IP形象总数</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {userIPs.reduce((acc, ip) => acc + (ip.merchandise_urls ? Object.keys(ip.merchandise_urls).length : 0), 0)}
          </div>
          <div className="text-sm text-gray-600">周边商品总数</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {userIPs.filter(ip => ip.model_3d_url).length}
          </div>
          <div className="text-sm text-gray-600">3D模型总数</div>
        </div>
      </div>

      {/* IP Gallery */}
      {filteredIPs.length === 0 ? (
        <div className="text-center py-16">
          {searchTerm ? (
            <div>
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">未找到匹配的IP形象</h3>
              <p className="text-gray-600">尝试修改搜索词或创建新的IP形象</p>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有IP形象</h3>
              <p className="text-gray-600 mb-6">开始创建您的第一个专属IP形象吧！</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-cleanup-green text-black font-semibold rounded-xl hover:bg-green-400 transition-colors"
              >
                立即创建
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {filteredIPs.map((ip) => (
            <div
              key={ip.id}
              onClick={() => onIPSelect(ip)}
              className={`group cursor-pointer transition-all duration-200 hover:shadow-lg ${
                viewMode === 'grid'
                  ? 'bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-cleanup-green'
                  : 'bg-white rounded-lg p-4 border border-gray-200 hover:border-cleanup-green flex items-center gap-4'
              }`}
            >
              <div className={viewMode === 'grid' ? 'aspect-square relative' : 'w-20 h-20 flex-shrink-0'}>
                <IPImage
                  src={ip.main_image_url}
                  alt={ip.name}
                  className={`w-full h-full object-cover ${viewMode === 'grid' ? '' : 'rounded-lg'}`}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className={viewMode === 'grid' ? 'p-4' : 'flex-1 min-w-0'}>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{ip.name}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {new Date(ip.created_at).toLocaleDateString('zh-CN')}
                </p>
                
                {/* Quick Actions */}
                <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'justify-between' : ''}`}>
                  <div className="flex items-center gap-1">
                    {ip.merchandise_urls && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {Object.keys(ip.merchandise_urls).length}个周边
                      </span>
                    )}
                    {ip.model_3d_url && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        3D模型
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleShareIP(ip, e)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="分享"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDownloadIP(ip, e)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="下载"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}