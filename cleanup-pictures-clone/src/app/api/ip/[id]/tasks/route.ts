import { NextResponse } from 'next/server';
import { getCharacterTasks } from '../../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: characterId } = await params;
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    const tasks = await getCharacterTasks(characterId);
    
    // 验证任务属于当前用户
    const userTasks = tasks.filter(task => task.user_id === userId);

    return NextResponse.json({
      success: true,
      characterId,
      tasks: userTasks,
      summary: {
        total: userTasks.length,
        pending: userTasks.filter(t => t.status === 'pending').length,
        processing: userTasks.filter(t => t.status === 'processing').length,
        completed: userTasks.filter(t => t.status === 'completed').length,
        failed: userTasks.filter(t => t.status === 'failed').length
      }
    });

  } catch (error) {
    console.error(`API /api/ip/${(await params).id}/tasks GET 错误:`, error);
    const errorMessage = error instanceof Error ? error.message : '获取角色任务失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}