'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Share2, Download, Edit, Trash2, Eye, ExternalLink, Play, Pencil, Check, Loader2 as Loader, AlertCircle, Wand2 } from 'lucide-react';
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

// 自定义周边生成状态
type CustomMerchandiseState = 
  | 'idle'           // 初始状态
  | 'submitting'     // 正在提交API请求
  | 'confirmed'      // API确认任务创建成功
  | 'generating'     // 正在生成中
  | 'completed'      // 已完成
  | 'failed';        // 失败

interface CustomGenerationTask {
  id: string;
  name: string;
  status: CustomMerchandiseState;
  error?: string;
  createdAt: number;
}

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
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [customGenerations, setCustomGenerations] = useState<CustomGenerationTask[]>([]);
  const fetchStatusRef = useRef<() => Promise<void>>();

  const fetchStatus = useCallback(async () => {
    try {
      setNetworkError(null); // 清除之前的网络错误
      
      // 直接使用客户端Supabase调用，而不是API端点
      const { getIPCharacterWithStatus, getCharacterTasks } = await import('../lib/supabase');
      const data = await getIPCharacterWithStatus(ipCharacter.id);
      
      if (!data) {
        throw new Error('IP角色不存在或无权访问');
      }
      
      console.log('IPDetail - 获取到的IP状态数据:', data);
      setCharacterStatus(data);
      
      // 获取正在进行的真实任务
      try {
        const tasks = await getCharacterTasks(ipCharacter.id);
        console.log('IPDetail - 获取到的所有任务:', tasks.map(t => ({ id: t.id, type: t.task_type, status: t.status })));
        
        const activeTasks = tasks.filter(task => 
          task.status === 'pending' || task.status === 'processing'
        );
        
        setPendingTasks(activeTasks);
        console.log('IPDetail - 设置进行中任务:', activeTasks.map(t => ({ id: t.id, type: t.task_type, status: t.status })));
        
        // 同步自定义生成任务状态
        setCustomGenerations(prev => prev.map(customTask => {
          const realTask = activeTasks.find(t => 
            t.task_type === 'merchandise_custom' && 
            (t.id === customTask.id || t.prompt?.includes(customTask.name))
          );
          
          if (realTask) {
            const newStatus: CustomMerchandiseState = 
              realTask.status === 'pending' ? 'confirmed' :
              realTask.status === 'processing' ? 'generating' : 
              customTask.status;
            
            console.log(`IPDetail - 同步自定义任务状态: ${customTask.name} ${customTask.status} → ${newStatus}`);
            return { ...customTask, status: newStatus, id: realTask.id };
          }
          
          return customTask;
        }));
        
      } catch (taskError) {
        console.warn('获取任务列表失败:', taskError);
        
        // 如果是网络错误，设置错误状态但不抛出异常
        if (taskError instanceof Error && taskError.message.includes('Failed to fetch')) {
          setNetworkError('网络连接不稳定，部分数据可能无法显示');
        }
        setPendingTasks([]);
      }
      
      // 如果有新的周边商品数据，同步更新到父组件
      if (data.merchandise_urls && Object.keys(data.merchandise_urls).length > 0) {
        console.log('IPDetail - 发现周边商品数据，更新父组件:', data.merchandise_urls);
        onUpdate(data);
        
        // 检查自定义生成任务是否已完成
        const currentMerchandiseKeys = Object.keys(data.merchandise_urls);
        setCustomGenerations(prev => prev.map(customTask => {
          // 检查是否有对应的周边商品已生成
          const isCompleted = currentMerchandiseKeys.some(key => 
            key.includes(customTask.id) || key.includes('custom_')
          );
          
          if (isCompleted && customTask.status !== 'completed') {
            console.log(`IPDetail - 自定义任务已完成: ${customTask.name}`);
            return { ...customTask, status: 'completed' };
          }
          
          return customTask;
        }));
      }
    } catch (error) {
      console.error('获取IP状态失败:', error);
      
      // 如果是网络错误，设置友好的错误消息
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setNetworkError('网络连接不稳定，请检查网络后刷新页面');
      } else {
        setNetworkError('数据加载失败，请稍后重试');
      }
      
      setCharacterStatus(null); // Set to null on error to show error state
    }
  }, [ipCharacter.id]); // 移除 onUpdate 依赖，避免循环

  // 将 fetchStatus 保存到 ref 中
  useEffect(() => {
    fetchStatusRef.current = fetchStatus;
  }, [fetchStatus]);

  // Effect for initial load
  useEffect(() => {
    setIsLoading(true);
    fetchStatus().finally(() => setIsLoading(false));
  }, [fetchStatus]);

  // Effect for polling - 优化为2秒间隔
  useEffect(() => {
    const hasActiveTasks = pendingTasks.length > 0;
    const hasActiveCustomGenerations = customGenerations.some(task => 
      task.status === 'confirmed' || task.status === 'generating'
    );
    const shouldPoll = hasActiveTasks || hasActiveCustomGenerations;
    
    console.log('IPDetail - 轮询检查:', {
      shouldPoll,
      hasActiveTasks,
      hasActiveCustomGenerations,
      pendingTasksCount: pendingTasks.length,
      customGenerationsCount: customGenerations.length,
      isLoading
    });
    
    if (!shouldPoll || isLoading) {
      return;
    }

    const intervalId = setInterval(() => {
      console.log('IPDetail - 执行定时轮询 (2秒间隔)');
      if (fetchStatusRef.current) {
        fetchStatusRef.current();
      }
    }, 2000); // Poll every 2 seconds for better responsiveness

    return () => {
      console.log('IPDetail - 清除轮询定时器');
      clearInterval(intervalId);
    };
  }, [pendingTasks.length, customGenerations.length, isLoading]);

  // 清理过期的自定义生成任务
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setCustomGenerations(prev => prev.filter(task => {
        const taskAge = Date.now() - task.createdAt;
        const shouldKeep = task.status === 'submitting' || 
                          task.status === 'confirmed' || 
                          task.status === 'generating' ||
                          (taskAge < 10 * 60 * 1000); // 保留10分钟内的完成/失败任务
        
        if (!shouldKeep) {
          console.log(`IPDetail - 清理过期任务: ${task.name} (${task.status})`);
        }
        
        return shouldKeep;
      }));
    }, 60000); // 每分钟清理一次

    return () => clearInterval(cleanupInterval);
  }, []);

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
    const taskId = `custom_${Date.now()}`;
    
    try {
      console.log('🎯 开始自定义周边生成流程:', merchandiseData);
      
      // 第一步：立即显示"提交中"状态  
      const newCustomTask: CustomGenerationTask = {
        id: taskId,
        name: merchandiseData.name,
        status: 'submitting',
        createdAt: Date.now()
      };
      
      setCustomGenerations(prev => [...prev, newCustomTask]);
      console.log('✅ 步骤1: 创建提交中状态', newCustomTask);
      
      // 第二步：调用API
      const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('认证token不存在，请重新登录');
      }

      if (!currentUser?.id) {
        throw new Error('用户信息不存在，请重新登录');
      }

      console.log('🚀 步骤2: 发送API请求');

      const response = await fetch(`/api/ip/${ipCharacter.id}/generate-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(merchandiseData),
        signal: AbortSignal.timeout(15000) // 15秒超时
      });

      console.log('📡 API响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API错误响应:', errorText);
        
        let errorMessage = '自定义生成启动失败';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ 步骤3: API成功响应', result);

      // 第三步：更新为"已确认"状态
      setCustomGenerations(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'confirmed', id: result.taskId || taskId }
          : task
      ));
      
      console.log('✅ 步骤4: 更新为已确认状态');

      // 第四步：开始轮询监控
      setTimeout(() => {
        if (fetchStatusRef.current) {
          fetchStatusRef.current();
          console.log('🔄 步骤5: 开始轮询监控任务状态');
        }
      }, 1000);

      // 显示成功反馈
      const successMessage = `✅ "${merchandiseData.name}" 生成任务已确认！\n\n正在后台处理，预计2-5分钟完成。`;
      alert(successMessage);

    } catch (error) {
      console.error('❌ 自定义周边生成失败:', error);
      
      // 失败时回滚状态
      setCustomGenerations(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'failed', error: (error as Error).message }
          : task
      ));
      
      const errorMessage = `❌ "${merchandiseData.name}" 生成失败\n\n${(error as Error).message}\n\n请检查网络连接后重试。`;
      alert(errorMessage);
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
      {/* 网络错误提示 */}
      {networkError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">连接问题</h3>
            <p className="text-sm text-yellow-700 mt-1">{networkError}</p>
            <button
              onClick={() => {
                setNetworkError(null);
                fetchStatus();
              }}
              className="text-sm text-yellow-800 underline mt-2 hover:text-yellow-900"
            >
              重试连接
            </button>
          </div>
        </div>
      )}

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
            <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              <IPImage
                src={ipCharacter.main_image_url}
                alt={ipCharacter.name}
                className="w-full h-full object-cover"
              />
              
            </div>
            
            {/* 悬浮装饰图标 - 4个核心产品，悬浮在图片边缘外 */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* 30+ 产品标识 - 右上角悬浮 */}
              <div className="absolute -top-8 -right-8 w-16 h-16 bg-cleanup-green rounded-full flex items-center justify-center shadow-xl border-4 border-white hover:scale-110 transition-transform">
                <span className="text-black font-bold text-xs">30+</span>
              </div>
              
              {/* 手机壳 - 左上角往下移120px */}
              <div className="absolute -left-6 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-xl border-2 border-cleanup-green hover:scale-110 transition-transform" style={{top: '120px'}}>
                <span className="text-lg">📱</span>
              </div>
              
                             {/* 钥匙扣 - 左下角外侧悬浮 */}
               <div className="absolute -left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-200 hover:scale-110 transition-transform" style={{bottom: '-24px'}}>
                 <span className="text-sm">🗝️</span>
               </div>
               
               {/* 衣服 - 右下角外侧悬浮 */}
               <div className="absolute -right-6 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-xl border border-gray-200 hover:scale-110 transition-transform" style={{bottom: '-24px'}}>
                 <span className="text-lg">👕</span>
               </div>
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
              {(isGenerating || 
                pendingTasks.length > 0 || 
                customGenerations.some(task => task.status !== 'completed' && task.status !== 'failed')) && (
                <button
                  onClick={() => window.open('/tasks', '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Loader className="w-4 h-4 animate-spin" />
                  生成中的任务 ({pendingTasks.length + customGenerations.filter(task => task.status !== 'completed' && task.status !== 'failed').length})
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

          {merchandiseItems.length === 0 && 
           pendingTasks.filter(task => task.task_type?.includes('merchandise')).length === 0 &&
           customGenerations.filter(task => task.status !== 'completed' && task.status !== 'failed').length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有周边商品</h3>
              <p className="text-gray-600 mb-6">开始为您的IP形象生成精美的周边商品吧！</p>

              <div className="flex items-center justify-center gap-4">
                {/* 生成中的任务按钮 */}
                {(isGenerating || 
                  pendingTasks.length > 0 || 
                  customGenerations.some(task => task.status !== 'completed' && task.status !== 'failed')) && (
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
              {/* 已完成的周边商品 */}
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
                      {type.startsWith('custom_') && (
                        pendingTasks.find(task => task.id === type.replace('custom_', ''))?.prompt?.split('。')[0]?.replace('设计一个名为"', '')?.replace('"的周边商品', '') || '自定义周边'
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">准备就绪</p>
                  </div>
                </div>
              ))}
              
              {/* 系统周边商品任务 */}
              {pendingTasks.filter(task => task.task_type?.includes('merchandise')).map((task) => (
                <div key={task.id} className="bg-white rounded-xl overflow-hidden border border-blue-200 relative">
                  <div className="aspect-square relative bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {task.status === 'pending' ? '排队中' : '生成中'}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-1">系统周边</h4>
                    <p className="text-sm text-blue-600 flex items-center gap-1">
                      <Loader className="w-3 h-3 animate-spin" />
                      {task.status === 'pending' ? '等待生成...' : '正在生成...'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">预计完成时间：2-5分钟</p>
                  </div>
                </div>
              ))}

              {/* 自定义周边商品任务 */}
              {customGenerations.filter(task => task.status !== 'completed' && task.status !== 'failed').map((task) => {
                const getStatusColor = () => {
                  switch (task.status) {
                    case 'submitting': return 'bg-yellow-500';
                    case 'confirmed': return 'bg-green-500';
                    case 'generating': return 'bg-blue-500';
                    default: return 'bg-gray-500';
                  }
                };

                const getStatusText = () => {
                  switch (task.status) {
                    case 'submitting': return '提交中...';
                    case 'confirmed': return '已确认';
                    case 'generating': return '生成中';
                    default: return '处理中';
                  }
                };

                return (
                  <div key={task.id} className="bg-white rounded-xl overflow-hidden border border-green-200 relative">
                    <div className="aspect-square relative bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
                      {/* 状态图标 */}
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Wand2 className="w-6 h-6 text-green-500" />
                        </div>
                      </div>
                      
                      {/* 状态标签 */}
                      <div className={`absolute top-2 right-2 ${getStatusColor()} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                        {getStatusText()}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-1">{task.name}</h4>
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Loader className="w-3 h-3 animate-spin" />
                        {task.status === 'submitting' && '正在提交请求...'}
                        {task.status === 'confirmed' && '任务已确认，排队中...'}
                        {task.status === 'generating' && '正在生成中...'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {task.status === 'submitting' && '预计提交时间：10秒内'}
                        {task.status === 'confirmed' && '预计开始时间：30秒内'}  
                        {task.status === 'generating' && '预计完成时间：2-5分钟'}
                      </p>
                      
                      {task.error && (
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {task.error}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
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