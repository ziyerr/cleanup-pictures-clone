"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { registerUser, loginUser, logoutUser, getCurrentUser, type AuthUser } from "../lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let user: AuthUser;
      
      if (mode === 'register') {
        console.log('正在注册用户...', { username, email: email || '未提供' });
        user = await registerUser(username, password, email || undefined);
        console.log('注册成功:', { userId: user.id, username: user.username });
      } else {
        console.log('正在登录...', { username });
        user = await loginUser(username, password);
        console.log('登录成功:', { userId: user.id, username: user.username });
      }

      // 调用成功回调
      onSuccess(user);
      
      // 延迟关闭对话框，让用户看到成功状态
      setTimeout(() => {
        onClose();
      }, 500);
      
      // Reset form
      setUsername('');
      setPassword('');
      setEmail('');
    } catch (err) {
      console.error('认证错误:', err);
      
      // 根据错误类型提供更友好的错误信息
      if (err instanceof Error) {
        if (err.message.includes('用户不存在')) {
          setError('用户名不存在，请检查输入或注册新账号');
        } else if (err.message.includes('密码错误')) {
          setError('密码不正确，请重新输入');
        } else if (err.message.includes('用户名已存在')) {
          setError('用户名已存在，请选择其他用户名或直接登录');
        } else if (err.message.includes('网络')) {
          setError('网络连接失败，请检查网络后重试');
        } else {
          setError(err.message);
        }
      } else {
        setError(mode === 'register' ? '注册失败，请重试' : '登录失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {mode === 'login' ? '登录' : '注册'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入用户名"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱 (可选)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入邮箱"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? '处理中...' : (mode === 'login' ? '登录' : '注册')}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {mode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>
      </div>
    </div>
  );
}