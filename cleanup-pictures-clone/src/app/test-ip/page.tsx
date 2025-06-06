"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import IPGenerationFlow from "@/components/IPGenerationFlow";

export default function TestIPPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleStartGeneration = () => {
    if (selectedImage && prompt.trim()) {
      setShowGenerator(true);
    } else {
      alert("请上传图片并输入提示词");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">IP形象生成测试</h1>
        
        {!showGenerator ? (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div>
              <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
                上传图片
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedImage && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="上传的图片"
                    className="w-full max-w-md mx-auto rounded-lg"
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                提示词描述
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请描述你想要的IP形象特点，例如：可爱的小猫咪，有着大眼睛和粉色的鼻子..."
              />
            </div>

            <Button
              onClick={handleStartGeneration}
              disabled={!selectedImage || !prompt.trim()}
              className="w-full"
            >
              开始生成IP形象
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">IP形象生成中...</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setShowGenerator(false);
                  setSelectedImage(null);
                  setPrompt("");
                }}
              >
                重新开始
              </Button>
            </div>
            
            <IPGenerationFlow
              image={selectedImage!}
              prompt={prompt}
            />
          </div>
        )}
      </div>
    </div>
  );
}