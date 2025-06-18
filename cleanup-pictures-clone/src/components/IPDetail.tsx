'use client';

import { useState, useEffect, useCallback } from 'react';
import { Share2, Download, Edit, Trash2, Eye, ExternalLink, Play, Pencil, Check, Loader2 as Loader, AlertCircle } from 'lucide-react';
import type { UserIPCharacter } from '../lib/supabase';
import MerchandiseGenerationModal from './MerchandiseGenerationModal';
import TaskListModal from './TaskListModal';
import CustomMerchandiseModal from './CustomMerchandiseModal';
import IPImage from './IPImage';
import { useUser } from '../contexts/UserContext';

interface IPDetailProps {
  ipCharacter: UserIPCharacter;
  onBack: () => void;
  onUpdate: (updatedCharacter: UserIPCharacter) => void;
}

type IPCharacterWithStatus = UserIPCharacter & {
  initial_task_status: 'pending' | 'processing' | 'completed' | 'failed' | 'unknown';
  merchandise_task_status: 'pending' | 'processing' | null;
};

export default function IPDetail({ ipCharacter, onBack, onUpdate }: IPDetailProps) {
  const { currentUser } = useUser();
  const [showMerchandiseModal, setShowMerchandiseModal] = useState(false);
  const [showCustomMerchandiseModal, setShowCustomMerchandiseModal] = useState(false);
  const [showTaskListModal, setShowTaskListModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'merchandise' | '3d-model'>('merchandise');
  const [characterStatus, setCharacterStatus] = useState<IPCharacterWithStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingHeaderName, setIsEditingHeaderName] = useState(false);
  const [isEditingInfoName, setIsEditingInfoName] = useState(false);
  const [newName, setNewName] = useState(ipCharacter.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      // 直接使用客户端Supabase调用，而不是API端点
      const { getIPCharacterWithStatus } = await import('../lib/supabase');
      const data = await getIPCharacterWithStatus(ipCharacter.id);
      
      if (!data) {
        throw new Error('IP角色不存在或无权访问');
      }
      
      console.log('IPDetail - 获取到的IP状态数据:', data);
      setCharacterStatus(data);
      
      // 如果有新的周边商品数据，同步更新到父组件
      if (data.merchandise_urls && Object.keys(data.merchandise_urls).length > 0) {
        console.log('IPDetail - 发现周边商品数据，更新父组件:', data.merchandise_urls);
        onUpdate(data);
      }
    } catch (error) {
      console.error('获取IP状态失败:', error);
      setCharacterStatus(null); // Set to null on error to show error state
    }
  }, [ipCharacter.id, onUpdate]);

  // Effect for initial load
  useEffect(() => {
    setIsLoading(true);
    fetchStatus().finally(() => setIsLoading(false));
  }, [fetchStatus]);

  // Effect for polling
  useEffect(() => {
    const shouldPoll = characterStatus?.initial_task_status !== 'completed' || characterStatus?.merchandise_task_status === 'processing';
    console.log('IPDetail - 轮询检查:', {
      shouldPoll,
      initial_task_status: characterStatus?.initial_task_status,
      merchandise_task_status: characterStatus?.merchandise_task_status,
      isLoading
    });
    
    if (!shouldPoll || isLoading) {
      return;
    }

    const intervalId = setInterval(() => {
      console.log('IPDetail - 执行定时轮询');
      fetchStatus();
    }, 5000); // Poll every 5 seconds

    return () => {
      console.log('IPDetail - 清除轮询定时器');
      clearInterval(intervalId);
    };
  }, [characterStatus, fetchStatus, isLoading]);

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
  
  const handleNameSave = async (from: 'header' | 'info') => {
    if (newName.trim() === '' || newName === ipCharacter.name) {
      if (from === 'header') setIsEditingHeaderName(false);
      if (from === 'info') setIsEditingInfoName(false);
      setNewName(ipCharacter.name);
      return;
    }
    
    setIsSaving(true);

    try {
      const response = await fetch(`/api/ip/${ipCharacter.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error('名称更新失败');
      }

      const updatedCharacter = await response.json();
      onUpdate(updatedCharacter); 
      if (from === 'header') setIsEditingHeaderName(false);
      if (from === 'info') setIsEditingInfoName(false);
    } catch (error) {
      console.error('Failed to update IP name:', error);
      alert('更新失败，请稍后再试。');
      setNewName(ipCharacter.name);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateMoreMerchandise = async () => {
    if (isGenerating || characterStatus?.merchandise_task_status === 'processing') return;

    setIsGenerating(true);
    try {
      // Get the current session token for authentication
      const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('认证token不存在，请重新登录');
      }

      const response = await fetch(`/api/ip/${ipCharacter.id}/generate-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '生成任务启动失败' }));
        throw new Error(errorData.error);
      }
      
      // Manually trigger a status fetch to update UI immediately
      await fetchStatus();
      
    } catch (error) {
      console.error('Failed to start generation task:', error);
      alert(`启动失败: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleViewPublicPage = () => {
    // Placeholder action
    alert('即将推出：查看公开分享页面！');
  };

  const handleCustomMerchandiseGeneration = async (merchandiseData: {
    name: string;
    description: string;
    referenceImageUrl?: string;
  }) => {
    try {
      // Get the current session token for authentication
      const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('认证token不存在，请重新登录');
      }

      const response = await fetch(`/api/ip/${ipCharacter.id}/generate-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(merchandiseData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '自定义生成启动失败' }));
        throw new Error(errorData.error);
      }

      const result = await response.json();
      console.log('自定义周边生成任务已启动:', result);

      // 立即刷新状态以显示新任务
      await fetchStatus();

      alert(`成功启动"${merchandiseData.name}"的生成任务！`);

    } catch (error) {
      console.error('启动自定义周边生成失败:', error);
      alert(`启动失败: ${(error as Error).message}`);
    }
  };

  // 使用最新的角色状态数据，如果可用的话，确保数据一致性
  const currentCharacterData = characterStatus || ipCharacter;
  const merchandiseItems = currentCharacterData.merchandise_urls ? Object.entries(currentCharacterData.merchandise_urls) : [];
  
  console.log('IPDetail - 当前角色数据:', {
    id: currentCharacterData.id,
    name: currentCharacterData.name,
    merchandise_urls: currentCharacterData.merchandise_urls,
    merchandise_count: merchandiseItems.length,
    merchandise_task_status: currentCharacterData.merchandise_task_status
  });

  const renderActionButton = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center gap-2 w-full px-4 py-3 text-gray-500 bg-gray-100 rounded-lg">
          <Loader className="w-5 h-5 animate-spin" />
          <span className="font-semibold">正在加载状态...</span>
        </div>
      );
    }

    if (!characterStatus || characterStatus.initial_task_status === 'unknown') {
       return (
        <div className="flex items-center justify-center gap-2 w-full px-4 py-3 text-red-700 bg-red-100 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">无法获取IP状态</span>
        </div>
      );
    }
    
    // As per request, hide button when initial generation is complete.
    if (characterStatus.initial_task_status === 'completed') {
      return null;
    }

    // When merchandise is being created
    if (characterStatus.merchandise_task_status) {
      return (
        <button
          onClick={() => setShowTaskListModal(true)}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors animate-pulse"
        >
          <Loader className="w-5 h-5" />
          <span className="font-semibold">IP周边创作中</span>
        </button>
      );
    }
    
    // Default button state
    return (
      <button
        onClick={() => setShowMerchandiseModal(true)}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
      >
        <Play className="w-5 h-5" />
        <span className="font-semibold">一键生成IP周边</span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditingHeaderName ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => handleNameSave('header')}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave('header')}
              className="text-3xl font-bold text-gray-900 bg-gray-100 rounded-md px-2 -mx-2"
              autoFocus
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900">{ipCharacter.name}</h1>
          )}
          <button onClick={() => !isSaving && setIsEditingHeaderName(!isEditingHeaderName)} className="text-gray-400 hover:text-gray-700 disabled:opacity-50 flex-shrink-0" disabled={isSaving}>
            {isSaving && isEditingHeaderName ? <Loader className="w-5 h-5 animate-spin" /> : isEditingHeaderName ? <Check className="w-6 h-6" /> : <Pencil className="w-5 h-5" />}
          </button>
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
              <IPImage
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
                      <IPImage
                        src={ipCharacter.left_view_url}
                        alt="左视图"
                        className="w-full h-full object-cover"
                      />
                      <p className="text-center text-sm text-gray-600 mt-2">左视图</p>
                    </div>
                  )}
                  {ipCharacter.back_view_url && (
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <IPImage
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
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">名称</dt>
                  <dd className="text-sm text-gray-900 flex items-center gap-2">
                    {isEditingInfoName ? (
                       <input
                         type="text"
                         value={newName}
                         onChange={(e) => setNewName(e.target.value)}
                         onBlur={() => handleNameSave('info')}
                         onKeyDown={(e) => e.key === 'Enter' && handleNameSave('info')}
                         className="flex-grow text-sm bg-gray-100 rounded-md px-2 py-1"
                         autoFocus
                       />
                    ) : (
                      <span className="flex-grow">{ipCharacter.name}</span>
                    )}
                     <button onClick={() => !isSaving && setIsEditingInfoName(!isEditingInfoName)} className="text-gray-400 hover:text-gray-700 disabled:opacity-50 flex-shrink-0" disabled={isSaving}>
                        {isSaving && isEditingInfoName ? <Loader className="w-4 h-4 animate-spin" /> : isEditingInfoName ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                     </button>
                  </dd>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">操作</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderActionButton()}
                <button
                  onClick={handleViewPublicPage}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  <span className="font-semibold">查看公开页面</span>
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
            <div className="flex items-center gap-3">
              {/* 生成中的任务按钮 */}
              {(isGenerating || characterStatus?.merchandise_task_status === 'processing') && (
                <button
                  onClick={() => window.open('/tasks', '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Loader className="w-4 h-4 animate-spin" />
                  生成中的任务
                </button>
              )}

              {/* 创建更多周边按钮 - 始终可点击 */}
              <button
                onClick={() => setShowCustomMerchandiseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cleanup-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
              >
                <Play className="w-4 h-4" />
                创建更多周边
              </button>
            </div>
          </div>

          {merchandiseItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有周边商品</h3>
              <p className="text-gray-600 mb-6">开始为您的IP形象生成精美的周边商品吧！</p>

              <div className="flex items-center justify-center gap-4">
                {/* 生成中的任务按钮 */}
                {(isGenerating || characterStatus?.merchandise_task_status === 'processing') && (
                  <button
                    onClick={() => window.open('/tasks', '_blank')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-colors"
                  >
                    <Loader className="w-5 h-5 animate-spin" />
                    生成中的任务
                  </button>
                )}

                {/* 立即生成按钮 - 始终可点击 */}
                <button
                  onClick={() => setShowCustomMerchandiseModal(true)}
                  className="px-6 py-3 bg-cleanup-green text-black font-semibold rounded-xl hover:bg-green-400 transition-colors"
                >
                  立即生成
                </button>
              </div>
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
      <MerchandiseGenerationModal
        isOpen={showMerchandiseModal}
        onClose={() => setShowMerchandiseModal(false)}
        characterId={ipCharacter.id}
        characterName={ipCharacter.name}
        characterImageUrl={ipCharacter.main_image_url}
        characterDescription={ipCharacter.description}
      />

      {/* Task List Modal */}
      <TaskListModal
        isOpen={showTaskListModal}
        onClose={() => setShowTaskListModal(false)}
        characterId={ipCharacter.id}
      />

      {/* Custom Merchandise Modal */}
      <CustomMerchandiseModal
        isOpen={showCustomMerchandiseModal}
        onClose={() => setShowCustomMerchandiseModal(false)}
        characterId={ipCharacter.id}
        characterName={ipCharacter.name}
        characterImageUrl={ipCharacter.main_image_url}
        onStartGeneration={handleCustomMerchandiseGeneration}
      />
    </div>
  );
}