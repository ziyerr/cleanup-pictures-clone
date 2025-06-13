import { NextResponse } from 'next/server';
import { updateUserIPCharacterName } from '../../../../lib/supabase';
import { getGenerationTask } from '../../../../lib/supabase';

// Helper to get user ID from request (replace with your actual auth logic)
const getUserIdFromRequest = (request: Request): string | null => {
  // In a real app, this would come from a verified JWT token or session.
  // For demo purposes, we'll pass it in the body or headers.
  // This is NOT secure for production.
  const userId = request.headers.get('x-user-id');
  return userId;
};


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ipId } = await params;
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
    }

    const updatedCharacter = await updateUserIPCharacterName(ipId, name.trim(), userId);

    return NextResponse.json(updatedCharacter);

  } catch (error) {
    console.error(`API /api/ip/${ipId} PATCH 错误:`, error);
    const errorMessage = error instanceof Error ? error.message : '更新失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 