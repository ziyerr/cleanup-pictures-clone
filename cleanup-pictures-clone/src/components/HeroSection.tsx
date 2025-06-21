'use client';

import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Upload, ArrowDown, Wand2, X, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { generateIPCharacter, validateImageFile } from '../lib/ai-api';
import AuthModal from './AuthModal';
import ServiceStatusBanner from './ServiceStatusBanner';
import { saveUserIPCharacter, type AuthUser } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import { useRouter } from 'next/navigation';

export default function HeroSection() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{id: string, url: string, file?: File} | null>(null);
  const [styleDescription, setStyleDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{url: string, id: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [encouragingMessage, setEncouragingMessage] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showServiceBanner, setShowServiceBanner] = useState(false);
  const { currentUser, setCurrentUser, isLoading } = useUser();
  const router = useRouter();

  // 鼓励文案数组
  const encouragingMessages = [
    '正在分析您的图片特征...',
    'AI正在理解您的风格需求...',
    '正在生成专属IP形象...',
    '快完成了，请耐心等待...',
    '即将为您呈现精美作品...',
    '最后的细节调整中...'
  ];

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
      description: '3D 等距视角全身潮玩手办，参照已上传的人像，忽略背景。精准保留参考图中的发型、饰品（如眼镜）、五官、表情、性别与气质，瘦脸。渲染光滑塑料质感表面，分割：头部、躯干、手臂、腿部、关节与现有配饰；倒角轮廓统一；柔和且鲜明的色块；细腻工作室反射；可爱与帅气并存；高真实感 3D 渲染，正方形 1:1。5‑6 头身写实比例，霓虹紫‑电光青渐变主光（magenta #FF29FF → cyan #00F0FF）；Tech‑wear 折线剪裁外套，胸前微发光 QR‑patch，机械关节若隐若现；透明亚克力面罩内嵌 HUD 模块，边缘 RGB 呼吸灯；服装暗黑碳纤纹理与局部铬金属片，袖口环绕微弱电流特效；赛博城市夜景三点灯位反射，背景保持纯色虚化。'
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
    setSelectedPresetId(preset.id);
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
    // 1. 检查是否有生成的IP形象
    if (!generatedResult) {
      setError('请先生成IP形象');
      return;
    }

    // 2. 如果用户状态正在加载，等待加载完成
    if (isLoading) {
      console.log('用户状态加载中，稍后重试...');
      return;
    }

    // 3. 检查用户登录状态
    if (!currentUser) {
      console.log('用户未登录，显示登录窗口');
      setShowAuthModal(true);
      return;
    }

    // 4. 验证用户数据的完整性
    if (!currentUser.id || !currentUser.username) {
      console.error('用户数据不完整:', currentUser);
      setError('用户信息异常，请重新登录');
      setShowAuthModal(true);
      return;
    }

    console.log('用户已登录，开始保存IP形象...', { 
      userId: currentUser.id, 
      username: currentUser.username 
    });

    setIsSaving(true);
    setError(null);

    try {
      // Save IP character to user's collection
      const savedIP = await saveUserIPCharacter(
        currentUser.id, 
        `IP形象_${Date.now()}`, 
        generatedResult.url
      );
      
      console.log('IP形象保存成功，跳转到详情页:', savedIP.id);
      // 直接跳转到刚保存的IP详情页
      router.push(`/workshop?ipId=${savedIP.id}`);
    } catch (error) {
      console.error('保存IP形象失败:', error);
      
      // 针对不同错误类型给出相应提示
      if (error instanceof Error) {
        if (error.message.includes('认证失败') || error.message.includes('JWT') || error.message.includes('unauthorized')) {
          setError('登录状态已过期，请重新登录');
          setShowAuthModal(true);
        } else if (error.message.includes('网络连接失败') || error.message.includes('Failed to fetch')) {
          setError('网络连接失败，请检查网络后重试');
        } else {
          setError(`保存失败: ${error.message}`);
        }
      } else {
        setError('保存失败: 未知错误');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Save IP character after authentication
  const saveIPAfterAuth = async (user: AuthUser) => {
    if (!generatedResult) return;

    setIsSaving(true);
    setError(null);

    try {
      const savedIP = await saveUserIPCharacter(user.id, `IP形象_${Date.now()}`, generatedResult.url);
      // 直接跳转到刚保存的IP详情页
      router.push(`/workshop?ipId=${savedIP.id}`);
    } catch (error) {
      console.error('保存IP形象失败:', error);
      setError(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle AI generation
  const handleGenerate = async () => {
    if (!uploadedImage) return;

    setIsGenerating(true);
    setError(null);
    
    // 开始鼓励文案循环
    let messageIndex = 0;
    setEncouragingMessage(encouragingMessages[0]);
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % encouragingMessages.length;
      setEncouragingMessage(encouragingMessages[messageIndex]);
    }, 5000);

    try {
      // 准备生成请求
      let prompt = styleDescription || '可爱的卡通风格，大眼睛，温暖的色调，适合做成毛绒玩具。需要确保生成的IP形象完整，包含完整的身体和四肢';

      // 如果没有自定义描述，基于图片类型生成更好的提示
      if (!styleDescription) {
        prompt = '可爱的卡通IP形象，圆润的设计，明亮的色彩，大眼睛，友好的表情，适合制作手机壳、钥匙扣等周边产品。需要确保生成的IP形象完整，包含完整的身体和四肢';
      }

      let imageToSend: File | string;
      if (uploadedImage.file) {
        imageToSend = uploadedImage.file;
      } else {
        // 如果是示例图片，使用URL
        imageToSend = uploadedImage.url;
      }

      console.log('开始生成IP形象...', { prompt, hasFile: !!uploadedImage.file });

      // 简化的API调用，无重试逻辑
      const result = await generateIPCharacter({
        image: imageToSend,
        prompt: prompt
      });

      if (result.success && result.data) {
        setGeneratedResult(result.data);
        console.log('生成成功:', result.data);
        
        // 自动保存逻辑：暂时禁用，等待Supabase配置完成
        // TODO: 配置好Supabase环境变量后重新启用
        console.log('自动保存已暂时禁用（等待数据库配置）');
        /*
        if (currentUser && !isLoading && result.data) {
          console.log('用户已登录，开始自动保存IP形象...');
          try {
            await saveUserIPCharacter(currentUser.id, `IP形象_${Date.now()}`, result.data.url);
            console.log('✅ IP形象已自动保存到用户收藏');
            // 可以显示一个成功提示，但不重定向，让用户继续查看结果
          } catch (saveError) {
            console.warn('⚠️ 自动保存失败，但生成成功:', saveError);
            // 自动保存失败不影响主流程，用户仍然可以手动保存
          }
        } else {
          console.log('用户未登录，跳过自动保存');
        }
        */
      } else {
        // 简化错误处理，直接显示API返回的错误信息
        const errorMessage = result.error || '生成失败，请稍后重试';
        setError(errorMessage);

        // 如果是服务维护错误，显示状态横幅
        if (errorMessage.includes('维护中') || errorMessage.includes('暂时不可用') || errorMessage.includes('Service Unavailable')) {
          setShowServiceBanner(true);
        }
      }
    } catch (error) {
      console.error('生成过程中出错:', error);
      // 统一的错误处理，不区分错误类型
      setError('网络异常，请检查连接后重试');
    } finally {
      clearInterval(messageInterval);
      setIsGenerating(false);
      setEncouragingMessage('');
    }
  };

  const exampleImages = [
    {
      src: '/examples/cartoon-character.jpeg',
      alt: '卡通角色示例'
    },
    {
      src: '/examples/pet-ip.jpeg',
      alt: '宠物IP示例'
    },
    {
      src: '/examples/character-portrait.jpeg',
      alt: '人物形象示例'
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Content */}
        <div className="space-y-4">
          {!uploadedImage && (
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">
              上传一张<span className="highlight-green">图片</span>，
              创造专属<span className="highlight-green">IP形象</span>，
              生成完整<span className="highlight-green">周边套装</span>
              <span className="underline decoration-4 underline-offset-4">秒级完成</span>
            </h1>
          )}

          {!uploadedImage && (
            <p className="text-xl text-gray-600 leading-relaxed">
              只需描述您想要的IP风格，我们的AI就能为您生成卡通形象，并制作手机壳、钥匙扣、3D手办、冰箱贴等完整周边产品线
            </p>
          )}

          {/* Upload Area - 显示上传区域或已上传的图片 */}
          {uploadedImage ? (
            <div className="relative max-h-[400px] overflow-hidden rounded-2xl bg-gray-50">
              <img
                src={uploadedImage.url}
                alt="用户上传的图片"
                className="w-full h-auto max-h-[400px] object-contain rounded-2xl"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              className={`upload-area bg-gray-50 p-4 text-center cursor-pointer transition-all duration-300 ${
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
                  className={`px-2 py-1 text-sm rounded-full transition-colors border ${
                    selectedPresetId === preset.id
                      ? 'bg-cleanup-green text-black border-cleanup-green'
                      : 'bg-gray-100 hover:bg-cleanup-green hover:text-black text-gray-700 border-gray-200 hover:border-cleanup-green'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <textarea
              value={styleDescription}
              onChange={(e) => {
                setStyleDescription(e.target.value);
                setSelectedPresetId(null); // Clear selection when manually editing
              }}
              placeholder="例如：可爱的卡通风格，大眼睛，温暖的色调，适合做成毛绒玩具..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cleanup-green focus:border-cleanup-green resize-none"
              rows={2}
              style={{ minHeight: '120px' }}
            />

            {styleDescription && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setStyleDescription('');
                    setSelectedPresetId(null);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  清空描述
                </button>
              </div>
            )}
          </div>

          {/* Service Status Banner */}
          {showServiceBanner && (
            <ServiceStatusBanner
              onRetry={() => {
                setShowServiceBanner(false);
                setError(null);
              }}
            />
          )}

          {/* Error Display */}
          {error && !showServiceBanner && (
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
          <div className="flex flex-col items-center mt-4">
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || isGenerating}
              className="w-full max-w-xs py-3 px-8 rounded-xl bg-white text-black font-bold text-base border border-gray-300 shadow hover:bg-gray-50 transition-all mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? '生成中...' : generatedResult ? '重新生成IP形象' : '开始生成IP形象'}
            </button>
          </div>

          {/* Try with examples - 只在没有上传图片时显示 */}
          {!uploadedImage && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
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
        <div className="flex justify-center lg:justify-end mt-8 lg:mt-0">
          <div className="relative max-w-md w-full">

            
            {/* Main Product Image */}
            {generatedResult ? (
              /* Generated IP Character */
              <>
                <div className="relative w-full h-[420px] rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={generatedResult.url}
                    alt="生成的IP形象"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  
                  {/* 装饰图标层 */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* 左上角星星 */}
                    <div className="absolute top-4 left-4 w-8 h-8 bg-yellow-200/90 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <span className="text-lg">✨</span>
                    </div>
                    
                    {/* 右上角心形 */}
                    <div className="absolute top-6 right-6 w-9 h-9 bg-pink-200/90 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{animationDelay: '0.5s'}}>
                      <span className="text-lg">💖</span>
                    </div>
                    
                    {/* 左下角彩虹 */}
                    <div className="absolute bottom-8 left-6 w-8 h-8 bg-blue-200/90 rounded-full flex items-center justify-center shadow-lg animate-pulse" style={{animationDelay: '1s'}}>
                      <span className="text-lg">🌈</span>
                    </div>
                    
                    {/* 右下角皇冠 */}
                    <div className="absolute bottom-4 right-4 w-7 h-7 bg-purple-200/90 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{animationDelay: '1.5s'}}>
                      <span className="text-sm">👑</span>
                    </div>
                    
                    {/* 右侧蝴蝶 */}
                    <div className="absolute top-1/2 right-2 w-7 h-7 bg-orange-200/90 rounded-full flex items-center justify-center shadow-lg animate-pulse transform -translate-y-1/2" style={{animationDelay: '2s'}}>
                      <span className="text-sm">🦋</span>
                    </div>
                    
                    {/* 左侧火箭 */}
                    <div className="absolute top-1/3 left-2 w-6 h-6 bg-green-200/90 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{animationDelay: '0.3s'}}>
                      <span className="text-xs">🚀</span>
                    </div>
                  </div>
                </div>
                {/* 操作按钮区域：图片下方64px间距，块级独立，宽度与图片对齐 */}
                <div className="flex flex-row justify-center items-center gap-6 px-8 py-6 bg-white rounded-3xl shadow-2xl border border-gray-100 mt-20 mx-auto max-w-lg" style={{marginTop:'80px'}}>
                  <button
                    onClick={handleSaveIPCharacter}
                    disabled={isSaving}
                    className="flex flex-col items-center gap-1 px-14 py-4 rounded-3xl bg-cleanup-green text-black font-extrabold text-xl shadow-xl border-2 border-cleanup-green hover:bg-green-300 transition-all min-w-[240px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2 text-2xl font-extrabold">
                      {isSaving ? (
                        <Loader2 className="w-7 h-7 animate-spin" />
                      ) : (
                        <Sparkles className="w-7 h-7" />
                      )}
                      {isSaving ? '保存中...' : '保存IP形象'}
                    </span>
                    <span className="text-base font-bold mt-1">
                      {isSaving ? '请稍候' : '立即生成周边'}
                    </span>
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
            ) : isGenerating ? (
              /* Generation Loading State */
              <div className="relative">
                <div className="w-full h-[420px] bg-gradient-to-br from-cleanup-green/10 to-blue-50 rounded-2xl shadow-2xl flex flex-col items-center justify-center">
                  <div className="mb-8">
                    <Loader2 className="w-16 h-16 animate-spin text-cleanup-green mb-4" />
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-cleanup-green rounded-full animate-pulse" style={{width: '60%'}} />
                    </div>
                  </div>
                  <div className="text-center max-w-xs">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">AI正在创作中...</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {encouragingMessage}
                    </p>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">
                        ✨ 预计需要30-60秒，请耐心等待
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Default State - 确保始终显示 */
              <div className="relative" style={{ marginTop: '40px' }}>
                <img
                  src="/task-home-image-replace/@Chat.png"
                  alt="IP周边产品展示"
                  className="w-full h-auto rounded-2xl shadow-2xl"
                  onError={(e) => {
                    console.error('图片加载失败:', e);
                    // 如果主图片加载失败，显示备用内容
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                {/* 备用内容 */}
                <div className="hidden w-full h-[420px] bg-gradient-to-br from-cleanup-green/20 to-blue-50 rounded-2xl shadow-2xl flex flex-col items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 bg-cleanup-green/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Wand2 className="w-12 h-12 text-cleanup-green" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">AI IP形象生成</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      上传您的图片，AI将为您生成<br/>
                      专属的卡通IP形象和完整周边产品线
                    </p>
                    <div className="flex justify-center space-x-4 mt-6">
                      <div className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center">
                        📱
                      </div>
                      <div className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center">
                        🗝️
                      </div>
                      <div className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center">
                        🎪
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Product Icons - 确保在所有状态下都显示 */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-cleanup-green rounded-full flex items-center justify-center shadow-lg z-10">
              <span className="text-black font-bold text-xs">30+</span>
            </div>

            {/* 左下角 - 手机壳 */}
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg border-2 border-cleanup-green z-10 hover:scale-110 transition-transform">
              <span className="text-lg">📱</span>
            </div>

            {/* 左侧中间 - 钥匙扣 */}
            <div className="absolute top-1/2 -left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 z-10 hover:scale-110 transition-transform">
              <span className="text-sm">🗝️</span>
            </div>

            {/* 右下角 - T恤 */}
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg border border-gray-200 z-10 hover:scale-110 transition-transform">
              <span className="text-lg">👕</span>
            </div>

            {/* 右侧中间 - 马克杯 */}
            <div className="absolute top-1/2 -right-6 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg border border-gray-200 z-10 hover:scale-110 transition-transform">
              <span className="text-sm">☕</span>
            </div>

            {/* 上方中间 - 徽章 */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 z-10 hover:scale-110 transition-transform">
              <span className="text-sm">🏅</span>
            </div>

            {/* 下方中间 - 贴纸 */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 z-10 hover:scale-110 transition-transform">
              <span className="text-sm">🎨</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          console.log('登录成功，更新用户状态:', { userId: user.id, username: user.username });
          setCurrentUser(user);
          
          // 显示成功提示
          setError(null);
          
          // 延迟关闭Modal，让用户看到成功状态
          setTimeout(() => {
            setShowAuthModal(false);
            // 自动保存IP形象
            if (generatedResult) {
              console.log('开始自动保存IP形象...');
              saveIPAfterAuth(user);
            }
          }, 300);
        }}
      />

    </section>
  );
}
