import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('数据库预热: 开始连接测试');
    const startTime = Date.now();
    
    // 执行一个简单的查询来预热数据库连接
    const { data, error } = await supabase
      .from('user_ip_characters')
      .select('count')
      .limit(1);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error('数据库预热失败:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        duration
      }, { status: 500 });
    }
    
    console.log(`数据库预热成功，耗时: ${duration}ms`);
    return NextResponse.json({
      success: true,
      message: '数据库连接已预热',
      duration
    });
    
  } catch (error) {
    console.error('数据库预热异常:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '预热失败',
      duration: 0
    }, { status: 500 });
  }
}