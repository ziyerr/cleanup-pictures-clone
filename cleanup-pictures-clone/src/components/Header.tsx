'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Menu, User, X, LogOut, Palette, ChevronDown, ListTodo } from 'lucide-react';
import AuthModal from './AuthModal';
import TaskListModal from './TaskListModal';
import { useUser } from '../contexts/UserContext';
import { clearUserData } from '../lib/auth-utils';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTaskListModal, setShowTaskListModal] = useState(false);
  const { currentUser, setCurrentUser, isLoading } = useUser();

  const navItems = [
    { id: 'usecases', label: '应用场景', href: '#usecases' },
    { id: 'pricing', label: '价格方案', href: '#pricing' },
    { id: 'faq', label: '常见问题', href: '#faq' },
    { id: 'api', label: '开发者API', href: '#api' },
  ];

  // 平滑滚动到指定区域
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // 导航栏高度
      const elementPosition = element.offsetTop - headerHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  };

  // Handle user login
  const handleLoginClick = () => {
    setShowAuthModal(true);
  };

  // Handle user logout
  const handleLogout = () => {
    clearUserData();
    setCurrentUser(null);
    setShowUserMenu(false);
  };

  // Toggle user menu
  const toggleUserMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  // 监听滚动事件，自动更新当前激活的导航项
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // 使用节流，提高性能
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollPosition = window.scrollY + 120; // 偏移量，让切换更自然

        // 获取所有区域的位置
        const sections = navItems.map(item => {
          const element = document.getElementById(item.id);
          return {
            id: item.id,
            offsetTop: element?.offsetTop || 0,
            offsetBottom: (element?.offsetTop || 0) + (element?.offsetHeight || 0)
          };
        });

        // 找到当前滚动位置对应的区域
        const currentSection = sections.find(section =>
          scrollPosition >= section.offsetTop && scrollPosition < section.offsetBottom
        );

        if (currentSection) {
          setActiveSection(currentSection.id);
        } else if (scrollPosition < sections[0]?.offsetTop) {
          setActiveSection(''); // 在第一个区域之前，不高亮任何导航项
        }
      }, 10);
    };

    // 添加滚动监听
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 初始检查当前位置
    handleScroll();

    // 清理监听器
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [navItems]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-black">Popverse.ai</span>
              <span className="text-xs text-gray-500">AI驱动的IP周边生成</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Button
              variant="outline"
              className="bg-cleanup-green hover:bg-cleanup-green/90 text-black border-cleanup-green"
            >
              产品画廊
            </Button>

            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`nav-item font-medium ${
                  activeSection === item.id
                    ? 'active text-cleanup-green'
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                {item.label}
                <div className="nav-indicator" />
              </button>
            ))}

            {/* User Login/Profile Button */}
            <div className="relative" suppressHydrationWarning>
              {isLoading ? (
                /* Loading state */
                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse"></div>
              ) : currentUser ? (
                /* User is logged in - show user menu */
                <div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={toggleUserMenu}
                    className="relative"
                  >
                    <User className="w-4 h-4" />
                  </Button>
                  
                  {showUserMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                          <div className="font-medium">{currentUser.username}</div>
                          {currentUser.email && (
                            <div className="text-xs text-gray-500">{currentUser.email}</div>
                          )}
                        </div>
                        <Link
                          href="/workshop"
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Palette className="w-4 h-4 mr-2" />
                          我的IP工坊
                        </Link>
                        <button
                          onClick={() => {
                            setShowTaskListModal(true);
                            setShowUserMenu(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <ListTodo className="w-4 h-4 mr-2" />
                          任务列表
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* User is not logged in - show login button */
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleLoginClick}
                  title="用户登录"
                >
                  <User className="w-4 h-4" />
                </Button>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Button
                variant="outline"
                className="bg-cleanup-green hover:bg-cleanup-green/90 text-black border-cleanup-green w-full justify-start"
              >
                产品画廊
              </Button>

              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`font-medium py-2 text-left transition-colors duration-200 ${
                    activeSection === item.id
                      ? 'text-cleanup-green font-semibold'
                      : 'text-gray-700 hover:text-black'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {/* Mobile User Login/Profile */}
              <div className="border-t border-gray-200 pt-4" suppressHydrationWarning>
                {isLoading ? (
                  <div className="px-2 py-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : currentUser ? (
                  <div className="space-y-2">
                    <div className="px-2 py-1 text-sm text-gray-700">
                      <div className="font-medium">{currentUser.username}</div>
                      {currentUser.email && (
                        <div className="text-xs text-gray-500">{currentUser.email}</div>
                      )}
                    </div>
                    <Link
                      href="/workshop"
                      className="flex items-center w-full px-2 py-2 text-sm text-gray-700 hover:text-black"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Palette className="w-4 h-4 mr-2" />
                      我的IP工坊
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-2 py-2 text-sm text-gray-700 hover:text-black"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      退出登录
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLoginClick}
                    className="flex items-center w-full px-2 py-2 text-sm text-gray-700 hover:text-black"
                  >
                    <User className="w-4 h-4 mr-2" />
                    用户登录
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
          setIsMobileMenuOpen(false); // 关闭移动端菜单
        }}
      />

      {/* Task List Modal */}
      <TaskListModal
        isOpen={showTaskListModal}
        onClose={() => setShowTaskListModal(false)}
      />
    </header>
  );
}
