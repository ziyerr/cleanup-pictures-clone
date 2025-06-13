"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import AuthModal from "./AuthModal";
import { 
  generateIPCharacterWithTask, 
  pollTaskCompletion, 
  generateMultiViews, 
  generateMerchandise,
  generate3DModel,
  type AIGenerationRequest 
} from "../lib/ai-api";
import { saveUserIPCharacter, type AuthUser } from "../lib/supabase";

interface IPGenerationFlowProps {
  image: File | string;
  prompt: string;
}

export default function IPGenerationFlow({ image, prompt }: IPGenerationFlowProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingMerchandiseGeneration, setPendingMerchandiseGeneration] = useState(false);
  const [generationState, setGenerationState] = useState<{
    status: 'idle' | 'generating' | 'completed' | 'failed';
    taskId?: string;
    imageUrl?: string;
    error?: string;
    progress: string;
  }>({
    status: 'idle',
    progress: '准备开始...'
  });

  const [merchandiseState, setMerchandiseState] = useState<{
    status: 'idle' | 'generating' | 'completed' | 'failed';
    taskIds?: Record<string, string>;
    results?: Record<string, string>;
    leftViewTaskId?: string;
    backViewTaskId?: string;
    leftViewUrl?: string;
    backViewUrl?: string;
    model3DTaskId?: string;
    model3DUrl?: string;
  }>({
    status: 'idle'
  });

  // Execute merchandise generation process
  const executeMerchandiseGeneration = useCallback(async (user: AuthUser) => {
    if (!generationState.imageUrl) {
      alert('请先生成IP形象');
      return;
    }

    try {
      // Save IP character to user's collection
      await saveUserIPCharacter(user.id, `IP形象_${Date.now()}`, generationState.imageUrl);

      setMerchandiseState({
        status: 'generating'
      });

      // Generate multi-views
      const multiViewResult = await generateMultiViews(generationState.imageUrl, prompt, user.id);
      
      // Generate merchandise
      const merchandiseResult = await generateMerchandise(generationState.imageUrl, prompt, user.id);

      setMerchandiseState(prev => ({
        ...prev,
        leftViewTaskId: multiViewResult.leftViewTaskId,
        backViewTaskId: multiViewResult.backViewTaskId,
        taskIds: merchandiseResult.taskIds
      }));

      // Poll for multi-view completion
      const [leftViewStatus, backViewStatus] = await Promise.all([
        pollTaskCompletion(multiViewResult.leftViewTaskId),
        pollTaskCompletion(multiViewResult.backViewTaskId)
      ]);

      setMerchandiseState(prev => ({
        ...prev,
        leftViewUrl: leftViewStatus.task?.result_image_url,
        backViewUrl: backViewStatus.task?.result_image_url
      }));

      // Generate 3D model if we have multi-views
      let model3DTaskId: string | undefined;
      if (leftViewStatus.task?.result_image_url && backViewStatus.task?.result_image_url) {
        model3DTaskId = await generate3DModel(
          generationState.imageUrl,
          leftViewStatus.task.result_image_url,
          backViewStatus.task.result_image_url,
          prompt,
          user.id
        );
        
        setMerchandiseState(prev => ({
          ...prev,
          model3DTaskId
        }));
      }

      // Poll for merchandise completion
      const merchandiseResults: Record<string, string> = {};
      for (const [type, taskId] of Object.entries(merchandiseResult.taskIds)) {
        const status = await pollTaskCompletion(taskId);
        if (status.task?.result_image_url) {
          merchandiseResults[type] = status.task.result_image_url;
        }
      }

      // Poll for 3D model completion if task was created
      let model3DUrl: string | undefined;
      if (model3DTaskId) {
        const model3DStatus = await pollTaskCompletion(model3DTaskId);
        if (model3DStatus.task?.result_data?.model_url) {
          model3DUrl = model3DStatus.task.result_data.model_url as string;
        }
      }

      setMerchandiseState(prev => ({
        ...prev,
        status: 'completed',
        results: merchandiseResults,
        model3DUrl
      }));

    } catch (error) {
      setMerchandiseState({
        status: 'failed'
      });
      alert(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [generationState.imageUrl, prompt]);

  // Effect to handle pending merchandise generation after login
  useEffect(() => {
    if (currentUser && pendingMerchandiseGeneration) {
      setPendingMerchandiseGeneration(false);
      executeMerchandiseGeneration(currentUser);
    }
  }, [currentUser, pendingMerchandiseGeneration, executeMerchandiseGeneration]);

  // Start IP character generation
  const handleGenerateIP = async () => {
    setGenerationState({
      status: 'generating',
      progress: '创建生成任务...'
    });

    try {
      const request: AIGenerationRequest = {
        image,
        prompt,
        userId: currentUser?.id
      };

      const response = await generateIPCharacterWithTask(request);

      if (!response.success || !response.taskId) {
        throw new Error(response.error || '任务创建失败');
      }

      setGenerationState(prev => ({
        ...prev,
        taskId: response.taskId,
        progress: '正在生成IP形象，请稍候...'
      }));

      // Start polling for completion
      const result = await pollTaskCompletion(response.taskId);

      if (result.success && result.task?.status === 'completed') {
        setGenerationState({
          status: 'completed',
          taskId: response.taskId,
          imageUrl: result.task.result_image_url,
          progress: 'IP形象生成完成！'
        });
      } else {
        throw new Error(result.task?.error_message || result.error || '生成失败');
      }
    } catch (error) {
      setGenerationState({
        status: 'failed',
        error: error instanceof Error ? error.message : '未知错误',
        progress: '生成失败'
      });
    }
  };

  // Save IP character and start merchandise generation
  const handleSaveAndGenerateMerchandise = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      setPendingMerchandiseGeneration(true);
      return;
    }

    await executeMerchandiseGeneration(currentUser);
  };

  return (
    <div className="space-y-6">
      {/* IP Generation Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">IP形象生成</h3>
        
        <div className="space-y-4">
          <Button
            onClick={handleGenerateIP}
            disabled={generationState.status === 'generating'}
            className="w-full"
          >
            {generationState.status === 'generating' ? '生成中...' : '生成IP形象'}
          </Button>

          {generationState.status !== 'idle' && (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">{generationState.progress}</p>
              {generationState.status === 'generating' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {generationState.imageUrl && (
            <div className="space-y-4">
              <img 
                src={generationState.imageUrl} 
                alt="生成的IP形象" 
                className="w-full max-w-md mx-auto rounded-lg"
              />
              
              <Button
                onClick={handleSaveAndGenerateMerchandise}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                保存IP形象并立即生成周边
              </Button>
            </div>
          )}

          {generationState.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {generationState.error}
            </div>
          )}
        </div>
      </div>

      {/* Merchandise Generation Section */}
      {merchandiseState.status !== 'idle' && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">周边商品生成</h3>
          
          {merchandiseState.status === 'generating' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">正在生成多视图和周边商品...</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">左视图</p>
                  {merchandiseState.leftViewUrl ? (
                    <img src={merchandiseState.leftViewUrl} alt="左视图" className="w-full rounded mt-2" />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 rounded mt-2 animate-pulse"></div>
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">后视图</p>
                  {merchandiseState.backViewUrl ? (
                    <img src={merchandiseState.backViewUrl} alt="后视图" className="w-full rounded mt-2" />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 rounded mt-2 animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {merchandiseState.status === 'completed' && merchandiseState.results && (
            <div className="space-y-6">
              <p className="text-green-600 font-medium">周边商品生成完成！</p>
              
              {/* 3D Model Section */}
              {merchandiseState.model3DUrl && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-md font-semibold mb-2">3D模型</h4>
                  <div className="bg-white p-4 rounded">
                    <p className="text-sm text-gray-600 mb-2">3D模型已生成完成</p>
                    <a 
                      href={merchandiseState.model3DUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      查看/下载3D模型
                    </a>
                  </div>
                </div>
              )}
              
              {/* Merchandise Grid */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(merchandiseState.results).map(([type, url]) => (
                  <div key={type} className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-2">
                      {type === 'keychain' && '钥匙扣'}
                      {type === 'fridge_magnet' && '冰箱贴'}
                      {type === 'handbag' && '手提袋'}
                      {type === 'phone_case' && '手机壳'}
                    </p>
                    <img src={url} alt={type} className="w-full rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingMerchandiseGeneration(false);
        }}
        onSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
          // The useEffect will automatically trigger merchandise generation
        }}
      />
    </div>
  );
}