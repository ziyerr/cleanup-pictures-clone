import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import { generateAllMerchandise } from '../../../../../lib/ai-api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ipId } = await params;
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch the IP character data
    const { data: ipCharacter, error: fetchError } = await supabase
      .from('user_ip_characters')
      .select('*')
      .eq('id', ipId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !ipCharacter) {
      return NextResponse.json({ error: 'IP Character not found' }, { status: 404 });
    }

    // 2. Update main character status to 'processing' for immediate UI feedback
    await supabase
      .from('user_ip_characters')
      .update({ merchandise_task_status: 'processing' })
      .eq('id', ipId);

    // 3. Fire and forget the main orchestration task.
    (async () => {
      try {
        await generateAllMerchandise(
            ipCharacter.id,
            ipCharacter.main_image_url,
            ipCharacter.name,
            ipCharacter.description || '',
            ipCharacter.user_id
        );
        // Individual task statuses are managed within ai-api.ts.
        // The main character status should be updated to 'completed' 
        // by a polling mechanism on the frontend that checks the batch status.
      } catch (e) {
        console.error('Background generation orchestration failed:', e);
        // If the orchestration setup fails, mark the main task as failed.
        await supabase
            .from('user_ip_characters')
            .update({ merchandise_task_status: 'failed' })
            .eq('id', ipId);
      }
    })();

    return NextResponse.json({ message: 'Batch generation task started successfully.' }, { status: 202 });

  } catch (error) {
    console.error('Failed to start batch generation task:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to start batch generation task', details: errorMessage }, { status: 500 });
  }
} 