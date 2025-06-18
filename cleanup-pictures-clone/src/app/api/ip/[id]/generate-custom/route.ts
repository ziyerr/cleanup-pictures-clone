import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createGenerationTask } from '../../../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: characterId } = await params;
  try {
    const userId = request.headers.get('x-user-id');
    const authHeader = request.headers.get('authorization');
    
    if (!userId || !authHeader) {
      return NextResponse.json({ error: '用户未认证' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { name, description, referenceImageUrl } = body;

    if (!name || !description) {
      return NextResponse.json({ error: '请提供周边名称和描述' }, { status: 400 });
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

    // 生成批次ID
    const batchId = uuidv4();
    
    // 构建详细的提示词
    const detailedPrompt = `设计一个名为"${name}"的周边商品。${description}。设计要求：1. 以参考图片中的IP形象为主角；2. 保持IP形象的原有特色和色彩；3. 设计风格与描述保持一致；4. 适合实际生产制作；5. 背景和装饰元素与主题协调。原始角色描述：${character.description || character.name}`;

    // 创建自定义周边生成任务
    try {
      const task = await createGenerationTask(
        'merchandise_custom',
        detailedPrompt,
        referenceImageUrl || character.main_image_url,
        userId,
        batchId,
        characterId,
        supabase
      );
      
      console.log(`创建了自定义周边生成任务: ${task.id} - ${name}`);
      
      // 模拟任务处理（与选择性生成相同的逻辑）
      setTimeout(async () => {
        try {
          // 立即更新为处理中状态
          await supabase
            .from('generation_tasks')
            .update({
              status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', task.id);
            
          // 模拟处理时间（3-6秒）
          const processingTime = Math.random() * 3000 + 3000;
          
          setTimeout(async () => {
            // 模拟生成结果
            const mockResultUrl = `https://picsum.photos/400/400?random=${Date.now()}&sig=${task.id}`;
            
            const { error: updateError } = await supabase
              .from('generation_tasks')
              .update({
                status: 'completed',
                result_image_url: mockResultUrl,
                updated_at: new Date().toISOString()
              })
              .eq('id', task.id);

            if (updateError) {
              console.error(`更新任务 ${task.id} 完成状态失败:`, updateError);
              await supabase
                .from('generation_tasks')
                .update({
                  status: 'failed',
                  error_message: '模拟生成失败',
                  updated_at: new Date().toISOString()
                })
                .eq('id', task.id);
            } else {
              console.log(`✅ 自定义周边任务 ${task.id} (${name}) 模拟完成`);
              
              // 更新角色的周边商品URL
              try {
                const { data: currentCharacter, error: fetchCharError } = await supabase
                  .from('user_ip_characters')
                  .select('merchandise_urls')
                  .eq('id', characterId)
                  .single();

                if (!fetchCharError && currentCharacter) {
                  // 使用任务ID作为key，确保唯一性
                  const customKey = `custom_${task.id}`;
                  const existingUrls = currentCharacter?.merchandise_urls || {};
                  const newUrls = { ...existingUrls, [customKey]: mockResultUrl };

                  await supabase
                    .from('user_ip_characters')
                    .update({
                      merchandise_urls: newUrls,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', characterId);
                  
                  console.log(`✅ 已将自定义周边 ${name} 添加到角色周边商品列表`);
                }
              } catch (charUpdateError) {
                console.error('更新角色信息时出错:', charUpdateError);
              }
            }
          }, processingTime);
          
        } catch (error) {
          console.error(`任务 ${task.id} 处理失败:`, error);
        }
      }, 1000);

      return NextResponse.json({
        success: true,
        taskId: task.id,
        batchId,
        message: `成功创建自定义周边"${name}"的生成任务`
      });

    } catch (error) {
      console.error('创建自定义周边任务失败:', error);
      return NextResponse.json({ error: '创建生成任务失败' }, { status: 500 });
    }

  } catch (error) {
    console.error(`API /api/ip/${characterId}/generate-custom POST 错误:`, error);
    const errorMessage = error instanceof Error ? error.message : '自定义生成启动失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
