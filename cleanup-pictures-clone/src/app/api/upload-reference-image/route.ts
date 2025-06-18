import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: '没有找到图片文件' }, { status: 400 });
    }

    // 验证文件类型
    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: '文件必须是图片格式' }, { status: 400 });
    }

    // 验证文件大小 (5MB)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '图片文件不能超过5MB' }, { status: 400 });
    }

    // 创建 Supabase 客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wrfvysakckcmvquvwuei.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZnZ5c2FrY2tjbXZxdXZ3dWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDEzMDEsImV4cCI6MjA2NDk3NzMwMX0.LgQHwS9rbcmTfL2SegtcDByDTxWqraKMcXRQBPMtYJw';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 生成唯一文件名
    const timestamp = Date.now();
    const fileExtension = image.name.split('.').pop() || 'jpg';
    const fileName = `reference_${timestamp}.${fileExtension}`;

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('reference-images')
      .upload(fileName, image, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('上传到 Supabase Storage 失败:', error);
      return NextResponse.json({ error: '图片上传失败' }, { status: 500 });
    }

    // 获取公共 URL
    const { data: { publicUrl } } = supabase.storage
      .from('reference-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error('上传参考图片失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
