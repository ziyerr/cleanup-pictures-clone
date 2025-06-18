'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, Download, Eye, RotateCcw, X } from 'lucide-react';
import type { GenerationTask } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import AuthModal from './AuthModal';
import MerchandiseSelectionModal from './MerchandiseSelectionModal';

interface MerchandiseGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  characterImageUrl: string;
  characterDescription?: string;
}

interface TaskProgress {
  id: string;
  type: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export default function MerchandiseGenerationModal({
  isOpen,
  onClose,
  characterId,
  characterName,
  characterImageUrl,
  characterDescription
}: MerchandiseGenerationModalProps) {
  const { currentUser, setCurrentUser } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  // 初始化任务列表
  const initializeTasks = () => {
    const initialTasks: TaskProgress[] = [
      { id: '', type: 'multi_view_left', name: '左视图生成', status: 'pending' },
      { id: '', type: 'multi_view_back', name: '后视图生成', status: 'pending' },
      { id: '', type: 'merchandise_keychain', name: '钥匙扣设计', status: 'pending' },
      { id: '', type: 'merchandise_fridge_magnet', name: '冰箱贴设计', status: 'pending' },
      { id: '', type: 'merchandise_handbag', name: '手提袋设计', status: 'pending' },
      { id: '', type: 'merchandise_phone_case', name: '手机壳设计', status: 'pending' },
      { id: '', type: '3d_model', name: '3D模型生成', status: 'pending' }
    ];
    setTasks(initialTasks);
  };

  // 从API任务更新本地任务状态
  const updateTasksFromAPI = (apiTasks: GenerationTask[]) => {
    setTasks(prev => prev.map(task => {
      const apiTask = apiTasks.find(t => t.task_type === task.type);
      if (apiTask) {
        const newStatus = apiTask.status;
        const result = apiTask.result_image_url || (apiTask.result_data?.model_url as string);
        return {
          ...task,
          id: apiTask.id,
          status: newStatus,
          result,
          error: apiTask.error_message
        };
      }
      return task;
    }));

    // 更新完成计数
    const completed = apiTasks.filter(t => t.status === 'completed').length;
    setCompletedCount(completed);
  };

  // 轮询任务状态
  useEffect(() => {
    if (!batchId || !isGenerating || !currentUser) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/batch/${batchId}`, {
          headers: {
            'x-user-id': currentUser.id
          }
        });
        
        if (!response.ok) {
          throw new Error('获取批次状态失败');
        }
        
        const data = await response.json();
        updateTasksFromAPI(data.tasks);
        
        // 检查是否所有任务都完成
        const allCompleted = data.tasks.every((t: GenerationTask) => t.status === 'completed' || t.status === 'failed');
        if (allCompleted) {
          setIsGenerating(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error);
      }
    }, 10000); // 每10秒轮询一次

    return () => clearInterval(pollInterval);
  }, [batchId, isGenerating, currentUser]);

  // 处理立即生成按钮 - 改为显示选择模态框
  const handleGenerateClick = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setShowSelectionModal(true);
  };

  // 处理选择性生成
  const handleSelectedGeneration = async (selectedItems: string[]) => {
    if (!currentUser || isGenerating) return;

    setIsGenerating(true);
    setShowSelectionModal(false);

    try {
      console.log('开始生成选中的商品，角色ID:', characterId, '选中项目:', selectedItems);

      // Get the current session token for authentication
      const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('认证token不存在，请重新登录');
      }

      const response = await fetch(`/api/ip/${characterId}/generate-selected`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ selectedItems })
      });

      console.log('API响应状态:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API错误响应:', errorData);
        throw new Error(errorData.error || '启动生成失败');
      }

      const result = await response.json();
      console.log('选择性生成启动成功:', result);
      setBatchId(result.batchId);

      // 根据选中的商品类型初始化任务列表
      const selectedTasks = selectedItems.map(itemType => {
        const taskNames: Record<string, string> = {
          'keychain': '钥匙扣设计',
          'fridge_magnet': '冰箱贴设计',
          'handbag': '手提袋设计',
          'phone_case': '手机壳设计'
        };

        return {
          id: result.taskIds[itemType] || '',
          type: `merchandise_${itemType}`,
          name: taskNames[itemType] || itemType,
          status: 'processing' as const
        };
      });

      setTasks(selectedTasks);

      // 显示成功消息
      alert(`✅ 成功启动 ${result.createdCount} 个商品生成任务！\n\n任务将在后台执行，您可以在任务列表页面查看进度。`);

      // 3秒后自动关闭模态框，让用户去任务列表查看进度
      setTimeout(() => {
        setIsGenerating(false);
        onClose();
      }, 3000);

    } catch (error) {
      console.error('启动选择性生成失败:', error);
      setIsGenerating(false);
      setShowSelectionModal(true); // 重新显示选择模态框

      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`❌ 启动生成失败: ${errorMessage}`);
    }
  };

  // 认证成功后的处理
  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    // 显示选择模态框
    setTimeout(() => setShowSelectionModal(true), 500);
  };

  // 获取状态图标
  const getStatusIcon = (status: TaskProgress['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-6 h-6 rounded-full border-2 border-gray-300" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: TaskProgress['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'processing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
    }
  };

  // 下载结果
  const downloadResult = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  // 预览结果
  const previewResult = (url: string) => {
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (isOpen) {
      initializeTasks();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">IP周边商品生成工坊</h2>
                <p className="text-gray-600 mt-1">为"{characterName}"生成完整周边产品线</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress Bar */}
            {isGenerating && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>整体进度</span>
                  <span>{Math.round(progressPercentage)}% ({completedCount}/{totalTasks})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-cleanup-green h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Original Image */}
            <div className="mb-6 text-center">
              <h3 className="text-lg font-semibold mb-3">原始IP形象</h3>
              <img
                src={characterImageUrl}
                alt={characterName}
                className="w-32 h-32 mx-auto rounded-lg object-cover border-2 border-gray-200"
              />
              <p className="text-sm text-gray-600 mt-2">{characterName}</p>
            </div>

            {/* Generate Button */}
            {!isGenerating && (
              <div className="text-center mb-6">
                <button
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  className={`px-8 py-3 font-bold rounded-xl transition-colors ${
                    isGenerating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-cleanup-green text-black hover:bg-green-400'
                  }`}
                >
                  {isGenerating ? '生成中...' : '选择商品'}
                </button>
                {!currentUser && (
                  <p className="text-sm text-gray-500 mt-2">
                    需要登录后才能生成周边商品
                  </p>
                )}
              </div>
            )}

            {/* Tasks Grid */}
            {isGenerating && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{task.name}</h4>
                      {getStatusIcon(task.status)}
                    </div>
                    
                    <div className={`text-sm ${getStatusColor(task.status)} mb-3`}>
                      {task.status === 'pending' && '等待开始'}
                      {task.status === 'processing' && '生成中...'}
                      {task.status === 'completed' && '生成完成'}
                      {task.status === 'failed' && (task.error || '生成失败')}
                    </div>

                    {/* Result Preview */}
                    {task.status === 'completed' && task.result && (
                      <div className="space-y-2">
                        {task.type === '3d_model' ? (
                          <div className="text-center">
                            <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                              <span className="text-gray-500 text-sm">3D模型</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => previewResult(task.result!)}
                                className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                查看
                              </button>
                              <button
                                onClick={() => downloadResult(task.result!, `${task.name}.glb`)}
                                className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center justify-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                下载
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <img
                              src={task.result}
                              alt={task.name}
                              className="w-full h-24 object-cover rounded-lg mb-2"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => previewResult(task.result!)}
                                className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                查看
                              </button>
                              <button
                                onClick={() => downloadResult(task.result!, `${task.name}.png`)}
                                className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center justify-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                下载
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Retry Button for Failed Tasks */}
                    {task.status === 'failed' && (
                      <button
                        onClick={() => {
                          // TODO: 实现重试逻辑
                          console.log('Retry task:', task.type);
                        }}
                        className="w-full px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        重试
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {isGenerating && (
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>
                  生成过程大约需要5-10分钟，请耐心等待。
                  完成后您可以预览和下载所有周边商品设计。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Merchandise Selection Modal */}
      <MerchandiseSelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        characterId={characterId}
        characterName={characterName}
        characterImageUrl={characterImageUrl}
        onStartGeneration={handleSelectedGeneration}
      />
    </>
  );
}