import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CREEM_CONFIG } from '@/lib/creem-config';
import { 
  createUserSubscription, 
  getUserSubscription,
  updateUserSubscription 
} from '@/lib/supabase';

// 演示模式支付端点，模拟完整的支付流程
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
    
    console.log('演示模式：创建订阅 for user:', user.id, 'plan:', planConfig.name);

    // 在演示模式中，直接创建/更新用户订阅
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

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      // 模拟 Creem 重定向，但直接跳转到成功页面
      return NextResponse.json({
        success: true,
        checkout_url: `${baseUrl}/payment/success?demo=true&plan=${planId}&session_id=demo_${Date.now()}`,
        session_id: `demo_session_${Date.now()}`,
        message: '演示模式：订阅已直接激活'
      });

    } catch (dbError) {
      console.error('数据库操作失败:', dbError);
      return NextResponse.json(
        { error: '订阅创建失败', details: dbError instanceof Error ? dbError.message : '数据库错误' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('演示支付流程失败:', error);
    
    return NextResponse.json(
      { 
        error: '创建订阅失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}