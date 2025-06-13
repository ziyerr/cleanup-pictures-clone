'use client';

import { useUser } from '../../contexts/UserContext';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, Smartphone, User as UserIcon, LogOut, Home, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Mock component for social login buttons
const SocialButton = ({ provider, icon, connected }: { provider: string; icon: React.ReactNode, connected: boolean }) => (
  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white">
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-semibold text-gray-800">{provider}</span>
    </div>
    <button
      className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
        connected
          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
          : 'bg-blue-500 text-white hover:bg-blue-600'
      }`}
      disabled={connected}
    >
      {connected ? '已连接' : '连接'}
    </button>
  </div>
);

const GoogleIcon = () => <img src="/icons/google.svg" alt="Google" className="w-6 h-6" />;
const WechatIcon = () => <img src="/icons/wechat.svg" alt="WeChat" className="w-6 h-6" />;

export default function ProfilePage() {
  const { currentUser, isLoading, logout } = useUser();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cleanup-green"></div>
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to home if not logged in after loading
    if (typeof window !== 'undefined') {
      router.push('/');
    }
    return null;
  }
  
  const handleLogout = () => {
    logout();
    router.push('/');
  };


  return (
    <div className="min-h-screen bg-gray-100/50 font-sans">
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white h-screen sticky top-0 border-r border-gray-200 p-4 flex flex-col">
           <Link href="/" className="flex items-center justify-center h-12 px-4 bg-gray-900 rounded-lg mb-8" title="返回首页">
              <span className="text-white font-bold tracking-wider text-lg">popverse.ai</span>
            </Link>
          <nav className="space-y-2 flex-grow">
            <Link href="/workshop" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md">
              <Home className="w-5 h-5" />
              <span>IP 工坊</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-gray-900 font-semibold bg-gray-100 rounded-md">
              <Settings className="w-5 h-5" />
              <span>个人中心</span>
            </Link>
          </nav>
          <div className="mt-auto">
             <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md">
                <LogOut className="w-5 h-5" />
                <span>退出登录</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">个人中心</h1>
              <p className="text-gray-600 mt-1">管理您的账户信息和连接授权。</p>
            </header>
            
            <div className="space-y-8">
              {/* Personal Info Section */}
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-6">个人信息</h2>
                <div className="space-y-5">
                   <div className="flex items-center">
                      <UserIcon className="w-5 h-5 text-gray-500 mr-4" />
                      <span className="text-gray-600 w-24">用户名</span>
                      <span className="font-medium text-gray-800">{currentUser.username}</span>
                    </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-500 mr-4" />
                    <span className="text-gray-600 w-24">邮箱</span>
                    <span className="font-medium text-gray-800 flex-1">{currentUser.email || '未绑定'}</span>
                    <button className="ml-auto text-sm text-blue-600 hover:underline">编辑</button>
                  </div>
                   <div className="flex items-center">
                    <KeyRound className="w-5 h-5 text-gray-500 mr-4" />
                    <span className="text-gray-600 w-24">密码</span>
                    <span className="font-medium text-gray-800">********</span>
                    <button className="ml-auto text-sm text-blue-600 hover:underline">修改密码</button>
                  </div>
                </div>
              </section>

              {/* Connections Section */}
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-6">授权登录</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SocialButton provider="Google" icon={<GoogleIcon/>} connected={true} />
                  <SocialButton provider="微信" icon={<WechatIcon/>} connected={false} />
                  <SocialButton provider="邮箱" icon={<Mail className="w-6 h-6 text-gray-500"/>} connected={!!currentUser.email} />
                  <SocialButton provider="手机号码" icon={<Smartphone className="w-6 h-6 text-gray-500"/>} connected={false} />
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 