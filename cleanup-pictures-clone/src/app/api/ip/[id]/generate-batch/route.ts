import { NextResponse } from 'next/server';
import { generateAllMerchandise } from '../../../../../lib/ai-api';
import { supabase } from '../../../../../lib/supabase';

// Helper to get user ID from request
const getUserIdFromRequest = (request: Request): string | null => {
  const userId = request.headers.get('x-user-id');
  return userId;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: characterId } = await params;
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    // 获取IP角色信息
    const { data: character, error: fetchError } = await supabase
      .from('user_ip_characters')
      .select('*')
      .eq('id', characterId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !character) {
      return NextResponse.json({ error: 'IP角色不存在或无权访问' }, { status: 404 });
    }

    // 开始批量生成
    const result = await generateAllMerchandise(
      characterId,
      character.main_image_url,
      character.name,
      character.description || '',
      userId
    );

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      taskIds: result.taskIds,
      message: '批量生成任务已启动'
    });

  } catch (error) {
    console.error(`API /api/ip/${characterId}/generate-batch POST 错误:`, error);
    const errorMessage = error instanceof Error ? error.message : '批量生成启动失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}