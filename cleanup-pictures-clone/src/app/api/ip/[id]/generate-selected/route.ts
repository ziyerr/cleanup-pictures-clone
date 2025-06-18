import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createGenerationTask } from '../../../../../lib/supabase';
import { processImageGenerationTask } from '../../../../../lib/ai-api';
import { v4 as uuidv4 } from 'uuid';

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

    // Get request body
    const body = await request.json();
    const { selectedItems } = body;

    if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return NextResponse.json({ error: '请选择要生成的商品类型' }, { status: 400 });
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

    // 生成批次ID
    const batchId = uuidv4();
    
    // 定义商品类型映射
    const merchandiseTypeMap: Record<string, { name: string; prompt: string }> = {
      'keychain': {
        name: '钥匙扣',
        prompt: `设计一个可爱的钥匙扣商品，以参考图片中的IP形象为主角。设计要求：1. IP形象占据钥匙扣的主要视觉区域；2. 保持IP形象的原有特色和色彩；3. 适合小尺寸制作的简洁设计；4. 背景简洁或透明；5. 商品设计适合批量生产。原始角色描述：${character.description || character.name}`
      },
      'fridge_magnet': {
        name: '冰箱贴',
        prompt: `设计一个精美的冰箱贴商品，以参考图片中的IP形象为主角。设计要求：1. IP形象清晰可见，比例协调；2. 保持原有的可爱风格和配色方案；3. 适合方形或圆形冰箱贴的布局；4. 背景色彩温暖，与IP形象互补；5. 设计适合家庭装饰使用。原始角色描述：${character.description || character.name}`
      },
      'handbag': {
        name: '手提袋',
        prompt: `设计一个时尚的手提袋印花图案，以参考图片中的IP形象为核心元素。设计要求：1. IP形象作为主要图案元素，居中或偏上位置；2. 保持角色的识别度和吸引力；3. 配色方案适合日常使用；4. 图案大小适中，不会过于突兀；5. 整体设计具有商业美感。原始角色描述：${character.description || character.name}`
      },
      'phone_case': {
        name: '手机壳',
        prompt: `设计一个个性化手机壳图案，以参考图片中的IP形象为设计重点。设计要求：1. IP形象适配手机壳的长方形比例；2. 保持角色的特色表情和姿态；3. 背景设计不干扰摄像头区域；4. 颜色搭配年轻化，适合手机配件；5. 图案布局考虑手机握持的舒适性。原始角色描述：${character.description || character.name}`
      }
    };

    // 创建选中的商品生成任务
    const taskIds: Record<string, string> = {};
    const createdTasks = [];

    for (const itemType of selectedItems) {
      const merchandiseInfo = merchandiseTypeMap[itemType];
      if (!merchandiseInfo) {
        console.warn(`未知的商品类型: ${itemType}`);
        continue;
      }

      try {
        const task = await createGenerationTask(
          `merchandise_${itemType}`,
          merchandiseInfo.prompt,
          character.main_image_url,
          userId,
          batchId,
          characterId,
          supabase // 传递认证的客户端
        );
        
        taskIds[itemType] = task.id;
        createdTasks.push(task);

        // 启动后台处理任务
        console.log(`创建了 ${merchandiseInfo.name} 生成任务: ${task.id}`);

        // 模拟任务处理（临时解决方案）
        // 在实际环境中，这里应该调用真正的AI生成服务
        setTimeout(async () => {
          try {
            // 模拟处理时间（2-5秒）
            const processingTime = Math.random() * 3000 + 2000;

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
                // 标记为失败
                await supabase
                  .from('generation_tasks')
                  .update({
                    status: 'failed',
                    error_message: '模拟生成失败',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', task.id);
              } else {
                console.log(`✅ 任务 ${task.id} (${merchandiseInfo.name}) 模拟完成`);

                // 更新角色的周边商品URL
                try {
                  // 获取当前的周边商品URLs
                  const { data: currentCharacter, error: fetchCharError } = await supabase
                    .from('user_ip_characters')
                    .select('merchandise_urls')
                    .eq('id', characterId)
                    .single();

                  if (fetchCharError) {
                    console.error('获取角色信息失败:', fetchCharError);
                    return;
                  }

                  // 更新周边商品URLs
                  const existingUrls = currentCharacter?.merchandise_urls || {};
                  const newUrls = { ...existingUrls, [itemType]: mockResultUrl };

                  const { error: updateCharError } = await supabase
                    .from('user_ip_characters')
                    .update({
                      merchandise_urls: newUrls,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', characterId);

                  if (updateCharError) {
                    console.error('更新角色周边商品URLs失败:', updateCharError);
                  } else {
                    console.log(`✅ 已将 ${merchandiseInfo.name} 添加到角色周边商品列表`);
                  }
                } catch (charUpdateError) {
                  console.error('更新角色信息时出错:', charUpdateError);
                }
              }
            }, processingTime);

            // 立即更新为处理中状态
            await supabase
              .from('generation_tasks')
              .update({
                status: 'processing',
                updated_at: new Date().toISOString()
              })
              .eq('id', task.id);

          } catch (error) {
            console.error(`任务 ${task.id} 处理失败:`, error);
          }
        }, 1000); // 1秒后开始处理
      } catch (error) {
        console.error(`创建 ${merchandiseInfo.name} 任务失败:`, error);
        // 继续处理其他任务，不因为单个任务失败而中断
      }
    }

    if (createdTasks.length === 0) {
      return NextResponse.json({ error: '没有成功创建任何生成任务' }, { status: 500 });
    }

    // 更新角色的商品任务状态为处理中
    await supabase
      .from('user_ip_characters')
      .update({ merchandise_task_status: 'processing' })
      .eq('id', characterId);

    // 检查是否所有任务都完成，如果是则更新角色状态
    setTimeout(async () => {
      try {
        // 获取这个批次的所有任务
        const { data: batchTasks, error: batchError } = await supabase
          .from('generation_tasks')
          .select('status')
          .eq('batch_id', batchId);

        if (batchError) {
          console.error('检查批次任务状态失败:', batchError);
          return;
        }

        // 检查是否所有任务都已完成
        const allCompleted = batchTasks?.every(task =>
          task.status === 'completed' || task.status === 'failed'
        );

        if (allCompleted) {
          // 更新角色状态为完成
          await supabase
            .from('user_ip_characters')
            .update({
              merchandise_task_status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', characterId);

          console.log(`✅ 角色 ${characterId} 的所有周边商品任务已完成`);
        }
      } catch (error) {
        console.error('检查任务完成状态时出错:', error);
      }
    }, Math.max(...selectedItems.map(() => Math.random() * 3000 + 2000)) + 2000); // 等待所有任务完成后再检查

    return NextResponse.json({
      success: true,
      batchId,
      taskIds,
      createdCount: createdTasks.length,
      message: `成功创建 ${createdTasks.length} 个商品生成任务`
    });

  } catch (error) {
    console.error(`API /api/ip/${characterId}/generate-selected POST 错误:`, error);
    const errorMessage = error instanceof Error ? error.message : '选择性生成启动失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
