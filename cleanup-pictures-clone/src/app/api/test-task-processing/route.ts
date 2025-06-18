import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
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

    // 获取用户的第一个待处理任务
    const { data: tasks, error: fetchError } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .limit(1);

    if (fetchError) {
      throw new Error(`获取任务失败: ${fetchError.message}`);
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ 
        message: '没有找到待处理的任务',
        tasks: []
      });
    }

    const task = tasks[0];
    console.log('找到待处理任务:', task.id, task.task_type);

    // 尝试更新任务状态为处理中
    const { data: updatedTask, error: updateError } = await supabase
      .from('generation_tasks')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`更新任务状态失败: ${updateError.message}`);
    }

    console.log('任务状态已更新为处理中:', updatedTask.id);

    // 模拟处理过程（3秒后标记为完成）
    setTimeout(async () => {
      try {
        const { error: completeError } = await supabase
          .from('generation_tasks')
          .update({
            status: 'completed',
            result_image_url: 'https://example.com/test-result.png',
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);

        if (completeError) {
          console.error('标记任务完成失败:', completeError);
        } else {
          console.log('任务已标记为完成:', task.id);
        }
      } catch (error) {
        console.error('异步完成任务失败:', error);
      }
    }, 3000);

    return NextResponse.json({
      success: true,
      message: '任务处理已启动',
      task: updatedTask,
      note: '任务将在3秒后标记为完成（测试模式）'
    });

  } catch (error) {
    console.error('测试任务处理失败:', error);
    const errorMessage = error instanceof Error ? error.message : '测试失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
