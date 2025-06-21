import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  processImageGenerationTask,
  process3DModelTask
} from '@/lib/ai-api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  console.log(`🔄 收到任务重试请求: ${taskId}`);

  try {
    const userId = request.headers.get('x-user-id');
    const authHeader = request.headers.get('authorization');

    console.log(`👤 用户认证检查:`, {
      hasUserId: !!userId,
      hasAuthHeader: !!authHeader,
      userId: userId?.substring(0, 8) + '...'
    });

    if (!userId || !authHeader) {
      console.error('❌ 用户未认证');
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

    // 获取任务信息并验证权限
    console.log(`📋 查询任务信息: ${taskId}`);
    const { data: task, error: fetchError } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error(`❌ 查询任务失败:`, fetchError);
      return NextResponse.json({ 
        error: `查询任务失败: ${fetchError.message}` 
      }, { status: 500 });
    }

    if (!task) {
      console.error(`❌ 任务不存在: ${taskId}`);
      return NextResponse.json({ error: '任务不存在或无权访问' }, { status: 404 });
    }

    console.log(`📋 任务信息:`, {
      id: taskId,
      type: task.task_type,
      status: task.status,
      hasPrompt: !!task.prompt,
      hasOriginalImage: !!task.original_image_url,
      errorMessage: task.error_message
    });

    // 只允许重试失败的任务
    if (task.status !== 'failed') {
      console.error(`❌ 任务状态不支持重试: ${task.status}`);
      return NextResponse.json({ 
        error: `任务状态为 ${task.status}，只能重试失败的任务` 
      }, { status: 400 });
    }

    // 验证任务是否有必要的数据
    if (!task.prompt) {
      console.error(`❌ 任务缺少提示词: ${taskId}`);
      return NextResponse.json({ 
        error: '任务数据不完整：缺少提示词' 
      }, { status: 400 });
    }

    console.log(`🚀 开始重试任务 ${taskId}，类型: ${task.task_type}`);

    // 重置任务状态
    console.log(`📝 重置任务状态: ${taskId}`);
    const { error: updateError } = await supabase
      .from('generation_tasks')
      .update({
        status: 'pending',
        error_message: null,
        result_image_url: null,
        result_data: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (updateError) {
      console.error(`❌ 重置任务状态失败:`, updateError);
      return NextResponse.json({
        error: `重置任务状态失败: ${updateError.message}`
      }, { status: 500 });
    }

    console.log(`✅ 任务状态已重置为 pending: ${taskId}`);

    // 根据任务类型启动相应的处理函数
    if (task.task_type === '3d_model') {
      // 3D模型任务使用特殊的处理函数
      console.log(`🎯 启动3D模型任务重试: ${taskId}`);
      process3DModelTask(taskId);
    } else {
      // 图片生成任务（IP生成、多视图、周边商品）
      console.log(`🎨 启动图片生成任务重试: ${taskId}，类型: ${task.task_type}`);
      processImageGenerationTask(taskId);
    }

    console.log(`✅ 任务重试已启动: ${taskId}`);

    return NextResponse.json({
      success: true,
      message: '任务重试已启动',
      taskId: taskId,
      taskType: task.task_type
    });

  } catch (error) {
    console.error(`❌ 重试任务 ${taskId} 异常:`, error);
    
    // 提供更详细的错误信息
    let errorMessage = '重试任务失败';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      error: errorMessage,
      taskId: taskId
    }, { status: 500 });
  }
}