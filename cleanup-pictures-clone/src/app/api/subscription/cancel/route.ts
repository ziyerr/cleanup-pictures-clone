import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { creemAPI } from '@/lib/creem-api';
import { 
  getUserSubscription, 
  updateUserSubscription 
} from '@/lib/supabase';

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

    // Get current subscription
    const subscription = await getUserSubscription(user.id);
    
    if (!subscription || !subscription.creem_subscription_id) {
      return NextResponse.json(
        { error: '未找到活跃订阅' },
        { status: 404 }
      );
    }

    // Cancel subscription in Creem
    try {
      await creemAPI.cancelSubscription(subscription.creem_subscription_id);
    } catch (error) {
      console.error('Creem取消订阅失败:', error);
      // Continue with local cancellation even if Creem fails
    }

    // Update local subscription status
    await updateUserSubscription(subscription.id, {
      status: 'cancelled'
    });

    console.log(`用户 ${user.id} 的订阅已取消`);

    return NextResponse.json({
      success: true,
      message: '订阅已成功取消'
    });

  } catch (error) {
    console.error('取消订阅失败:', error);
    
    return NextResponse.json(
      { 
        error: '取消订阅失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}