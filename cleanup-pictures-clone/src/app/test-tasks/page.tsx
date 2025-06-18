'use client';

import { useState } from 'react';
import { useUser } from '../../contexts/UserContext';

export default function TestTasksPage() {
  const { currentUser } = useUser();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTaskProcessing = async () => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    setLoading(true);
    try {
      // Get the current session token for authentication
      const { data: { session } } = await (await import('../../lib/supabase')).supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('认证token不存在，请重新登录');
      }

      const response = await fetch('/api/test-task-processing', {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id,
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (!response.ok) {
        throw new Error('测试失败');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('测试失败:', error);
      setResult({ error: error instanceof Error ? error.message : '未知错误' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">任务处理测试</h1>
          <p className="text-gray-600">请先登录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">任务处理测试页面</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试任务处理功能</h2>
          <p className="text-gray-600 mb-4">
            这个测试会查找您的第一个待处理任务，将其状态更新为"处理中"，然后在3秒后标记为"已完成"。
          </p>
          
          <button
            onClick={testTaskProcessing}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium ${
              loading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loading ? '测试中...' : '开始测试任务处理'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">测试结果</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">说明</h3>
          <ul className="text-yellow-700 space-y-1">
            <li>• 确保您已经创建了一些周边商品生成任务</li>
            <li>• 测试会找到第一个状态为"pending"的任务</li>
            <li>• 如果测试成功，任务状态会从"等待中"变为"处理中"，然后变为"已完成"</li>
            <li>• 您可以在任务列表页面查看状态变化</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
