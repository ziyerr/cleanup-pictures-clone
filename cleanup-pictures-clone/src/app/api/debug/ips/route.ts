import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { testAPIConnectivity } from '../../../../lib/ai-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 获取所有IP形象数据用于调试
    const { data: characters, error } = await supabase
      .from('user_ip_characters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`获取IP形象失败: ${error.message}`);
    }

    // 获取所有用户数据
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (usersError) {
      throw new Error(`获取用户失败: ${usersError.message}`);
    }

    // Test API connectivity
    const apiTest = await testAPIConnectivity();

    return NextResponse.json({
      success: true,
      debug: {
        characters: characters || [],
        users: users || [],
        charactersCount: characters?.length || 0,
        usersCount: users?.length || 0,
        apiConnectivity: apiTest
      }
    });

  } catch (error) {
    console.error('Debug API错误:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '调试API失败',
      success: false 
    }, { status: 500 });
  }
}