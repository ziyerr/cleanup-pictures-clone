import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  getUserSubscription, 
  getUserQuota 
} from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ 
      cookies: () => cookieStore 
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // Get user subscription and quota
    const [subscription, quota] = await Promise.all([
      getUserSubscription(user.id),
      getUserQuota(user.id)
    ]);

    return NextResponse.json({
      success: true,
      subscription: subscription || {
        plan: 'free',
        status: 'active'
      },
      quota: quota || {
        ip_characters_used: 0,
        ip_characters_limit: 2,
        merchandise_daily_used: 0,
        merchandise_daily_limit: 2,
        merchandise_monthly_used: 0,
        merchandise_monthly_limit: 2,
        models_monthly_used: 0,
        models_monthly_limit: 1
      }
    });

  } catch (error) {
    console.error('获取订阅信息失败:', error);
    
    return NextResponse.json(
      { 
        error: '获取订阅信息失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}