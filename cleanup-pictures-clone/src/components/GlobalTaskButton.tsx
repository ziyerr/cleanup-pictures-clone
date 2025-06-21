'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useRouter } from 'next/navigation';

interface TaskSummary {
  total: number;
  processing: number;
  completed: number;
  failed: number;
}

interface NotificationState {
  lastReadTimestamp: number;
  dismissedCompletedCount: number;
  hasVisitedTasksPage: boolean;
}

export default function GlobalTaskButton() {
  const { currentUser } = useUser();
  const router = useRouter();
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({ total: 0, processing: 0, completed: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [notificationState, setNotificationState] = useState<NotificationState>({
    lastReadTimestamp: 0,
    dismissedCompletedCount: 0,
    hasVisitedTasksPage: false
  });

  // 从localStorage加载通知状态
  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`taskNotification_${currentUser.id}`);
      if (saved) {
        try {
          setNotificationState(JSON.parse(saved));
        } catch (e) {
          console.warn('解析通知状态失败:', e);
        }
      }
    }
  }, [currentUser]);

  // 保存通知状态到localStorage
  const saveNotificationState = useCallback((state: NotificationState) => {
    if (currentUser) {
      localStorage.setItem(`taskNotification_${currentUser.id}`, JSON.stringify(state));
      setNotificationState(state);
    }
  }, [currentUser]);

  // 监听路由变化，检测用户是否访问了任务页面
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.location.pathname === '/tasks') {
        // 用户访问了任务页面，标记已完成任务为已读
        const newState = {
          ...notificationState,
          hasVisitedTasksPage: true,
          dismissedCompletedCount: taskSummary.completed,
          lastReadTimestamp: Date.now()
        };
        saveNotificationState(newState);
      }
    };

    // 立即检查当前路径
    handleRouteChange();
    
    // 监听路径变化（对于客户端路由）
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [taskSummary.completed, notificationState, saveNotificationState]);

  const fetchTaskSummary = useCallback(async () => {
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

      const response = await fetch('/api/tasks?summary=true', {
        headers: {
          'x-user-id': currentUser.id,
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newSummary = data.summary || { total: 0, processing: 0, completed: 0, failed: 0 };
        setTaskSummary(newSummary);
        setLastUpdate(new Date());
        
        // 如果完成的任务数量减少了（可能被清理了），重置已读状态
        if (newSummary.completed < notificationState.dismissedCompletedCount) {
          const newState = {
            ...notificationState,
            dismissedCompletedCount: 0
          };
          saveNotificationState(newState);
        }
      }
    } catch (error) {
      console.error('获取任务摘要失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, notificationState, saveNotificationState]);

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
  }, [currentUser, taskSummary.processing, fetchTaskSummary]);

  const handleClick = () => {
    // 标记为已访问任务页面
    const newState = {
      ...notificationState,
      hasVisitedTasksPage: true,
      dismissedCompletedCount: taskSummary.completed,
      lastReadTimestamp: Date.now()
    };
    saveNotificationState(newState);
    
    window.open('/tasks', '_blank');
  };

  // 计算未读的完成任务数量
  const unreadCompletedTasks = Math.max(0, taskSummary.completed - notificationState.dismissedCompletedCount);
  
  // 决定是否显示徽章的逻辑
  const shouldShowBadge = () => {
    // 用户未登录，不显示
    if (!currentUser) return false;
    
    // 没有任务，不显示
    if (taskSummary.total === 0) return false;
    
    // 有处理中的任务，始终显示
    if (taskSummary.processing > 0) return true;
    
    // 有失败的任务，始终显示  
    if (taskSummary.failed > 0) return true;
    
    // 有未读的完成任务，显示
    if (unreadCompletedTasks > 0) return true;
    
    // 其他情况不显示
    return false;
  };

  // Don't show if conditions are not met
  if (!shouldShowBadge()) return null;

  const getStatusIcon = () => {
    if (isLoading || taskSummary.processing > 0) {
      return <Loader2 className="w-5 h-5 animate-spin" />;
    }
    if (taskSummary.failed > 0) {
      return <AlertCircle className="w-5 h-5" />;
    }
    if (unreadCompletedTasks > 0) {
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
    if (unreadCompletedTasks > 0) {
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
    if (unreadCompletedTasks > 0) {
      return `${unreadCompletedTasks} 个任务完成`;
    }
    return `${taskSummary.total} 个任务`;
  };

  const getDisplayCount = () => {
    if (taskSummary.processing > 0) {
      return taskSummary.processing;
    }
    if (taskSummary.failed > 0) {
      return taskSummary.failed;
    }
    if (unreadCompletedTasks > 0) {
      return unreadCompletedTasks;
    }
    return taskSummary.total;
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
        <span className="sm:hidden">{getDisplayCount()}</span>
        
        {/* Processing indicator */}
        {taskSummary.processing > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        )}
        
        {/* Unread indicator for completed tasks */}
        {unreadCompletedTasks > 0 && taskSummary.processing === 0 && taskSummary.failed === 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-bounce" />
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