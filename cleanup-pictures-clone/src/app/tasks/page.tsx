'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, Download, Eye, RotateCcw, Clock, Package, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="返回上一页"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">返回</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">生成任务列表</h1>
                <p className="text-gray-600 mt-1">管理和查看您的周边商品生成任务</p>
              </div>
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
          <div className="space-y-4">
            {filteredTasks.map((task, index) => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="p-6">
                  {/* Main Row Content */}
                  <div className="flex items-center gap-6">
                    {/* Task Number & Status */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusText(task.status)}
                        </span>
                      </div>
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {getTaskTypeName(task.task_type)}
                        </h3>
                        {task.character_name && (
                          <span className="text-sm text-gray-500">for {task.character_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{new Date(task.created_at).toLocaleString()}</span>
                        {task.error_message && task.status === 'failed' && (
                          <span className="text-red-600 truncate">错误: {task.error_message}</span>
                        )}
                      </div>
                    </div>

                    {/* Character Avatar */}
                    {task.character_image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={task.character_image_url}
                          alt={task.character_name || ''}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </div>
                    )}

                    {/* Result Preview */}
                    {task.status === 'completed' && task.result_image_url && isValidGeneratedImage(task.result_image_url) ? (
                      <div className="flex-shrink-0">
                        <img
                          src={task.result_image_url}
                          alt={getTaskTypeName(task.task_type)}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            console.error('图片加载失败:', task.result_image_url);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {task.status === 'processing' ? (
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        ) : task.status === 'pending' ? (
                          <Clock className="w-6 h-6 text-gray-400" />
                        ) : task.status === 'failed' ? (
                          <AlertCircle className="w-6 h-6 text-red-400" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {task.status === 'completed' && task.result_image_url && isValidGeneratedImage(task.result_image_url) ? (
                        <>
                          <button
                            onClick={() => previewResult(task.result_image_url!)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="预览"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => downloadResult(task.result_image_url!, `${getTaskTypeName(task.task_type)}.png`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="下载"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </>
                      ) : task.status === 'failed' || (task.status === 'completed' && (!task.result_image_url || !isValidGeneratedImage(task.result_image_url))) ? (
                        <button
                          onClick={() => retryTask(task.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="重新生成"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Status Details (when not completed successfully) */}
                  {(task.status === 'processing' || task.status === 'pending' || task.status === 'failed' || 
                   (task.status === 'completed' && (!task.result_image_url || !isValidGeneratedImage(task.result_image_url)))) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {task.status === 'processing' && (
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>正在生成中，这可能需要几分钟时间，请耐心等待</span>
                        </div>
                      )}
                      {task.status === 'pending' && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>任务已加入队列，等待系统处理</span>
                        </div>
                      )}
                      {task.status === 'failed' && (
                        <div className="flex items-center gap-2 text-sm text-red-700">
                          <AlertCircle className="w-4 h-4" />
                          <span>{task.error_message || '图片生成过程中发生错误，请重试'}</span>
                        </div>
                      )}
                      {task.status === 'completed' && (!task.result_image_url || !isValidGeneratedImage(task.result_image_url)) && (
                        <div className="flex items-center gap-2 text-sm text-yellow-700">
                          <AlertCircle className="w-4 h-4" />
                          <span>图片生成完成但无法显示，生成的图片可能已过期或无法访问</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
