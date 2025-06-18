'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, Download, Eye, RotateCcw } from 'lucide-react';
import { checkTaskStatus, generateMultiViews, generateMerchandise, generate3DModel, type TaskStatusResponse } from '../lib/ai-api';

interface MerchandiseShowcaseProps {
  originalImageUrl: string;
  prompt: string;
  userId: string;
  onClose: () => void;
}

interface TaskProgress {
  id: string;
  type: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  error?: string;
  progress?: number;
}

export default function MerchandiseShowcase({ 
  originalImageUrl, 
  prompt, 
  userId, 
  onClose 
}: MerchandiseShowcaseProps) {
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  // Initialize tasks
  const initializeTasks = () => {
    const initialTasks: TaskProgress[] = [
      { id: '', type: 'multi_view_left', name: '左视图生成', status: 'pending' },
      { id: '', type: 'multi_view_back', name: '后视图生成', status: 'pending' },
      { id: '', type: 'model_3d', name: '3D模型生成', status: 'pending' },
      { id: '', type: 'keychain', name: '钥匙扣设计', status: 'pending' },
      { id: '', type: 'fridge_magnet', name: '冰箱贴设计', status: 'pending' },
      { id: '', type: 'handbag', name: '手提袋设计', status: 'pending' },
      { id: '', type: 'phone_case', name: '手机壳设计', status: 'pending' }
    ];
    setTasks(initialTasks);
  };

  // Update task status
  const updateTaskStatus = (taskId: string, status: 'processing' | 'completed' | 'failed', result?: string, error?: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status, result, error }
        : task
    ));
  };

  // Poll task status
  const pollTask = async (taskId: string) => {
    try {
      const response: TaskStatusResponse = await checkTaskStatus(taskId);
      
      if (response.success && response.task) {
        const { status, result_image_url, result_data, error_message } = response.task;
        
        if (status === 'completed') {
          const result = result_image_url || (result_data?.model_url as string);
          updateTaskStatus(taskId, 'completed', result);
          setCompletedCount(prev => prev + 1);
        } else if (status === 'failed') {
          updateTaskStatus(taskId, 'failed', undefined, error_message);
        } else if (status === 'processing') {
          updateTaskStatus(taskId, 'processing');
          // Continue polling
          setTimeout(() => pollTask(taskId), 10000);
        }
      }
    } catch (error) {
      updateTaskStatus(taskId, 'failed', undefined, '查询状态失败');
    }
  };

  // Start generation process
  const startGeneration = async () => {
    if (isStarted) return;
    setIsStarted(true);

    try {
      // Step 1: Generate multi-views
      const multiViewResult = await generateMultiViews(originalImageUrl, prompt, userId);
      
      // Update task IDs and start polling
      setTasks(prev => prev.map(task => {
        if (task.type === 'multi_view_left') {
          const newTask = { ...task, id: multiViewResult.leftViewTaskId, status: 'processing' as const };
          pollTask(multiViewResult.leftViewTaskId);
          return newTask;
        }
        if (task.type === 'multi_view_back') {
          const newTask = { ...task, id: multiViewResult.backViewTaskId, status: 'processing' as const };
          pollTask(multiViewResult.backViewTaskId);
          return newTask;
        }
        return task;
      }));

      // Step 2: Generate merchandise
      const merchandiseResult = await generateMerchandise(originalImageUrl, prompt, userId);
      
      // Update merchandise task IDs and start polling
      setTasks(prev => prev.map(task => {
        const taskId = merchandiseResult.taskIds[task.type];
        if (taskId) {
          const newTask = { ...task, id: taskId, status: 'processing' as const };
          pollTask(taskId);
          return newTask;
        }
        return task;
      }));

      // Step 3: Wait for multi-views to complete, then generate 3D model
      const checkMultiViewsAndGenerate3D = async () => {
        const leftViewTask = tasks.find(t => t.type === 'multi_view_left');
        const backViewTask = tasks.find(t => t.type === 'multi_view_back');
        
        if (leftViewTask?.status === 'completed' && backViewTask?.status === 'completed') {
          try {
            const model3DTaskId = await generate3DModel(
              originalImageUrl,
              leftViewTask.result,
              backViewTask.result,
              prompt,
              userId
            );
            
            setTasks(prev => prev.map(task => 
              task.type === 'model_3d' 
                ? { ...task, id: model3DTaskId, status: 'processing' }
                : task
            ));
            
            pollTask(model3DTaskId);
          } catch (error) {
            setTasks(prev => prev.map(task => 
              task.type === 'model_3d' 
                ? { ...task, status: 'failed', error: '3D模型生成启动失败' }
                : task
            ));
          }
        }
      };

      // Monitor for multi-view completion and start 3D generation
      setTimeout(() => {
        const checkAndStart3D = () => {
          setTasks(currentTasks => {
            const leftView = currentTasks.find(t => t.type === 'multi_view_left');
            const backView = currentTasks.find(t => t.type === 'multi_view_back');
            const model3D = currentTasks.find(t => t.type === 'model_3d');
            
            if (leftView?.status === 'completed' && backView?.status === 'completed' && model3D?.status === 'pending') {
              generate3DModel(
                originalImageUrl,
                leftView.result,
                backView.result,
                prompt,
                userId
              ).then(taskId => {
                setTasks(prev => prev.map(task => 
                  task.type === 'model_3d' 
                    ? { ...task, id: taskId, status: 'processing' }
                    : task
                ));
                pollTask(taskId);
              }).catch(() => {
                setTasks(prev => prev.map(task => 
                  task.type === 'model_3d' 
                    ? { ...task, status: 'failed', error: '3D模型生成启动失败' }
                    : task
                ));
              });
            }
            return currentTasks;
          });
        };

        const interval = setInterval(checkAndStart3D, 5000);
        setTimeout(() => clearInterval(interval), 300000); // Clear after 5 minutes
      }, 10000);

    } catch (error) {
      console.error('启动生成流程失败:', error);
    }
  };

  // Get status icon
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

  // Get status color
  const getStatusColor = (status: TaskProgress['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'processing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
    }
  };

  // Download result
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

  // Preview result
  const previewResult = (url: string, name: string) => {
    window.open(url, '_blank');
  };

  useEffect(() => {
    initializeTasks();
  }, []);

  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">周边商品生成工坊</h2>
              <p className="text-gray-600 mt-1">正在为您的IP形象生成完整周边产品线</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
            >
              ×
            </button>
          </div>
          
          {/* Progress Bar */}
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
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Original Image */}
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold mb-3">原始IP形象</h3>
            <img
              src={originalImageUrl}
              alt="原始IP形象"
              className="w-32 h-32 mx-auto rounded-lg object-cover border-2 border-gray-200"
            />
          </div>

          {/* Start Button */}
          {!isStarted && (
            <div className="text-center mb-6">
              <button
                onClick={startGeneration}
                className="px-8 py-3 bg-cleanup-green text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
              >
                开始生成所有周边商品
              </button>
            </div>
          )}

          {/* Tasks Grid */}
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
                    {task.type === 'model_3d' ? (
                      <div className="text-center">
                        <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-gray-500 text-sm">3D模型</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => previewResult(task.result!, `${task.name}_preview`)}
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
                            onClick={() => previewResult(task.result!, `${task.name}_preview`)}
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
                      // Implement retry logic here
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

          {/* Footer */}
          {isStarted && (
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
  );
}