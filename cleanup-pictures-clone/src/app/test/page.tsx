'use client';

import { useState } from 'react';
import { testAPIResponse, testAPIConnectivity } from '../../lib/ai-api';

export default function TestPage() {
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [connectivityResult, setConnectivityResult] = useState<any>(null);

  const handleTestAPI = async () => {
    setIsTestingAPI(true);
    setApiTestResult(null);
    
    try {
      const result = await testAPIResponse();
      setApiTestResult(result);
    } catch (error) {
      setApiTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  const handleTestConnectivity = async () => {
    setIsTestingConnectivity(true);
    setConnectivityResult(null);
    
    try {
      const result = await testAPIConnectivity();
      setConnectivityResult(result);
    } catch (error) {
      setConnectivityResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            🧪 API测试中心
          </h1>
          <p className="text-gray-600 mb-6">
            测试gpt-4o-image API连接和功能
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* API连接测试 */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🔌 连接测试</h2>
              <p className="text-gray-600 mb-4">测试API端点可访问性</p>
              <button
                onClick={handleTestConnectivity}
                disabled={isTestingConnectivity}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
              >
                {isTestingConnectivity ? '测试中...' : '开始连接测试'}
              </button>
              
              {connectivityResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded border">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(connectivityResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* API功能测试 */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🎨 功能测试</h2>
              <p className="text-gray-600 mb-4">测试gpt-4o-image图片生成</p>
              <button
                onClick={handleTestAPI}
                disabled={isTestingAPI}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
              >
                {isTestingAPI ? '测试中...' : '开始功能测试'}
              </button>
              
              {apiTestResult && (
                <div className="mt-4">
                  <div className={`p-4 rounded border ${apiTestResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="font-semibold mb-2">
                      {apiTestResult.success ? '✅ 测试成功' : '❌ 测试失败'}
                    </div>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(apiTestResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">📋 环境信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">API端点:</span>
                <div className="text-gray-600">https://api.apicore.ai/v1</div>
              </div>
              <div>
                <span className="font-medium">模型:</span>
                <div className="text-gray-600">gpt-4o-image</div>
              </div>
              <div>
                <span className="font-medium">API密钥:</span>
                <div className="text-gray-600">sk-DudMc...mos (已配置)</div>
              </div>
              <div>
                <span className="font-medium">超时设置:</span>
                <div className="text-gray-600">180秒</div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a 
              href="/" 
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
