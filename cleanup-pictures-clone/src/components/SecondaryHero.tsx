'use client';

import { useState, useCallback } from 'react';
import { Upload, ArrowUp, Users, ShoppingBag } from 'lucide-react';

export default function SecondaryHero() {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    console.log('上传的文件:', files);
    // Handle file upload logic here
  }, []);

  return (
    <section className="bg-cleanup-green py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Heading */}
        <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-black mb-8 leading-tight">
          秒级生成IP形象<br />
          打造<span className="highlight-black">完整周边生态</span>
        </h2>

        {/* Drag & Drop Instruction */}
        <div className="flex items-center justify-center mb-8">
          <ArrowUp className="w-5 h-5 text-black mr-2" />
          <span className="text-lg font-medium text-black">
            拖拽图片到上方开始免费体验
          </span>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-black/20">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-cleanup-green text-xl">🎨</span>
            </div>
            <h3 className="text-xl font-bold text-black mb-2">AI生成IP形象</h3>
            <p className="text-black/80">基于您的图片和描述，生成独特的卡通IP角色</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-black/20">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-6 h-6 text-cleanup-green" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">完整周边套装</h3>
            <p className="text-black/80">手机壳、钥匙扣、手办、贴纸等30+产品类型</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-black/20">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-cleanup-green" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">众筹生产</h3>
            <p className="text-black/80">超过30人预订即开始实物生产</p>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Before */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-black text-left">上传原图</h3>
              <div className="relative">
                <img
                  src="/task-home-image-replace/before.jpg"
                  alt="原始图片"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full">普通照片</span>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-black text-left">AI生成结果</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <img
                    src="/task-home-image-replace/after.jpg"
                    alt="IP形象"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <div className="absolute inset-0 bg-cleanup-green/20 rounded-lg flex items-center justify-center">
                    <span className="text-black font-medium bg-white/80 px-2 py-1 rounded text-xs">IP形象</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <span className="text-black text-sm font-medium">📱 手机壳</span>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <span className="text-black text-sm font-medium">🗝️ 钥匙扣</span>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <span className="text-black text-sm font-medium">🎪 手办</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Production Counter */}
        <div className="mt-12 bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto border border-black/20">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="text-3xl font-bold text-black">23</div>
            <div className="text-black/80">/</div>
            <div className="text-3xl font-bold text-black">30</div>
            <div className="text-black/80">人已预订</div>
          </div>
          <div className="w-full bg-black/20 rounded-full h-3 mb-4">
            <div className="bg-black h-3 rounded-full" style={{ width: '77%' }} />
          </div>
          <p className="text-black/80 text-sm">
            还需要 <span className="font-bold">7</span> 人预订即可开始生产实物
          </p>
        </div>

        {/* Mobile upload area for this section */}
        <div className="mt-12 md:hidden">
          <div
            className={`upload-area bg-white/10 backdrop-blur-sm p-8 text-center cursor-pointer transition-all duration-300 border-black/20 ${
              isDragOver ? 'border-black bg-white/20' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input-2')?.click()}
          >
            <Upload className="w-6 h-6 mx-auto mb-3 text-black" />
            <p className="font-medium text-black">
              点击上传图片
            </p>
            <input
              id="file-input-2"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                console.log('选择的文件:', files);
              }}
              className="hidden"
              multiple
            />
          </div>
        </div>
      </div>
    </section>
  );
}
