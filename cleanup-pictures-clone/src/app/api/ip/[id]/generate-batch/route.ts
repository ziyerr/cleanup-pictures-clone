import { NextResponse } from 'next/server';
import { generateAllMerchandise } from '../../../../../lib/ai-api';
import { createClient } from '@supabase/supabase-js';

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
    const authHeader = request.headers.get('authorization');

    if (!userId || !authHeader) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    // Create authenticated Supabase client using the user's session token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wrfvysakckcmvquvwuei.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZnZ5c2FrY2tjbXZxdXZ3dWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDEzMDEsImV4cCI6MjA2NDk3NzMwMX0.LgQHwS9rbcmTfL2SegtcDByDTxWqraKMcXRQBPMtYJw';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // 获取IP角色信息 - 使用认证的客户端
    const { data: character, error: fetchError } = await supabase
      .from('user_ip_characters')
      .select('*')
      .eq('id', characterId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !character) {
      return NextResponse.json({ error: 'IP角色不存在或无权访问' }, { status: 404 });
    }

    // 开始批量生成 - 传递认证的 Supabase 客户端
    const result = await generateAllMerchandise(
      characterId,
      character.main_image_url,
      character.name,
      character.description || '',
      userId,
      supabase // 传递认证的客户端
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