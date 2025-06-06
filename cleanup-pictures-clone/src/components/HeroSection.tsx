'use client';

import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Upload, ArrowDown, Wand2, X, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { generateIPCharacter, validateImageFile } from '../lib/ai-api';
import AuthModal from './AuthModal';
import { saveUserIPCharacter } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';

export default function HeroSection() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{id: string, url: string, file?: File} | null>(null);
  const [styleDescription, setStyleDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{url: string, id: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { currentUser, setCurrentUser } = useUser();

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

    // 清除之前的错误和结果
    setError(null);
    setGeneratedResult(null);

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
    setGeneratedResult(null);
    setError(null);
  };

  const selectStylePreset = (preset: typeof stylePresets[0]) => {
    setStyleDescription(preset.description);
  };

  // Download generated image
  const downloadGeneratedImage = async () => {
    if (!generatedResult) return;

    try {
      const response = await fetch(generatedResult.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `popverse-ip-${generatedResult.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      setError('下载失败，请稍后重试');
    }
  };

  // Handle save IP character
  const handleSaveIPCharacter = async () => {
    if (!generatedResult) {
      setError('请先生成IP形象');
      return;
    }

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      // Save IP character to user's collection
      await saveUserIPCharacter(currentUser.id, `IP形象_${Date.now()}`, generatedResult.url);
      
      // TODO: 这里可以添加周边生成逻辑
      alert('IP形象保存成功！周边生成功能开发中...');
    } catch (error) {
      console.error('保存IP形象失败:', error);
      setError(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // Save IP character after authentication
  const saveIPAfterAuth = async (user: any) => {
    if (!generatedResult) return;

    try {
      await saveUserIPCharacter(user.id, `IP形象_${Date.now()}`, generatedResult.url);
      alert('IP形象保存成功！周边生成功能开发中...');
    } catch (error) {
      console.error('保存IP形象失败:', error);
      setError(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // Handle AI generation
  const handleGenerate = async () => {
    if (!uploadedImage) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 准备生成请求
      let prompt = styleDescription || '可爱的卡通风格，大眼睛，温暖的色调，适合做成毛绒玩具';

      // 如果没有自定义描述，基于图片类型生成更好的提示
      if (!styleDescription) {
        prompt = '可爱的卡通IP形象，圆润的设计，明亮的色彩，大眼睛，友好的表情，适合制作手机壳、钥匙扣等周边产品';
      }

      let imageToSend: File | string;
      if (uploadedImage.file) {
        imageToSend = uploadedImage.file;
      } else {
        // 如果是示例图片，使用URL
        imageToSend = uploadedImage.url;
      }

      console.log('开始生成IP形象...', { prompt, hasFile: !!uploadedImage.file });

      const result = await generateIPCharacter({
        image: imageToSend,
        prompt: prompt
      });

      if (result.success && result.data) {
        setGeneratedResult(result.data);
        console.log('生成成功:', result.data);
      } else {
        throw new Error(result.error || '生成失败，请稍后重试');
      }
    } catch (error) {
      console.error('生成过程中出错:', error);
      setError(error instanceof Error ? error.message : '生成失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
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

          {/* Upload Area 仅在未生成图片时显示 */}
          {!generatedResult && (
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

          {/* Success Display */}
          {generatedResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700 text-sm">IP形象生成成功！查看右侧预览</p>
            </div>
          )}

          {/* 主操作按钮：未生成图片时显示"开始生成IP形象"，生成图片后变为"重新生成IP形象" */}
          <div className="flex flex-col items-center mt-8">
            <button
              onClick={handleGenerate}
              className="w-full max-w-xs py-3 px-8 rounded-xl bg-white text-black font-bold text-base border border-gray-300 shadow hover:bg-gray-50 transition-all mb-2"
            >
              {generatedResult ? '重新生成IP形象' : '开始生成IP形象'}
            </button>
          </div>

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
                      setGeneratedResult(null);
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

        {/* Right Content - Product Showcase */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative max-w-md w-full">
            {/* Main Product Image */}
            {generatedResult ? (
              /* Generated IP Character */
              <>
                <div className="relative">
                  <img
                    src={generatedResult.url}
                    alt="生成的IP形象"
                    className="w-full h-auto rounded-2xl shadow-2xl max-h-[420px] object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl pointer-events-none" />
                </div>
                {/* 操作按钮区域：图片下方64px间距，块级独立，宽度与图片对齐 */}
                <div className="flex flex-row justify-center items-center gap-6 px-8 py-6 bg-white rounded-3xl shadow-2xl border border-gray-100 mt-20 mx-auto max-w-lg" style={{marginTop:'80px'}}>
                  <button
                    onClick={handleSaveIPCharacter}
                    className="flex flex-col items-center gap-1 px-14 py-4 rounded-3xl bg-cleanup-green text-black font-extrabold text-xl shadow-xl border-2 border-cleanup-green hover:bg-green-300 transition-all min-w-[240px]"
                  >
                    <span className="flex items-center gap-2 text-2xl font-extrabold"><Sparkles className="w-7 h-7" />保存IP形象</span>
                    <span className="text-base font-bold mt-1">立即生成周边</span>
                  </button>
                  <button
                    onClick={downloadGeneratedImage}
                    className="p-2 bg-transparent border-none shadow-none hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all"
                    style={{ boxShadow: 'none', border: 'none' }}
                    aria-label="下载图片"
                  >
                    <ArrowDown className="w-6 h-6" />
                  </button>
                </div>
              </>
            ) : uploadedImage ? (
              <div className="relative">
                <img
                  src={uploadedImage.url}
                  alt="用户上传的图片预览"
                  className={`w-full h-auto rounded-2xl shadow-2xl transition-opacity duration-300 ${
                    isGenerating ? 'opacity-50' : ''
                  }`}
                />
                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-3">
                      <Loader2 className="w-6 h-6 animate-spin text-cleanup-green" />
                      <p className="text-sm font-medium text-gray-800">
                        AI正在生成您的IP形象...
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-800">
                      ✨ 准备生成专属IP形象
                    </p>
                  </div>
                </div>
              </div>
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

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
          // 自动保存IP形象
          saveIPAfterAuth(user);
        }}
      />
    </section>
  );
}
