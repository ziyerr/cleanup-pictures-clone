'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Database, Users, Image, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface UserData {
  id: string;
  username: string;
  email?: string;
  created_at: string;
}

interface CharacterData {
  id: string;
  name: string;
  description?: string;
  main_image_url: string;
  user_id: string;
  created_at: string;
}

interface DebugData {
  characters: CharacterData[];
  users: UserData[];
  charactersCount: number;
  usersCount: number;
}

export default function IPDebugPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/ips');
      const data = await response.json();
      
      if (data.success) {
        setDebugData(data.debug);
      } else {
        setError(data.error || '获取调试数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Database className="w-6 h-6" />
                IP形象数据库调试
              </h1>
              <p className="text-gray-600 mt-1">查看数据库中的用户和IP形象数据</p>
            </div>
            <button
              onClick={fetchDebugData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">错误</span>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">正在加载调试数据...</p>
            </div>
          )}

          {/* Debug Data */}
          {debugData && !loading && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">用户统计</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{debugData.usersCount}</p>
                  <p className="text-blue-700 text-sm">注册用户总数</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">IP形象统计</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{debugData.charactersCount}</p>
                  <p className="text-green-700 text-sm">IP形象总数</p>
                </div>
              </div>

              {/* Users Data */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">用户数据</h3>
                {debugData.users.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-600">暂无用户数据</p>
                    <p className="text-sm text-gray-500 mt-1">
                      请先注册一个账号来测试功能
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">ID</th>
                          <th className="px-4 py-2 text-left">用户名</th>
                          <th className="px-4 py-2 text-left">邮箱</th>
                          <th className="px-4 py-2 text-left">创建时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugData.users.map((user, index) => (
                          <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 font-mono text-xs">{user.id.substring(0, 8)}...</td>
                            <td className="px-4 py-2">{user.username}</td>
                            <td className="px-4 py-2">{user.email || '未设置'}</td>
                            <td className="px-4 py-2 text-sm">{new Date(user.created_at).toLocaleString('zh-CN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Characters Data */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">IP形象数据</h3>
                {debugData.characters.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-600">暂无IP形象数据</p>
                    <p className="text-sm text-gray-500 mt-1">
                      请访问主页创建您的第一个IP形象
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {debugData.characters.map((character) => (
                      <div key={character.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          <img
                            src={character.main_image_url}
                            alt={character.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-full flex items-center justify-center bg-gray-200">
                            <AlertCircle className="w-8 h-8 text-gray-400" />
                            <span className="text-gray-500 ml-2">图片加载失败</span>
                          </div>
                        </div>
                        <h4 className="font-semibold text-gray-900">{character.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{character.description || '无描述'}</p>
                        <div className="text-xs text-gray-500">
                          <p>用户ID: {character.user_id.substring(0, 8)}...</p>
                          <p>创建时间: {new Date(character.created_at).toLocaleString('zh-CN')}</p>
                          <p className="mt-1 font-mono">图片URL: {character.main_image_url.substring(0, 50)}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">快速测试</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-yellow-700">
                    <strong>如果数据库为空：</strong>
                  </p>
                  <ul className="list-disc list-inside text-yellow-700 ml-4 space-y-1">
                    <li>访问 <Link href="/" className="underline">主页</Link> 创建IP形象</li>
                    <li>点击右上角用户图标注册新账号</li>
                    <li>上传图片并描述您的IP形象</li>
                    <li>点击生成按钮开始创建</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}