import { NextResponse } from 'next/server';
import { getBatchTasks } from '../../../../lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  try {
    
    // 获取用户ID进行权限验证（可选）
    const userId = request.headers.get('x-user-id');
    
    const tasks = await getBatchTasks(batchId);
    
    // 如果提供了用户ID，验证任务属于该用户
    if (userId) {
      const userTasks = tasks.filter(task => task.user_id === userId);
      if (userTasks.length !== tasks.length) {
        return NextResponse.json({ error: '无权访问此批次任务' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      batchId,
      tasks,
      summary: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        processing: tasks.filter(t => t.status === 'processing').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length
      }
    });

  } catch (error) {
    console.error(`API /api/batch/${batchId} GET 错误:`, error);
    const errorMessage = error instanceof Error ? error.message : '获取批次任务状态失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}