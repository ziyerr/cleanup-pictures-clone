'use client';

import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';

interface PlanLimits {
  ipCharacters?: string;
  merchandiseDaily?: string;
  merchandiseMonthly?: string;
  modelsDaily?: string;
  modelsMonthly?: string;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  currency?: string;
  highlight: boolean;
  features: string[];
  buttonText: string;
  buttonStyle: string;
  isTeam?: boolean;
  isEnterprise?: boolean;
  contactEmail?: string;
  limits?: PlanLimits;
}

export default function Pricing() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [userQuota, setUserQuota] = useState<any>(null);

  // 获取用户订阅信息
  useEffect(() => {
    if (currentUser) {
      fetchUserSubscription();
    }
  }, [currentUser]);

  const fetchUserSubscription = async (retryCount = 0) => {
    try {
      console.log(`获取订阅信息 (尝试 ${retryCount + 1})`);
      
      const response = await fetch('/api/subscription', {
        signal: AbortSignal.timeout(10000) // 10秒超时
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data.subscription);
        setUserQuota(data.quota);
      } else {
        console.warn('订阅信息API响应错误:', response.status);
      }
    } catch (error) {
      console.error('获取订阅信息失败:', error);
      
      // 网络错误重试
      if (error instanceof Error && error.message.includes('Failed to fetch') && retryCount < 3) {
        console.log(`订阅信息网络错误，${1000 * (retryCount + 1)}ms后重试...`);
        setTimeout(() => {
          fetchUserSubscription(retryCount + 1);
        }, 1000 * (retryCount + 1));
      }
    }
  };

  // 获取按钮文本和状态
  const getButtonInfo = (plan: Plan) => {
    if (!currentUser) {
      return { text: plan.buttonText, disabled: false, isCurrent: false };
    }

    const currentPlan = userSubscription?.plan || 'free';
    const isCurrent = currentPlan === plan.id;
    
    if (isCurrent) {
      return { 
        text: '当前计划', 
        disabled: true, 
        isCurrent: true 
      };
    }
    
    if (plan.id === 'free') {
      return { 
        text: currentPlan === 'free' ? '当前计划' : '降级到免费版', 
        disabled: currentPlan === 'free', 
        isCurrent: currentPlan === 'free' 
      };
    }
    
    return { 
      text: plan.buttonText, 
      disabled: false, 
      isCurrent: false 
    };
  };

  const handleSubscribe = async (planId: string) => {
    console.log('handleSubscribe called with planId:', planId);
    console.log('currentUser:', currentUser);
    
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    if (!currentUser.id) {
      alert('用户ID无效，请重新登录');
      return;
    }

    if (planId === 'free') {
      return; // Free plan doesn't need payment
    }

    setLoading(planId);

    try {
      // 使用智能端点：先尝试真正的 Creem API，失败则回退到演示模式
      const url = '/api/payments/create-checkout';
      console.log('Making request to:', url);
      console.log('Current location:', window.location.href);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
        credentials: 'include', // 确保包含 cookies
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Payment response:', data);
      
      if (data.success && data.checkout_url) {
        // 显示模式信息
        if (data.mode === 'demo') {
          console.log('🎭 演示模式激活:', data.message);
        } else if (data.mode === 'production') {
          console.log('🚀 生产模式 - 真正的 Creem 支付');
        }
        
        // Redirect to checkout or success page
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('创建支付会话失败:', error);
      alert('创建支付会话失败，请稍后重试');
    } finally {
      setLoading(null);
    }
  };

  const plans: Plan[] = [
    {
      id: 'free',
      name: '免费用户',
      price: '0',
      priceNote: '永久免费',
      highlight: false,
      features: [
        '最多生成 2 个IP形象',
        '每天生成 2 个周边图',
        '每天生成 1 个3D模型',
        '基础分辨率输出'
      ],
      buttonText: '免费开始',
      buttonStyle: 'outline',
      limits: {
        ipCharacters: '2个',
        merchandiseDaily: '2个/天',
        modelsMonthly: '1个/月'
      }
    },
    {
      id: 'personal',
      name: '个人IP用户',
      price: '5',
      priceNote: '每月',
      currency: '$',
      highlight: true,
      features: [
        '最多生成 10 个IP形象',
        '每月生成 100 个周边图',
        '每月生成 10 个3D模型',
        '高清分辨率输出',
        '优先处理队列'
      ],
      buttonText: '立即升级',
      buttonStyle: 'outline',
      limits: {
        ipCharacters: '10个',
        merchandiseMonthly: '100个/月',
        modelsMonthly: '10个/月'
      }
    },
    {
      id: 'team',
      name: '团队IP版',
      price: '20',
      priceNote: '每月',
      currency: '$',
      highlight: false,
      features: [
        '最多生成 100 个IP形象',
        '每月生成 1000 个周边图',
        '每月生成 50 个3D模型',
        '超高清分辨率输出',
        '团队协作功能'
      ],
      buttonText: '选择团队版',
      buttonStyle: 'outline',
      isTeam: true,
      limits: {
        ipCharacters: '100个',
        merchandiseMonthly: '1000个/月',
        modelsMonthly: '50个/月'
      }
    },
    {
      id: 'enterprise',
      name: 'API企业版',
      price: '',
      priceNote: '联系我们获取报价',
      highlight: false,
      features: [
        '无限IP形象生成',
        '无限周边图生成',
        '无限3D模型生成',
        'RESTful API接口',
        '专属技术支持'
      ],
      buttonText: '了解合作方案',
      buttonStyle: 'outline',
      isEnterprise: true,
      contactEmail: 'zhangjunfei@mahuakeji.com'
    }
  ];

  return (
    <section id="pricing" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-6">
          价格方案
        </h2>

        <p className="text-lg text-gray-600 text-center mb-8 max-w-2xl mx-auto">
          选择适合您的方案，开启IP创作之旅
        </p>

        {/* Current Usage Display */}
        {currentUser && userQuota && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-8 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              您的当前使用情况 ({userSubscription?.plan === 'free' ? '免费版' : userSubscription?.plan === 'personal' ? '个人版' : '团队版'})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {userQuota.ip_characters_used || 0}/{userQuota.ip_characters_limit || 2}
                </div>
                <div className="text-sm text-gray-600">IP 形象</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {userQuota.merchandise_daily_used || 0}/{userQuota.merchandise_daily_limit || 2}
                </div>
                <div className="text-sm text-gray-600">今日周边图</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {userQuota.models_monthly_used || 0}/{userQuota.models_monthly_limit || 1}
                </div>
                <div className="text-sm text-gray-600">本月 3D 模型</div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const buttonInfo = getButtonInfo(plan);
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border-2 transition-all h-[600px] flex flex-col ${
                  buttonInfo.isCurrent
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                    : plan.highlight
                    ? 'border-cleanup-green bg-cleanup-green/5 scale-105 shadow-lg'
                    : plan.isEnterprise
                    ? 'border-purple-200 bg-purple-50'
                    : plan.isTeam
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
              {/* Current Plan Badge */}
              {buttonInfo.isCurrent && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                    当前计划
                  </span>
                </div>
              )}
              
              {/* Popular Badge */}
              {plan.highlight && !buttonInfo.isCurrent && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-cleanup-green text-black px-4 py-2 rounded-full text-sm font-bold">
                    最受欢迎
                  </span>
                </div>
              )}

              {/* Plan Badge */}
              <div className="text-center mb-6">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    plan.highlight
                      ? 'bg-cleanup-green text-black'
                      : plan.isEnterprise
                      ? 'bg-purple-100 text-purple-700'
                      : plan.isTeam
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {plan.name}
                </span>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                {plan.price && (
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold">{plan.currency || '¥'}</span>
                    <span className="text-5xl lg:text-6xl font-bold">{plan.price}</span>
                  </div>
                )}
                {plan.priceNote && (
                  <p className="text-sm text-gray-600 mt-2">{plan.priceNote}</p>
                )}
                {!plan.price && plan.priceNote && (
                  <p className="text-lg font-medium text-gray-700">{plan.priceNote}</p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-4 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg
                      className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                        plan.highlight
                          ? 'text-cleanup-green'
                          : plan.isEnterprise
                          ? 'text-purple-500'
                          : plan.isTeam
                          ? 'text-blue-500'
                          : 'text-green-500'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Usage Limits */}
              {plan.limits && (
                <div className={`mb-4 p-3 rounded-lg border ${
                  plan.highlight
                    ? 'bg-cleanup-green/10 border-cleanup-green/20'
                    : plan.isEnterprise
                    ? 'bg-purple-50 border-purple-200'
                    : plan.isTeam
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className="text-xs font-semibold text-gray-800 mb-2">使用限制</h4>
                  <div className="space-y-1 text-xs">
                    {plan.limits?.ipCharacters && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">IP形象:</span>
                        <span className="font-medium">{plan.limits.ipCharacters}</span>
                      </div>
                    )}
                    {plan.limits?.merchandiseDaily && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">周边图:</span>
                        <span className="font-medium">{plan.limits.merchandiseDaily}</span>
                      </div>
                    )}
                    {plan.limits?.merchandiseMonthly && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">周边图:</span>
                        <span className="font-medium">{plan.limits.merchandiseMonthly}</span>
                      </div>
                    )}
                    {plan.limits?.modelsDaily && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">3D模型:</span>
                        <span className="font-medium">{plan.limits.modelsDaily}</span>
                      </div>
                    )}
                    {plan.limits?.modelsMonthly && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">3D模型:</span>
                        <span className="font-medium">{plan.limits.modelsMonthly}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Button */}
              {plan.buttonText && (
                <div className="text-center mt-auto">
                  {plan.isEnterprise ? (
                    <a
                      href={`mailto:${plan.contactEmail}?subject=企业合作方案咨询&body=您好，我想了解企业合作方案的详细信息和报价。请您联系我讨论合作可能性。`}
                      className={`inline-block w-full rounded-full py-3 px-6 font-medium transition-all text-center bg-purple-600 text-white hover:bg-purple-700 border-purple-600`}
                    >
                      了解合作方案
                    </a>
                  ) : (() => {
                    const buttonInfo = getButtonInfo(plan);
                    return (
                      <Button
                        variant={plan.buttonStyle as 'outline'}
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={loading === plan.id || buttonInfo.disabled}
                        className={`w-full rounded-full py-3 font-medium transition-all ${
                          buttonInfo.isCurrent
                            ? 'bg-green-600 text-white border-green-600 cursor-not-allowed'
                            : plan.highlight
                            ? 'bg-cleanup-green text-black hover:bg-cleanup-green/90 border-cleanup-green'
                            : plan.isTeam
                            ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'
                            : 'bg-black text-white hover:bg-gray-800 border-black'
                        }`}
                      >
                        {loading === plan.id ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            处理中...
                          </div>
                        ) : (
                          buttonInfo.text
                        )}
                      </Button>
                    );
                  })()}
                </div>
              )}
            </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold mb-4">会员权益说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-cleanup-green mb-1">💰 灵活计费</h4>
                <p>按月订阅，随时升级降级</p>
              </div>
              <div>
                <h4 className="font-semibold text-cleanup-green mb-1">🔧 API接入</h4>
                <p>企业版提供完整API接口</p>
              </div>
              <div>
                <h4 className="font-semibold text-cleanup-green mb-1">📞 客服支持</h4>
                <p>付费会员享受优先客服</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600">
              <p>
                <strong>企业版咨询:</strong>
                <a href="mailto:zhangjunfei@mahuakeji.com" className="text-cleanup-green hover:underline ml-1">
                  zhangjunfei@mahuakeji.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
