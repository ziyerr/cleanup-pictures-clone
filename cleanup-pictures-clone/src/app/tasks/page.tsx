'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, Download, Eye, RotateCcw, Clock, Package } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import type { GenerationTask } from '../../lib/supabase';

interface TaskWithCharacter extends GenerationTask {
  character_name?: string;
  character_image_url?: string;
}

// 验证是否是真实生成的图片URL（排除演示图片）
const isValidGeneratedImage = (imageUrl: string): boolean => {
  if (!imageUrl) return false;
  
  // 排除已知的演示图片域名和路径
  const demoImagePatterns = [
    'filesystem.site',
    'example.com',
    'placeholder',
    'demo',
    'mock',
    'test',
    'unsplash.com',
    'picsum.photos'
  ];
  
  // 检查是否包含演示图片特征
  const isDemoImage = demoImagePatterns.some(pattern => 
    imageUrl.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isDemoImage) {
    console.log('检测到演示图片，跳过显示:', imageUrl);
    return false;
  }
  
  // 检查是否是有效的图片URL（包含Supabase或其他真实存储服务）
  const validImagePatterns = [
    'supabase.co',
    'amazonaws.com',
    'cloudinary.com',
    'googleapis.com',
    'apicore.ai',
    'wrfvysakckcmvquvwuei.supabase.co' // 项目特定的Supabase URL
  ];
  
  const isValidImage = validImagePatterns.some(pattern => 
    imageUrl.includes(pattern)
  );
  
  console.log('图片URL验证:', { imageUrl, isValidImage, isDemoImage });
  return isValidImage;
};

export default function TasksPage() {
  const { currentUser } = useUser();
  const [tasks, setTasks] = useState<TaskWithCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');

  // 获取用户的所有任务
  const fetchTasks = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Get the current session token for authentication
      const { data: { session } } = await (await import('../../lib/supabase')).supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('认证token不存在，请重新登录');
      }

      const response = await fetch('/api/tasks', {
        headers: {
          'x-user-id': currentUser.id,
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (!response.ok) {
        throw new Error('获取任务列表失败');
      }

      const data = await response.json();
      console.log('任务列表数据检查:', {
        totalTasks: data.tasks?.length || 0,
        tasksWithImages: data.tasks?.filter((t: any) => t.result_image_url).length || 0,
        sampleImageUrls: data.tasks?.slice(0, 3).map((t: any) => ({
          id: t.id,
          type: t.task_type,
          status: t.status,
          result_image_url: t.result_image_url
        }))
      });
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('获取任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重试任务
  const retryTask = async (taskId: string) => {
    try {
      const { data: { session } } = await (await import('../../lib/supabase')).supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('认证token不存在，请重新登录');
      }

      const response = await fetch(`/api/tasks/${taskId}/retry`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser?.id || '',
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (!response.ok) {
        throw new Error('重试任务失败');
      }

      // 刷新任务列表
      fetchTasks();
    } catch (error) {
      console.error('重试任务失败:', error);
      alert('重试任务失败，请稍后再试');
    }
  };

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

  // 获取任务类型显示名称
  const getTaskTypeName = (taskType: string) => {
    const typeMap: Record<string, string> = {
      'merchandise_keychain': '钥匙扣设计',
      'merchandise_fridge_magnet': '冰箱贴设计',
      'merchandise_handbag': '手提袋设计',
      'merchandise_phone_case': '手机壳设计',
      'multi_view_left': '左视图生成',
      'multi_view_back': '后视图生成',
      '3d_model': '3D模型生成'
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

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  // 统计信息
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    processing: tasks.filter(t => t.status === 'processing').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  useEffect(() => {
    fetchTasks();
    
    // 设置定时刷新
    const interval = setInterval(fetchTasks, 30000); // 每30秒刷新一次
    return () => clearInterval(interval);
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">任务列表</h1>
          <p className="text-gray-600">请先登录查看您的生成任务</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">生成任务列表</h1>
              <p className="text-gray-600 mt-1">管理和查看您的周边商品生成任务</p>
            </div>
            <button
              onClick={fetchTasks}
              disabled={loading}
              className="px-4 py-2 bg-cleanup-green text-black rounded-lg hover:bg-green-400 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              刷新
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-gray-100 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">总任务</div>
            </div>
            <div className="bg-yellow-100 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
              <div className="text-sm text-yellow-600">等待中</div>
            </div>
            <div className="bg-blue-100 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-800">{stats.processing}</div>
              <div className="text-sm text-blue-600">生成中</div>
            </div>
            <div className="bg-green-100 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-800">{stats.completed}</div>
              <div className="text-sm text-green-600">已完成</div>
            </div>
            <div className="bg-red-100 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-800">{stats.failed}</div>
              <div className="text-sm text-red-600">失败</div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mt-6">
            {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-cleanup-green text-black'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? '全部' : getStatusText(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">加载任务列表中...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无任务</h3>
            <p className="text-gray-600">
              {filter === 'all' ? '您还没有创建任何生成任务' : `没有${getStatusText(filter)}的任务`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Task Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span className="font-medium text-gray-900">
                      {getTaskTypeName(task.task_type)}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusText(task.status)}
                  </span>
                </div>

                {/* Character Info */}
                {task.character_name && (
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      {task.character_image_url && (
                        <img
                          src={task.character_image_url}
                          alt={task.character_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.character_name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(task.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result or Error */}
                {task.status === 'completed' && (
                  <div className="mb-4">
                    {task.result_image_url && isValidGeneratedImage(task.result_image_url) ? (
                      <>
                        <img
                          src={task.result_image_url}
                          alt={getTaskTypeName(task.task_type)}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                          onError={(e) => {
                            console.error('图片加载失败:', task.result_image_url);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => previewResult(task.result_image_url!)}
                            className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            查看
                          </button>
                          <button
                            onClick={() => downloadResult(task.result_image_url!, `${getTaskTypeName(task.task_type)}.png`)}
                            className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center justify-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            下载
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-yellow-800 mb-1">
                              图片生成完成但无法显示
                            </div>
                            <div className="text-xs text-yellow-700 mb-3">
                              生成的图片可能已过期或无法访问
                            </div>
                            <button
                              onClick={() => retryTask(task.id)}
                              className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              重新生成
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {task.status === 'processing' && (
                  <div className="mb-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <div>
                          <div className="text-sm font-medium text-blue-800">正在生成中...</div>
                          <div className="text-xs text-blue-600 mt-1">
                            这可能需要几分钟时间，请耐心等待
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {task.status === 'pending' && (
                  <div className="mb-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">等待处理中...</div>
                          <div className="text-xs text-gray-600 mt-1">
                            任务已加入队列，等待系统处理
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {task.status === 'failed' && (
                  <div className="mb-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-red-800 mb-1">生成失败</div>
                          <div className="text-xs text-red-700 mb-3">
                            {task.error_message || '图片生成过程中发生错误，请重试'}
                          </div>
                          <button
                            onClick={() => retryTask(task.id)}
                            className="px-3 py-1.5 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            重新生成
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
