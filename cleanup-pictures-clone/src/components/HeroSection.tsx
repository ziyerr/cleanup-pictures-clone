'use client';

import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Upload, ArrowDown, Wand2, X, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { validateImageFile } from '../lib/ai-api';
import IPGenerationFlow from './IPGenerationFlow';

export default function HeroSection() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{id: string, url: string, file?: File} | null>(null);
  const [styleDescription, setStyleDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 预设风格选项
  const stylePresets = [
    {
      id: 'kawaii',
      label: 'Kawaii 软萌治愈',
      description: '3D 等距视角全身潮玩手办，参照已上传的人像，忽略背景。精准保留参考图中的发型、饰品（如眼镜）、五官、表情、性别与气质，略微瘦脸。渲染光滑塑料质感表面，分割：头部、躯干、手臂、腿部、关节与现有配饰；倒角轮廓统一；柔和且鲜明的色块；细腻工作室反射；可爱与帅气并存；高真实感 3D 渲染，正方形 1:1。2.5 头身 Q 版比例，粉嫩马卡龙配色（peach #FADADD、mint #CCF1E1、baby‑blue #C8E5FF、lemon‑yellow #FFF6B2）；圆润放大双眼与淡粉腮红，额头两枚爱心亮片；软抱枕式泡泡袖与 oversized 兔耳兜帽卫衣；背包挂件：小星星与牛奶盒；柔焦漫反射光，糖果摄影棚氛围。'
    },
    {
      id: 'cyberpunk',
      label: 'Cyberpunk 潮酷赛博',
      description: '3D 等距视角全身潮玩手办，参照已上传的人像，忽略背景。精准保留参考图中的发型、饰品（如眼镜）、五官、表情、性别与气质，略微瘦脸。渲染光滑塑料质感表面，分割：头部、躯干、手臂、腿部、关节与现有配饰；倒角轮廓统一；柔和且鲜明的色块；细腻工作室反射；可爱与帅气并存；高真实感 3D 渲染，正方形 1:1。5‑6 头身写实比例，霓虹紫‑电光青渐变主光（magenta #FF29FF → cyan #00F0FF）；Tech‑wear 折线剪裁外套，胸前微发光 QR‑patch，机械关节若隐若现；透明亚克力面罩内嵌 HUD 模块，边缘 RGB 呼吸灯；服装暗黑碳纤纹理与局部铬金属片，袖口环绕微弱电流特效；赛博城市夜景三点灯位反射，背景保持纯色虚化。'
    },
    {
      id: 'guochao',
      label: 'Guochao 国潮新中式',
      description: '3D 等距视角全身潮玩手办，参照已上传的人像，忽略背景。精准保留参考图中的发型、饰品（如眼镜）、五官、表情、性别与气质，略微瘦脸。渲染光滑塑料质感表面，分割：头部、躯干、手臂、腿部、关节与现有配饰；倒角轮廓统一；柔和且鲜明的色块；细腻工作室反射；可爱与帅气并存；高真实感 3D 渲染，正方形 1:1。3.5 头身 Q‑real 比例，主配色：朱砂红 #E63946、琉璃青 #00867D，点缀鎏金 #D4AF37；改良短款对襟汉服上衣搭配现代运动裤剪裁，盘扣与云纹压印；胸口织金飞鹤纹章，腰间流苏玉佩；袖口与鞋侧水墨晕染渐变呼应山水；柔光棚宣纸台面微反射。'
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
    console.log('处理的文件:', files);

    // 过滤图片文件
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError('请上传图片文件');
      return;
    }

    // 只处理第一张图片，覆盖之前的图片
    const file = imageFiles[0];

    // 验证图片文件
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || '图片文件无效');
      return;
    }

    // 清除之前的错误
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const imageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setUploadedImage({ id: imageId, url: result, file });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setError(null);
  };

  const selectStylePreset = (preset: typeof stylePresets[0]) => {
    setStyleDescription(preset.description);
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Content */}
        <div className="space-y-6">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
            上传一张<span className="highlight-green">图片</span>，
            创造专属<span className="highlight-green">IP形象</span>，
            生成完整<span className="highlight-green">周边套装</span>
            <span className="underline decoration-4 underline-offset-4">秒级完成</span>
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed">
            只需描述您想要的IP风格，我们的AI就能为您生成卡通形象，并制作手机壳、钥匙扣、3D手办、冰箱贴等完整周边产品线
          </p>

          {/* Upload Area 仅在未上传图片时显示 */}
          {!uploadedImage && (
            <div
              className={`upload-area bg-gray-50 p-6 text-center cursor-pointer transition-all duration-300 ${
                isDragOver ? 'dragover' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="flex items-center justify-center mb-3">
                <Upload className="w-8 h-8 text-gray-400 mr-3" />
                <Wand2 className="w-8 h-8 text-cleanup-green" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                点击或拖拽上传图片
              </p>
              <p className="text-sm text-gray-500">
                支持 JPG、PNG 格式，建议尺寸 1024x1024
              </p>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {/* Uploaded Image Preview */}
          {uploadedImage && (
            <div className="relative">
              <img
                src={uploadedImage.url}
                alt="上传的图片"
                className="w-full max-w-sm rounded-lg shadow-md"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Style Input */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              描述您想要的IP风格（可选）
            </label>

            {/* Style Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {stylePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => selectStylePreset(preset)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-cleanup-green hover:text-black rounded-full transition-colors text-gray-700 border border-gray-200 hover:border-cleanup-green"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <textarea
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              placeholder="例如：可爱的卡通风格，大眼睛，温暖的色调，适合做成毛绒玩具..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cleanup-green focus:border-cleanup-green resize-none"
              rows={3}
            />

            {styleDescription && (
              <div className="flex justify-end">
                <button
                  onClick={() => setStyleDescription('')}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  清空描述
                </button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Try with examples - 只在没有上传图片时显示 */}
          {!uploadedImage && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <ArrowDown className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">或试试这些示例</span>
              </div>

              <div className="flex justify-center space-x-4">
                {exampleImages.map((image) => (
                  <button
                    key={image.alt}
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden hover:opacity-80 transition-opacity border-2 border-gray-200 hover:border-cleanup-green"
                    onClick={async () => {
                      const imageId = `example-${Date.now()}`;
                      setUploadedImage({ id: imageId, url: image.src });
                      setError(null);
                      console.log('加载示例:', image.alt);
                    }}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content - IP Generation Flow */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative max-w-md w-full">
            {uploadedImage ? (
              <IPGenerationFlow 
                image={getImageForGeneration()}
                prompt={getFinalPrompt()}
              />
            ) : (
              <img
                src="/task-home-image-replace/before-after.png"
                alt="IP周边产品展示"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            )}

            {/* Floating Product Icons */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-cleanup-green rounded-full flex items-center justify-center shadow-lg">
              <span className="text-black font-bold text-xs">30+</span>
            </div>

            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-cleanup-green">
              <span className="text-xs">📱</span>
            </div>

            <div className="absolute top-1/2 -left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200">
              <span className="text-xs">🗝️</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
