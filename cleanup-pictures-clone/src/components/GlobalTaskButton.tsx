'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

interface TaskSummary {
  total: number;
  processing: number;
  completed: number;
  failed: number;
}

export default function GlobalTaskButton() {
  const { currentUser } = useUser();
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({ total: 0, processing: 0, completed: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTaskSummary = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // Get the current session token for authentication
      const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        console.warn('认证token不存在，跳过任务摘要获取');
        return;
      }

      const response = await fetch(`/api/tasks?summary=true`, {
        headers: {
          'x-user-id': currentUser.id,
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTaskSummary(data.summary || { total: 0, processing: 0, completed: 0, failed: 0 });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('获取任务摘要失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and periodic updates
  useEffect(() => {
    if (currentUser) {
      fetchTaskSummary();
      
      // Update every 10 seconds if there are processing tasks
      const interval = setInterval(() => {
        if (taskSummary.processing > 0) {
          fetchTaskSummary();
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [currentUser, taskSummary.processing]);

  const handleClick = () => {
    window.open('/tasks', '_blank');
  };

  // Don't show if user is not logged in
  if (!currentUser) return null;

  // Don't show if no tasks
  if (taskSummary.total === 0) return null;

  const getStatusIcon = () => {
    if (isLoading || taskSummary.processing > 0) {
      return <Loader2 className="w-5 h-5 animate-spin" />;
    }
    if (taskSummary.failed > 0) {
      return <AlertCircle className="w-5 h-5" />;
    }
    if (taskSummary.completed > 0) {
      return <CheckCircle className="w-5 h-5" />;
    }
    return <Clock className="w-5 h-5" />;
  };

  const getStatusColor = () => {
    if (isLoading || taskSummary.processing > 0) {
      return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
    if (taskSummary.failed > 0) {
      return 'bg-red-500 hover:bg-red-600 text-white';
    }
    if (taskSummary.completed > 0) {
      return 'bg-green-500 hover:bg-green-600 text-white';
    }
    return 'bg-gray-500 hover:bg-gray-600 text-white';
  };

  const getStatusText = () => {
    if (taskSummary.processing > 0) {
      return `${taskSummary.processing} 个任务处理中`;
    }
    if (taskSummary.failed > 0) {
      return `${taskSummary.failed} 个任务失败`;
    }
    if (taskSummary.completed > 0) {
      return `${taskSummary.completed} 个任务完成`;
    }
    return `${taskSummary.total} 个任务`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleClick}
        className={`
          ${getStatusColor()}
          rounded-full shadow-lg transition-all duration-300 hover:scale-105 
          flex items-center gap-3 px-4 py-3 font-medium text-sm
          min-w-[120px] justify-center
        `}
        title="查看生成任务"
      >
        {getStatusIcon()}
        <span className="hidden sm:inline">{getStatusText()}</span>
        <span className="sm:hidden">{taskSummary.total}</span>
        
        {/* Processing indicator */}
        {taskSummary.processing > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Tooltip for mobile */}
      <div className="sm:hidden absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        {getStatusText()}
        {lastUpdate && (
          <div className="text-gray-400 text-xs mt-1">
            {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}