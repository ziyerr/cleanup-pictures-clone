import { NextRequest, NextResponse } from 'next/server';
import { creemAPI } from '@/lib/creem-api';
import { CREEM_CONFIG } from '@/lib/creem-config';

// 临时测试端点，绕过认证
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId } = body;

    if (!planId || !['personal', 'team'].includes(planId)) {
      return NextResponse.json(
        { error: '无效的订阅计划' },
        { status: 400 }
      );
    }

    // Get plan configuration
    const planConfig = planId === 'personal' ? CREEM_CONFIG.PLANS.PERSONAL : CREEM_CONFIG.PLANS.TEAM;
    
    console.log('创建测试支付会话 for plan:', planConfig.name);

    // For testing purposes, let's first try a simple approach
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Method 1: Try to contact Creem API directly with correct format
    try {
      console.log('尝试方法1: 直接调用 Creem API');
      
      const creemResponse = await fetch(`${CREEM_CONFIG.BASE_URL}/v1/subscriptions`, {
        method: 'POST',
        headers: {
          'x-api-key': CREEM_CONFIG.API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: planConfig.id,
          customer_email: 'test@example.com',
          success_url: `${baseUrl}/payment/success`,
          cancel_url: `${baseUrl}/payment/cancel`,
        }),
      });

      console.log('Creem API 响应状态:', creemResponse.status);
      
      if (creemResponse.ok) {
        const data = await creemResponse.json();
        console.log('Creem API 成功响应:', data);
        
        return NextResponse.json({
          success: true,
          checkout_url: data.checkout_url || data.payment_url || `${baseUrl}/payment/success?test=true`,
          session_id: data.id || `test_session_${Date.now()}`
        });
      } else {
        const errorText = await creemResponse.text();
        console.log('Creem API 错误响应:', errorText);
      }
    } catch (apiError) {
      console.log('方法1失败:', apiError);
    }

    // Method 2: Mock success for testing UI flow
    console.log('使用方法2: 模拟成功支付用于测试');
    
    return NextResponse.json({
      success: true,
      checkout_url: `${baseUrl}/payment/success?test=true&plan=${planId}`,
      session_id: `test_session_${Date.now()}`,
      message: '这是测试模式，实际支付需要正确的 Creem API 配置'
    });

  } catch (error) {
    console.error('创建测试支付会话失败:', error);
    
    return NextResponse.json(
      { 
        error: '创建支付会话失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}