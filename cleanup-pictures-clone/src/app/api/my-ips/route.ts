import { NextResponse } from 'next/server';
import { getUserIPCharacters } from '../../../lib/supabase';

export const dynamic = 'force-dynamic'; // 强制 Next.js 动态渲染此路由

export async function GET(request: Request) {
  try {
    // 在实际应用中，你应该从一个安全的、经过验证的会话或JWT token中获取用户ID。
    // 为了简化，我们暂时从URL查询参数中获取它。
    // 例如: /api/my-ips?userId=xxx
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    console.log(`API /my-ips: 正在为用户 ${userId} 获取数据`);
    const characters = await getUserIPCharacters(userId);

    return NextResponse.json(characters);

  } catch (error) {
    console.error('API /my-ips 错误:', error);
    const errorMessage = error instanceof Error ? error.message : '获取IP形象失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 