'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, Download, Eye, RotateCcw, X, Clock, Zap } from 'lucide-react';
import type { GenerationTask } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';

interface TaskListModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId?: string; // 如果提供，只显示该角色的任务
}

interface TaskWithCharacter extends GenerationTask {
  character_name?: string;
  character_image?: string;
}

export default function TaskListModal({ 
  isOpen,
  onClose,
  characterId 
}: TaskListModalProps) {
  const { currentUser } = useUser();
  const [tasks, setTasks] = useState<TaskWithCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');

  // 获取任务列表
  const fetchTasks = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      let url = '/api/tasks';
      if (characterId) {
        url = `/api/ip/${characterId}/tasks`;
      }
      
      const response = await fetch(url, {
        headers: {
          'x-user-id': currentUser.id
        }
      });
      
      if (!response.ok) {
        throw new Error('获取任务列表失败');
      }
      
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 轮询更新任务状态
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    fetchTasks();
    
    const pollInterval = setInterval(() => {
      fetchTasks();
    }, 15000); // 每15秒更新一次

    return () => clearInterval(pollInterval);
  }, [isOpen, currentUser, characterId]);

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  // 获取状态图标
  const getStatusIcon = (status: GenerationTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  // 获取状态文本
  const getStatusText = (status: GenerationTask['status']) => {
    switch (status) {
      case 'pending': return '等待中';
      case 'processing': return '生成中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: GenerationTask['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
    }
  };

  // 获取任务类型显示名称
  const getTaskTypeName = (taskType: string) => {
    const typeMap: Record<string, string> = {
      'ip_generation': 'IP形象生成',
      'multi_view_left': '左视图生成',
      'multi_view_back': '后视图生成',
      'multi_view_right': '右视图生成',
      '3d_model': '3D模型生成',
      'merchandise_keychain': '钥匙扣设计',
      'merchandise_fridge_magnet': '冰箱贴设计',
      'merchandise_handbag': '手提袋设计',
      'merchandise_phone_case': '手机壳设计'
    };
    return typeMap[taskType] || taskType;
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

  // 重试任务
  const retryTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/retry`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser?.id || ''
        }
      });
      
      if (response.ok) {
        fetchTasks(); // 刷新列表
      }
    } catch (error) {
      console.error('重试任务失败:', error);
    }
  };

  if (!isOpen) return null;

  const statusCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    processing: tasks.filter(t => t.status === 'processing').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {characterId ? 'IP创作任务列表' : '全部生成任务'}
              </h2>
              <p className="text-gray-600 mt-1">
                管理和监控您的AI生成任务
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Filter Tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-cleanup-green text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? '全部' : getStatusText(status as any)} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-600">加载任务列表...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? '暂无任务' : `暂无${getStatusText(filter as any)}任务`}
              </h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? '开始创建您的第一个IP形象吧！' 
                  : '切换到其他状态查看更多任务'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:border-cleanup-green transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(task.status)}
                        <h3 className="font-semibold text-gray-900">
                          {getTaskTypeName(task.task_type)}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {task.prompt}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>创建时间: {new Date(task.created_at).toLocaleString('zh-CN')}</span>
                        {task.batch_id && (
                          <span>批次: {task.batch_id.slice(0, 8)}...</span>
                        )}
                      </div>
                      
                      {task.error_message && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <p className="text-red-700 text-sm">{task.error_message}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      {task.status === 'completed' && task.result_image_url && (
                        <>
                          <button
                            onClick={() => previewResult(task.result_image_url!)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            title="预览"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadResult(
                              task.result_image_url!, 
                              `${getTaskTypeName(task.task_type)}.png`
                            )}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            title="下载"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {task.status === 'completed' && task.result_data?.model_url && typeof task.result_data.model_url === 'string' ? (
                        <>
                          <button
                            onClick={() => previewResult(task.result_data!.model_url as string)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            title="预览3D模型"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadResult(
                              task.result_data!.model_url as string,
                              `${getTaskTypeName(task.task_type)}.glb`
                            )}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            title="下载3D模型"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      ) : null}
                      
                      {task.status === 'failed' && (
                        <button
                          onClick={() => retryTask(task.id)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="重试"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              任务会自动更新状态，无需手动刷新
            </span>
            <button
              onClick={fetchTasks}
              className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              立即刷新
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}