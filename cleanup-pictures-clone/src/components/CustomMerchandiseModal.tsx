'use client';

import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Wand2, AlertCircle, Lightbulb } from 'lucide-react';

interface CustomMerchandiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  characterImageUrl: string;
  onStartGeneration: (merchandiseData: {
    name: string;
    description: string;
    referenceImageUrl?: string;
  }) => void;
}

// 推荐周边商品数据
const MERCHANDISE_RECOMMENDATIONS = [
  {
    name: '可爱钥匙扣',
    description: '设计一个圆形钥匙扣，以IP形象为中心，采用Q版卡通风格，背景是温暖的渐变色彩，周围有小星星和爱心装饰，适合日常携带使用。'
  },
  {
    name: '时尚手机壳',
    description: '创造一个透明手机壳设计，IP形象位于底部角落，采用水彩画风格，背景是淡雅的花朵图案，整体色调温和舒适，适合年轻用户。'
  },
  {
    name: '创意马克杯',
    description: '设计一个白色陶瓷马克杯，IP形象环绕杯身一周，采用简约线条风格，配以温暖的橙色和粉色点缀，营造温馨的咖啡时光氛围。'
  },
  {
    name: '个性化T恤',
    description: '设计一件休闲T恤，IP形象位于胸前正中，采用复古插画风格，背景是几何图案，使用大胆的色彩搭配，展现青春活力。'
  },
  {
    name: '精美贴纸套装',
    description: '创建一套6张贴纸，每张展示IP形象的不同表情和动作，采用可爱的卡通风格，背景透明，适合装饰笔记本和手机。'
  },
  {
    name: '温馨抱枕',
    description: '设计一个方形抱枕，IP形象占据整个枕面，采用柔和的水彩风格，背景是云朵和彩虹图案，色调以蓝色和粉色为主，营造梦幻感觉。'
  },
  {
    name: '便携帆布袋',
    description: '设计一个环保帆布购物袋，IP形象位于正面中央，采用手绘插画风格，背景是简约的植物图案，使用自然的绿色和米色调。'
  },
  {
    name: '桌面摆件',
    description: '创造一个亚克力桌面摆件，IP形象采用立体透视效果，背景是渐变的星空图案，底座刻有角色名字，适合办公桌装饰。'
  },
  {
    name: '笔记本封面',
    description: '设计一个A5笔记本封面，IP形象位于右下角，采用日系小清新风格，背景是手绘的文具和书本图案，色调温暖柔和。'
  },
  {
    name: '冰箱磁贴',
    description: '制作一个圆形冰箱磁贴，IP形象采用超可爱Q版造型，背景是彩色的食物小图标，整体设计活泼有趣，为厨房增添乐趣。'
  }
];

export default function CustomMerchandiseModal({
  isOpen,
  onClose,
  characterId,
  characterName,
  characterImageUrl,
  onStartGeneration
}: CustomMerchandiseModalProps) {
  const [merchandiseName, setMerchandiseName] = useState('');
  const [description, setDescription] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      
      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('图片文件不能超过5MB');
        return;
      }

      setReferenceImage(file);
      
      // 创建预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImageUrl('');
  };

  const handleRecommendationSelect = (recommendation: typeof MERCHANDISE_RECOMMENDATIONS[0]) => {
    setMerchandiseName(recommendation.name);
    setDescription(recommendation.description);
    setShowRecommendations(false);
    setErrors({}); // 清除错误信息
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!merchandiseName.trim()) {
      newErrors.name = '请输入周边商品名称';
    }
    
    if (!description.trim()) {
      newErrors.description = '请输入周边样式描述';
    } else if (description.trim().length < 10) {
      newErrors.description = '描述至少需要10个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartGeneration = async () => {
    if (!validateForm()) return;
    
    setIsGenerating(true);
    try {
      let finalReferenceImageUrl = characterImageUrl; // 默认使用角色图片
      
      // 如果用户上传了参考图，先上传到服务器
      if (referenceImage) {
        const formData = new FormData();
        formData.append('image', referenceImage);
        
        const uploadResponse = await fetch('/api/upload-reference-image', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          finalReferenceImageUrl = uploadResult.url;
        } else {
          console.warn('参考图上传失败，将使用角色原图');
        }
      }
      
      await onStartGeneration({
        name: merchandiseName.trim(),
        description: description.trim(),
        referenceImageUrl: finalReferenceImageUrl,
      });
      
      // 重置表单
      setMerchandiseName('');
      setDescription('');
      setReferenceImage(null);
      setReferenceImageUrl('');
      setErrors({});
      
      onClose();
    } catch (error) {
      console.error('启动生成失败:', error);
      alert('启动生成失败，请稍后再试');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">创建自定义周边</h2>
              <p className="text-gray-600 mt-1">为"{characterName}"设计独特的周边商品</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Character Preview */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-3">基础IP形象</h3>
            <img
              src={characterImageUrl}
              alt={characterName}
              className="w-24 h-24 mx-auto rounded-lg object-cover border-2 border-gray-200"
            />
            <p className="text-sm text-gray-600 mt-2">{characterName}</p>
          </div>

          {/* Merchandise Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                周边商品名称 <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="flex items-center gap-1 text-sm text-cleanup-green hover:text-green-600 font-medium"
              >
                <Lightbulb className="w-4 h-4" />
                {showRecommendations ? '收起推荐' : '查看推荐'}
              </button>
            </div>
            <input
              type="text"
              value={merchandiseName}
              onChange={(e) => setMerchandiseName(e.target.value)}
              placeholder="例如：可爱钥匙扣、时尚手机壳、创意马克杯..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cleanup-green focus:border-cleanup-green ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
            
            {/* Recommendations Panel */}
            {showRecommendations && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-cleanup-green" />
                  推荐周边商品
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {MERCHANDISE_RECOMMENDATIONS.map((recommendation, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleRecommendationSelect(recommendation)}
                      className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-cleanup-green hover:bg-green-50 transition-colors group"
                    >
                      <div className="font-medium text-gray-900 group-hover:text-green-700 mb-1">
                        {recommendation.name}
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {recommendation.description.substring(0, 60)}...
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  点击任意推荐项即可自动填入名称和描述
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              周边样式描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述您想要的周边样式，例如：设计一个可爱的钥匙扣，采用Q版风格，背景是粉色渐变，IP形象居中显示，周围有小星星装饰..."
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cleanup-green focus:border-cleanup-green resize-none ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  这个描述将作为AI生成的提示词，描述越详细效果越好
                </p>
              )}
              <span className="text-sm text-gray-400">
                {description.length}/500
              </span>
            </div>
          </div>

          {/* Reference Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              参考图片 <span className="text-gray-500">(可选)</span>
            </label>
            <p className="text-sm text-gray-500 mb-3">
              上传参考图片可以帮助AI更好地理解您想要的样式风格
            </p>
            
            {!referenceImageUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="reference-image-upload"
                />
                <label
                  htmlFor="reference-image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">点击上传参考图片</p>
                  <p className="text-xs text-gray-500">支持 JPG、PNG 格式，最大 5MB</p>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={referenceImageUrl}
                  alt="参考图片"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={removeReferenceImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  参考图片
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              取消
            </button>
            <button
              onClick={handleStartGeneration}
              disabled={isGenerating}
              className={`
                px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
                ${isGenerating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-cleanup-green text-black hover:bg-green-400'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  开始生成
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
