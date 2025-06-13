import { NextRequest, NextResponse } from 'next/server';
import { supabase, getGenerationTask, updateGenerationTask } from '@/lib/supabase';
import { 
  processImageGenerationTask, 
  process3DModelTask
} from '@/lib/ai-api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  
  try {
    // 获取任务信息
    const task = await getGenerationTask(taskId);
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    // 只允许重试失败的任务
    if (task.status !== 'failed') {
      return NextResponse.json({ 
        error: `任务状态为 ${task.status}，只能重试失败的任务` 
      }, { status: 400 });
    }

    console.log(`开始重试任务 ${taskId}，类型: ${task.task_type}`);

    // 重置任务状态
    await updateGenerationTask(taskId, {
      status: 'pending',
      error_message: '',
      result_image_url: '',
      result_data: {}
    });

    // 根据任务类型启动相应的处理函数
    if (task.task_type === '3d_model') {
      // 3D模型任务使用特殊的处理函数
      console.log(`启动3D模型任务重试: ${taskId}`);
      process3DModelTask(taskId);
    } else {
      // 图片生成任务（IP生成、多视图、周边商品）
      console.log(`启动图片生成任务重试: ${taskId}，类型: ${task.task_type}`);
      processImageGenerationTask(taskId);
    }

    return NextResponse.json({
      success: true,
      message: '任务重试已启动',
      taskId: taskId
    });

  } catch (error) {
    console.error(`重试任务 ${taskId} 失败:`, error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : '重试任务失败'
    }, { status: 500 });
  }
}