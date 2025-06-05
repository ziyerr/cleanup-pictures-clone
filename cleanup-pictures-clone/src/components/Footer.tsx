import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="text-center space-y-8">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-8 bg-cleanup-green rounded-md flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-black"
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
            <div className="flex items-center space-x-3">
              <span className="text-xl font-bold">Popverse.ai</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-300">AI驱动的IP周边生成平台</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Popverse.ai 是一个创新的AI平台，让每个人都能轻松创造属于自己的IP形象和周边产品
          </p>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="text-white font-semibold mb-4">产品</h3>
              <div className="space-y-2">
                <Link href="/generator" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  IP生成器
                </Link>
                <Link href="/gallery" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  作品画廊
                </Link>
                <Link href="/products" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  周边产品
                </Link>
                <Link href="/api" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  开发者API
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">服务</h3>
              <div className="space-y-2">
                <Link href="/pricing" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  价格方案
                </Link>
                <Link href="/enterprise" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  企业服务
                </Link>
                <Link href="/support" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  技术支持
                </Link>
                <Link href="/tutorials" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  使用教程
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">公司</h3>
              <div className="space-y-2">
                <Link href="/about" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  关于我们
                </Link>
                <Link href="/blog" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  技术博客
                </Link>
                <Link href="/careers" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  加入我们
                </Link>
                <Link href="/contact" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  联系方式
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">法律</h3>
              <div className="space-y-2">
                <Link href="/terms" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  服务条款
                </Link>
                <Link href="/privacy" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  隐私政策
                </Link>
                <Link href="/copyright" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  版权声明
                </Link>
                <Link href="/license" className="text-gray-400 hover:text-cleanup-green transition-colors block">
                  使用许可
                </Link>
              </div>
            </div>
          </div>

          {/* Copyright and Social */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-6 text-gray-400">
                <span>©2024 Popverse.ai</span>
                <span>·</span>
                <span>北京创新科技有限公司</span>
                <span>·</span>
                <span>京ICP备xxxxxxxx号</span>
              </div>

              {/* Social Links */}
              <div className="flex items-center space-x-4">
                <Link href="/wechat" className="text-gray-400 hover:text-cleanup-green transition-colors">
                  <span className="sr-only">微信</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.5 12.5c.5 0 1-.5 1-1s-.5-1-1-1-1 .5-1 1 .5 1 1 1zm7 0c.5 0 1-.5 1-1s-.5-1-1-1-1 .5-1 1 .5 1 1 1zm-3.5-8C5.5 4.5 0 8.5 0 13.5c0 2.5 1.5 4.5 3.5 6l-1 4 4.5-2c1 .5 2 .5 3 .5 6.5 0 12-4 12-9s-5.5-8.5-12-8.5z"/>
                  </svg>
                </Link>

                <Link href="/weibo" className="text-gray-400 hover:text-cleanup-green transition-colors">
                  <span className="sr-only">微博</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.5 15.5c-2.5 0-4.5-1.5-4.5-3.5s2-3.5 4.5-3.5 4.5 1.5 4.5 3.5-2 3.5-4.5 3.5zm8.5-4c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1zm-2-3c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1z"/>
                  </svg>
                </Link>

                <Link href="/github" className="text-gray-400 hover:text-cleanup-green transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Awards */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-8">
            {/* Innovation Award */}
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-cleanup-green rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xs">创新</span>
              </div>
              <span className="text-gray-300 text-sm">2024年度创新产品奖</span>
            </div>

            {/* AI Excellence */}
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">AI</span>
              </div>
              <span className="text-gray-300 text-sm">AI技术卓越奖</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
