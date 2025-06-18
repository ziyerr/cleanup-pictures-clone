'use client';

import React, { useState } from 'react';
import { X, ShoppingBag, Smartphone, Key, Magnet, Package, CheckCircle } from 'lucide-react';

interface MerchandiseItem {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  estimatedTime: string;
}

interface MerchandiseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  characterImageUrl: string;
  onStartGeneration: (selectedItems: string[]) => void;
}

const MERCHANDISE_ITEMS: MerchandiseItem[] = [
  {
    id: 'keychain',
    type: 'keychain',
    name: '钥匙扣',
    description: '可爱的IP形象钥匙扣，适合日常携带',
    icon: <Key className="w-6 h-6" />,
    estimatedTime: '2-3分钟'
  },
  {
    id: 'fridge_magnet',
    type: 'fridge_magnet', 
    name: '冰箱贴',
    description: '精美的冰箱贴设计，装饰家居空间',
    icon: <Magnet className="w-6 h-6" />,
    estimatedTime: '2-3分钟'
  },
  {
    id: 'handbag',
    type: 'handbag',
    name: '手提袋',
    description: '时尚的手提袋印花设计，实用美观',
    icon: <ShoppingBag className="w-6 h-6" />,
    estimatedTime: '3-4分钟'
  },
  {
    id: 'phone_case',
    type: 'phone_case',
    name: '手机壳',
    description: '个性化手机壳图案，保护手机更有型',
    icon: <Smartphone className="w-6 h-6" />,
    estimatedTime: '2-3分钟'
  }
];

export default function MerchandiseSelectionModal({
  isOpen,
  onClose,
  characterId,
  characterName,
  characterImageUrl,
  onStartGeneration
}: MerchandiseSelectionModalProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === MERCHANDISE_ITEMS.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(MERCHANDISE_ITEMS.map(item => item.id));
    }
  };

  const handleStartGeneration = async () => {
    if (selectedItems.length === 0) return;
    
    setIsGenerating(true);
    try {
      await onStartGeneration(selectedItems);
      onClose();
    } catch (error) {
      console.error('启动生成失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">选择要生成的周边商品</h2>
              <p className="text-gray-600 mt-1">为"{characterName}"选择您想要生成的周边产品</p>
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
        <div className="p-6">
          {/* Character Preview */}
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold mb-3">IP形象预览</h3>
            <img
              src={characterImageUrl}
              alt={characterName}
              className="w-24 h-24 mx-auto rounded-lg object-cover border-2 border-gray-200"
            />
            <p className="text-sm text-gray-600 mt-2">{characterName}</p>
          </div>

          {/* Selection Controls */}
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              已选择 {selectedItems.length} / {MERCHANDISE_ITEMS.length} 个商品
            </div>
            <button
              onClick={handleSelectAll}
              className="text-sm text-cleanup-green hover:text-green-600 font-medium"
            >
              {selectedItems.length === MERCHANDISE_ITEMS.length ? '取消全选' : '全选'}
            </button>
          </div>

          {/* Merchandise Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {MERCHANDISE_ITEMS.map((item) => {
              const isSelected = selectedItems.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemToggle(item.id)}
                  className={`
                    relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'border-cleanup-green bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-cleanup-green" />
                    </div>
                  )}

                  {/* Item Content */}
                  <div className="flex items-start space-x-3">
                    <div className={`
                      p-2 rounded-lg 
                      ${isSelected ? 'bg-cleanup-green text-white' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="text-xs text-gray-500">
                        预计生成时间: {item.estimatedTime}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              取消
            </button>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                {selectedItems.length > 0 && `将生成 ${selectedItems.length} 个商品`}
              </div>
              <button
                onClick={handleStartGeneration}
                disabled={selectedItems.length === 0 || isGenerating}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-colors
                  ${selectedItems.length === 0 || isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-cleanup-green text-black hover:bg-green-400'
                  }
                `}
              >
                {isGenerating ? '启动中...' : '开始生成'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
