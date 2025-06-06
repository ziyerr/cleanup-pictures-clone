'use client';

import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Upload, ArrowDown, Wand2, X, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { generateIPCharacterWithTask, validateImageFile } from '../lib/ai-api';
import AuthModal from './AuthModal';
import { useUser } from '../contexts/UserContext';
import { useRouter } from 'next/navigation';
import IPGenerationFlow from './IPGenerationFlow';

export default function HeroSection() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ id: string; url: string; file?: File } | null>(null);
  const [styleDescription, setStyleDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const { currentUser } = useUser();
  const router = useRouter();

  // 预设风格选项
  const stylePresets = [
    {
      id: 'kawaii',
      label: 'Kawaii 软萌治愈',
      description: '3D 等距视角全身潮玩手办，参照已上传的人像，忽略背景。精准保留参考图中的发型、饰品（如眼镜）、五官、表情、性别与气质，瘦脸。渲染光滑塑料质感表面，分割：头部、躯干、手臂、腿部、关节与现有配饰；倒角轮廓统一；柔和且鲜明的色块；细腻工作室反射；可爱与帅气并存；高真实感 3D 渲染，正方形 1:1。2.5 头身 Q 版比例，粉嫩马卡龙配色（peach #FADADD、mint #CCF1E1、baby‑blue #C8E5FF、lemon‑yellow #FFF6B2）；圆润放大双眼与淡粉腮红，额头两枚爱心亮片；软抱枕式泡泡袖与 oversized 兔耳兜帽卫衣；背包挂件：小星星与牛奶盒；柔焦漫反射光，糖果摄影棚氛围。'
    },
    {
      id: 'cyberpunk',
      label: 'Cyberpunk 潮酷赛博',
      description: '3D 等距视角全身潮玩手办，参照已上传的人像，忽略背景。精准保留参考图中的发型、饰品（如眼镜）、五官、表情、性别与气质，瘦脸。渲染光滑塑料质感表面，分割：头部、躯干、手臂、腿部、关节与现有配饰；倒角轮廓统一；柔和且鲜明的色块；细腻工作室反射；可爱与帅气并存；高真实感 3D 渲染，正方形 1:1。5‑6 头身写实比例，霓虹紫‑电光青渐变主光（magenta #FF29FF → cyan #00F0FF）；Tech‑wear 折线剪裁外套，胸前微发光 QR‑patch，机械关节若隐若现；透明亚克力面罩内嵌 HUD 模块，边缘 RGB 呼吸灯；服装暗黑碳纤纹理与局部铬金属片，袖口与鞋侧微弱电流特效；赛博城市夜景三点灯位反射，背景保持纯色虚化。'
    },
    {
      id: 'guochao',
      label: 'Guochao 国潮新中式',
      description: '3D 等距视角全身潮玩手办，参照已上传的人像，忽略背景。精准保留参考图中的发型、饰品（如眼镜）、五官、表情、性别与气质，瘦脸。渲染光滑塑料质感表面，分割：头部、躯干、手臂、腿部、关节与现有配饰；倒角轮廓统一；柔和且鲜明的色块；细腻工作室反射；可爱与帅气并存；高真实感 3D 渲染，正方形 1:1。3.5 头身 Q‑real 比例，主配色：朱砂红 #E63946、琉璃青 #00867D，点缀鎏金 #D4AF37；改良短款对襟汉服上衣搭配现代运动裤剪裁，盘扣与云纹压印；胸口织金飞鹤纹章，腰间流苏玉佩；袖口与鞋侧水墨晕染渐变呼应山水；柔光棚宣纸台面微反射。'
    }
  ];

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
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (!imageFile) {
      setError('请上传图片文件');
      return;
    }
    const validation = validateImageFile(imageFile);
    if (!validation.valid) {
      setError(validation.error || '图片文件无效');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage({ id: Date.now().toString(), url: result, file: imageFile });
    };
    reader.readAsDataURL(imageFile);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setError(null);
    setStyleDescription('');
    setSelectedPresetId(null);
  };

  const selectStylePreset = (preset: typeof stylePresets[0]) => {
    setSelectedPresetId(preset.id);
    setStyleDescription(preset.description);
  };

  const handleAuthSuccess = (user: any) => {
    setShowAuthModal(false);
  };

  const exampleImages = [
    {
      src: 'https://ext.same-assets.com/1651265233/1201440311.jpeg',
      alt: '卡通角色示例'
    },
    {
      src: 'https://ext.same-assets.com/1651265233/406424930.jpeg',
      alt: '宠物IP示例'
    },
    {
      src: 'https://ext.same-assets.com/1651265233/3769327180.jpeg',
      alt: '人物形象示例'
    }
  ];

  // 获取最终的prompt
  const getFinalPrompt = () => {
    return styleDescription || '可爱的卡通IP形象，圆润的设计，明亮的色彩，大眼睛，友好的表情，适合制作手机壳、钥匙扣等周边产品';
  };

  // 获取要传递给IPGenerationFlow的图片
  const getImageForGeneration = (): File | string => {
    if (uploadedImage?.file) {
      return uploadedImage.file;
    } else if (uploadedImage?.url) {
      return uploadedImage.url;
    }
    throw new Error('请先上传图片');
  };

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <svg
            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>

          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">AI 驱动的 IP 形象</span>
                <span className="block text-cleanup-green xl:inline">创作与孵化平台</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                上传一张照片，选择您喜欢的风格，我们的人工智能将为您生成独特的卡通 IP 形象，并探索从 3D 模型到实体周边的无限可能。
              </p>
            </div>
            
            {/* This is the main logic switch */}
            {!uploadedImage ? (
              // UPLOAD AREA
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-8 p-8 border-2 ${
                  isDragOver ? 'border-cleanup-green bg-green-50' : 'border-dashed border-gray-300'
                } rounded-lg text-center transition-colors`}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-cleanup-green hover:text-cleanup-green-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                  >
                    <span>上传一张图片</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileInput} accept="image/png, image/jpeg, image/webp" />
                  </label>
                  或拖拽到此处
                </p>
                <p className="mt-1 text-xs text-gray-500">PNG, JPG, WEBP, 不超过 10MB</p>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>
            ) : (
              // STYLE SELECTION AND GENERATION FLOW AREA
              <div className="space-y-6 mt-8">
                {/* Image Preview with Remove Button */}
                <div className="relative w-full max-w-sm">
                  <img src={uploadedImage.url} alt="Uploaded" className="w-full rounded-lg shadow-md" />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Style Selection */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    选择或描述您想要的IP风格
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                    {stylePresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => selectStylePreset(preset)}
                        className={`px-3 py-2 text-sm rounded-full transition-colors border ${
                          selectedPresetId === preset.id
                            ? 'bg-cleanup-green text-black border-cleanup-green'
                            : 'bg-gray-100 hover:bg-cleanup-green hover:text-black text-gray-700 border-gray-200 hover:border-cleanup-green'
                        }`}>
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={styleDescription}
                    onChange={(e) => {
                      setStyleDescription(e.target.value);
                      setSelectedPresetId(null);
                    }}
                    placeholder="或在此处输入自定义描述..."
                    className="w-full p-3 border border-gray-300 rounded-lg ..."
                    rows={3}
                  />
                </div>
                
                {/* Generation Component */}
                <IPGenerationFlow
                  image={uploadedImage.file || uploadedImage.url}
                  prompt={getFinalPrompt()}
                />
              </div>
            )}
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
          src="/task-home-image-replace/after.png"
          alt="Generated IP character"
        />
      </div>
       {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
