import { Button } from './ui/button';
import { Sparkles } from 'lucide-react';

export default function IPShowcaseCTA() {
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Title */}
        <h2 className="text-4xl lg:text-5xl font-bold mb-8">
          想要看看更多<br />
          <span className="underline decoration-4 underline-offset-8 decoration-cleanup-green">精彩IP作品？</span>
        </h2>

        {/* Product Gallery Preview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
          <div className="relative group">
            <img
              src="/cta/background-removal.jpeg"
              alt="IP作品展示 - 可爱猫咪周边"
              className="w-full aspect-square object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <span className="text-white font-medium">猫咪IP系列</span>
            </div>
          </div>

          <div className="relative group">
            <div className="w-full aspect-square bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
              <span className="text-white text-2xl">🦄</span>
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <span className="text-white font-medium">独角兽系列</span>
            </div>
          </div>

          <div className="relative group">
            <div className="w-full aspect-square bg-gradient-to-br from-pink-400 to-red-500 rounded-xl shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
              <span className="text-white text-2xl">🐰</span>
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <span className="text-white font-medium">兔子IP系列</span>
            </div>
          </div>

          <div className="relative group">
            <div className="w-full aspect-square bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
              <span className="text-white text-2xl">🐻</span>
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <span className="text-white font-medium">小熊系列</span>
            </div>
          </div>
        </div>

        {/* Icon and Title */}
        <div className="flex items-center justify-center mb-6">
          <Sparkles className="w-6 h-6 text-cleanup-green mr-3" />
          <h3 className="text-2xl font-bold text-black">发现创意无限</h3>
        </div>

        {/* Description */}
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8 leading-relaxed">
          浏览数千个由用户创作的精彩IP形象和周边产品，获取创作灵感，
          发现属于你的独特风格。每一个IP都有自己的故事，每一个周边都承载着创作者的心意。
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-cleanup-green">1000+</div>
            <p className="text-sm text-gray-600">精选作品</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cleanup-green">50+</div>
            <p className="text-sm text-gray-600">风格分类</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cleanup-green">每日</div>
            <p className="text-sm text-gray-600">新增作品</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            className="bg-cleanup-green hover:bg-cleanup-green/90 text-black px-8 py-3 rounded-full font-medium text-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            浏览作品画廊
          </Button>
          <Button
            variant="outline"
            className="border-cleanup-green text-cleanup-green hover:bg-cleanup-green hover:text-black px-8 py-3 rounded-full font-medium text-lg"
          >
            创建我的IP
          </Button>
        </div>
      </div>
    </section>
  );
}
