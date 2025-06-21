'use client';

import { useState } from 'react';
import { Button } from './ui/button';

type UseCase = {
  id: string;
  title: string;
  beforeImage: string;
  afterImage: string;
  description: string;
  isHighlighted?: boolean;
};

export default function UseCases() {
  const [activeCategory, setActiveCategory] = useState('创意设计师');

  const categories = [
    '个人用户',
    '创意设计师',
    '电商品牌',
    '文化IP',
    '宠物主人',
    '开发者API'
  ];

  const useCases: Record<string, UseCase[]> = {
    '个人用户': [
      {
        id: 'personal-1',
        title: '打造专属IP形象和周边',
        beforeImage: '/use-cases/personal-before.jpeg',
        afterImage: '/use-cases/personal-after.jpeg',
        description: '个人用户上传自己的照片，AI生成可爱的卡通形象，制作成手机壳、钥匙扣、头像等个人专属周边产品。\n\n非常适合送给朋友、家人作为独特的生日礼物，或者为自己打造专属的个人品牌形象。'
      }
    ],
    '创意设计师': [
      {
        id: 'designer-1',
        title: '快速原型制作和客户展示',
        beforeImage: '/use-cases/designer-before.jpeg',
        afterImage: '/use-cases/designer-after.jpeg',
        description: '设计师可以快速将概念草图转化为完整的IP形象和周边产品展示，大大提高工作效率。\n\n帮助设计师向客户展示完整的产品线概念，获得更多商业机会。'
      }
    ],
    '电商品牌': [
      {
        id: 'ecommerce-1',
        title: '创建品牌吉祥物和周边',
        beforeImage: '/use-cases/ecommerce-before.jpeg',
        afterImage: '/use-cases/ecommerce-after.jpeg',
        description: '电商品牌通过上传产品图片或品牌元素，创建独特的品牌吉祥物IP形象。\n\n生成完整的品牌周边产品线，增强品牌认知度和用户粘性，提升营销效果。'
      }
    ],
    '文化IP': [
      {
        id: 'cultural-1',
        title: '传统文化现代化表达',
        beforeImage: '/use-cases/cultural-before.jpeg',
        afterImage: '/use-cases/cultural-after.jpeg',
        description: '将传统文化元素、历史人物等转化为现代可爱的IP形象，制作成各种文创产品。\n\n让传统文化以更贴近年轻人的方式传播，创造新的文化价值和商业价值。'
      }
    ],
    '宠物主人': [
      {
        id: 'pet-1',
        title: '宠物IP化和周边定制',
        beforeImage: '/use-cases/pet-before.jpeg',
        afterImage: '/use-cases/pet-after.jpeg',
        description: '宠物主人上传爱宠照片，生成可爱的宠物卡通形象，制作成各种周边产品。\n\n非常适合制作成纪念品、礼物，或者发展成宠物网红IP。'
      }
    ],
    '开发者API': [
      {
        id: 'api-1',
        title: '集成IP生成功能',
        beforeImage: '/use-cases/api-before.jpeg',
        afterImage: '/use-cases/api-after.jpeg',
        description: '开发者可以通过API接口将IP生成和周边制作功能集成到自己的应用中。\n\n为用户提供个性化的IP创作服务，创造新的商业模式。'
      }
    ]
  };

  const currentUseCases = useCases[activeCategory] || [];

  return (
    <section id="usecases" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <h2 className="text-4xl lg:text-5xl font-bold text-center mb-12">
          应用场景
        </h2>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              className={`rounded-full px-6 py-2 font-medium transition-all ${
                activeCategory === category
                  ? category === '宠物主人'
                    ? 'bg-cleanup-green hover:bg-cleanup-green/90 text-black border-cleanup-green'
                    : 'bg-black hover:bg-gray-800 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Use Case Content */}
        {currentUseCases.map((useCase) => (
          <div key={useCase.id} className="space-y-8">
            {/* Before/After Images */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700">原始素材</h4>
                <img
                  src={useCase.beforeImage}
                  alt={`原始素材: ${useCase.title}`}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700">生成结果</h4>
                <div className="grid grid-cols-2 gap-4">
                  <img
                    src={useCase.afterImage}
                    alt={`IP形象: ${useCase.title}`}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <div className="grid grid-cols-1 gap-2">
                    <div className="bg-white rounded-lg p-4 shadow-md text-center">
                      <span className="text-2xl mb-2 block">📱</span>
                      <span className="text-xs font-medium">手机壳</span>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-md text-center">
                      <span className="text-2xl mb-2 block">🗝️</span>
                      <span className="text-xs font-medium">钥匙扣</span>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-md text-center">
                      <span className="text-2xl mb-2 block">🎪</span>
                      <span className="text-xs font-medium">手办</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-center mb-4">{useCase.title}</h3>
              <p className="text-lg leading-relaxed text-gray-700 text-center whitespace-pre-line">
                {useCase.description}
              </p>
            </div>
          </div>
        ))}

        {/* Bottom CTA for pet owners */}
        {activeCategory === '宠物主人' && (
          <div className="mt-12 text-center">
            <div className="bg-cleanup-green rounded-2xl p-6 max-w-4xl mx-auto">
              <p className="text-lg font-medium text-black">
                让您的爱宠成为独一无二的IP明星，创造专属的宠物周边产品线！
              </p>
            </div>
          </div>
        )}

        {/* Production Progress */}
        <div className="mt-16 bg-white rounded-2xl p-8 max-w-4xl mx-auto border border-gray-200 shadow-lg">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">众筹生产进度</h3>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="text-4xl font-bold text-cleanup-green">156</div>
              <div className="text-gray-400">/</div>
              <div className="text-4xl font-bold text-gray-800">30</div>
              <div className="text-gray-600">个IP项目已达到生产要求</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div className="bg-cleanup-green h-4 rounded-full" style={{ width: '100%' }} />
            </div>
            <p className="text-gray-600">
              已有 <span className="font-bold text-cleanup-green">156</span> 个IP项目超过30人预订，正在生产中
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
