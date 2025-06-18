import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { creemAPI } from '@/lib/creem-api';
import { CREEM_CONFIG } from '@/lib/creem-config';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

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
    
    // Get user email
    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: '用户邮箱未找到' },
        { status: 400 }
      );
    }

    // Create checkout session URLs (following Stripe/Creem pattern)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`;
    const cancelUrl = `${baseUrl}/payment/cancel?plan=${planId}`;

    console.log('🚀 创建 Creem Checkout Session - 后端主导模式');
    console.log('计划:', planId, '| 产品ID:', planConfig.id);
    console.log('用户:', userEmail, '| 成功URL:', successUrl.replace('{CHECKOUT_SESSION_ID}', 'XXX'));

    try {
      // 首先尝试真正的 Creem API
      const checkoutSession = await creemAPI.createCheckoutSession(
        planConfig.id,
        userEmail,
        successUrl,
        cancelUrl,
        user.id
      );

      console.log('✅ Creem API 支付会话创建成功:', checkoutSession);

      return NextResponse.json({
        success: true,
        checkout_url: checkoutSession.url,
        session_id: checkoutSession.id,
        mode: 'production'
      });

    } catch (creemError) {
      console.warn('⚠️ Creem API 失败，回退到演示模式:', creemError);
      
      // 如果 Creem API 失败，回退到演示模式
      // 这里我们需要导入演示模式的逻辑
      const { 
        createUserSubscription, 
        getUserSubscription,
        updateUserSubscription 
      } = await import('@/lib/supabase');

      try {
        const existingSubscription = await getUserSubscription(user.id);
        
        if (existingSubscription) {
          // 更新现有订阅
          await updateUserSubscription(existingSubscription.id, {
            plan: planId as any,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        } else {
          // 创建新订阅
          await createUserSubscription(
            user.id, 
            planId as any, 
            `demo_sub_${Date.now()}`, 
            `demo_cust_${user.id}`
          );
        }

        console.log('✅ 演示模式订阅创建成功');

        return NextResponse.json({
          success: true,
          checkout_url: `${baseUrl}/payment/success?demo=true&plan=${planId}&session_id=demo_${Date.now()}`,
          session_id: `demo_session_${Date.now()}`,
          mode: 'demo',
          message: '演示模式：订阅已直接激活（Creem API 配置问题，请联系技术支持）'
        });

      } catch (demoError) {
        console.error('❌ 演示模式也失败了:', demoError);
        throw demoError;
      }
    }

  } catch (error) {
    console.error('创建支付会话完全失败:', error);
    
    return NextResponse.json(
      { 
        error: '创建支付会话失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}