import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { initializeFreeUserQuota } from '@/lib/supabase';

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

    // Initialize free user quota
    await initializeFreeUserQuota(user.id);

    return NextResponse.json({
      success: true,
      message: '用户配额初始化完成'
    });

  } catch (error) {
    console.error('初始化用户配额失败:', error);
    
    return NextResponse.json(
      { 
        error: '初始化用户配额失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}