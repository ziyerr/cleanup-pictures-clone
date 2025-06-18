import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const authHeader = request.headers.get('authorization');

    if (!userId || !authHeader) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    // Create authenticated Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wrfvysakckcmvquvwuei.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZnZ5c2FrY2tjbXZxdXZ3dWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDEzMDEsImV4cCI6MjA2NDk3NzMwMX0.LgQHwS9rbcmTfL2SegtcDByDTxWqraKMcXRQBPMtYJw';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // 获取用户的所有任务，包括关联的角色信息
    const { data: tasks, error } = await supabase
      .from('generation_tasks')
      .select(`
        *,
        user_ip_characters (
          name,
          main_image_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100); // 限制返回最近100个任务

    if (error) {
      throw new Error(`获取任务列表失败: ${error.message}`);
    }

    // 处理数据格式
    const processedTasks = tasks.map(task => ({
      ...task,
      character_name: task.user_ip_characters?.name,
      character_image: task.user_ip_characters?.main_image_url
    }));

    return NextResponse.json({
      success: true,
      tasks: processedTasks,
      summary: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        processing: tasks.filter(t => t.status === 'processing').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length
      }
    });

  } catch (error) {
    console.error('API /api/tasks GET 错误:', error);
    const errorMessage = error instanceof Error ? error.message : '获取任务列表失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}