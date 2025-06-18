import { NextRequest, NextResponse } from 'next/server';
import { creemAPI } from '@/lib/creem-api';
import { CREEM_CONFIG } from '@/lib/creem-config';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 测试完整支付流程 - 后端主导模式');

    const body = await request.json();
    const { planId = 'personal', email = 'test@example.com' } = body;

    // 获取计划配置
    const planConfig = planId === 'personal' ? CREEM_CONFIG.PLANS.PERSONAL : CREEM_CONFIG.PLANS.TEAM;
    
    // 构建回调 URLs (遵循 Stripe/Creem 模式)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`;
    const cancelUrl = `${baseUrl}/payment/cancel?plan=${planId}`;

    console.log('📋 支付流程参数:');
    console.log('- 计划:', planId);
    console.log('- 产品ID:', planConfig.id);
    console.log('- 客户邮箱:', email);
    console.log('- 成功URL模板:', successUrl);

    // 步骤1: 尝试创建 Checkout Session
    console.log('\n🔄 步骤1: 创建 Checkout Session');
    
    try {
      const checkoutSession = await creemAPI.createCheckoutSession(
        planConfig.id,
        email,
        successUrl,
        cancelUrl,
        'test_user_123'
      );

      console.log('✅ Checkout Session 创建成功!');
      console.log('- Session ID:', checkoutSession.id);
      console.log('- Checkout URL:', checkoutSession.url);

      return NextResponse.json({
        success: true,
        test_name: 'payment-flow-test',
        result: 'CHECKOUT_SESSION_CREATED',
        data: {
          session_id: checkoutSession.id,
          checkout_url: checkoutSession.url,
          plan: planId,
          product_id: planConfig.id,
          customer_email: email,
          mode: 'production'
        },
        next_steps: [
          '1. 用户将被重定向到 Checkout URL',
          '2. 用户在 Creem 页面完成支付',
          '3. Creem 将用户重定向回 success_url',
          '4. 后端接收 webhook 事件处理订阅'
        ]
      });

    } catch (creemError) {
      console.log('❌ Creem API 失败，测试演示模式回退');
      console.log('错误:', creemError instanceof Error ? creemError.message : creemError);

      // 步骤2: 测试演示模式回退
      console.log('\n🎭 步骤2: 演示模式回退测试');
      
      const demoSessionId = `demo_session_${Date.now()}`;
      const demoCheckoutUrl = `${baseUrl}/payment/success?demo=true&plan=${planId}&session_id=${demoSessionId}`;

      return NextResponse.json({
        success: true,
        test_name: 'payment-flow-test',
        result: 'DEMO_MODE_FALLBACK',
        data: {
          session_id: demoSessionId,
          checkout_url: demoCheckoutUrl,
          plan: planId,
          product_id: planConfig.id,
          customer_email: email,
          mode: 'demo'
        },
        creem_error: creemError instanceof Error ? creemError.message : String(creemError),
        next_steps: [
          '1. 用户将被重定向到成功页面 (演示模式)',
          '2. 订阅直接在数据库中创建',
          '3. 无需真实支付处理',
          '4. 建议: 联系 Creem 支持解决 API 问题'
        ],
        recommendations: [
          '🔧 验证 Creem Dashboard 中的测试模式是否启用',
          '📋 确认产品ID在 Creem 账户中存在',
          '🔑 验证 API 密钥权限',
          '📞 联系 Creem 支持获取正确的端点文档'
        ]
      });
    }

  } catch (error) {
    console.error('💥 支付流程测试完全失败:', error);
    
    return NextResponse.json(
      { 
        success: false,
        test_name: 'payment-flow-test',
        result: 'COMPLETE_FAILURE',
        error: error instanceof Error ? error.message : '未知错误',
        troubleshooting: [
          '1. 检查 Creem API 配置',
          '2. 验证网络连接',
          '3. 查看服务器日志获取详细错误',
          '4. 确认环境变量设置正确'
        ]
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '支付流程测试端点',
    usage: 'POST /api/test/payment-flow',
    example_body: {
      planId: 'personal',  // 'personal' 或 'team'
      email: 'test@example.com'
    },
    description: '测试完整的 Creem 支付流程，包括 Checkout Session 创建和回退机制'
  });
}