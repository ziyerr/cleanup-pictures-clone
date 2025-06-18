import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAllMerchandise } from '../../../../../lib/ai-api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ipId } = await params;
  const userId = request.headers.get('x-user-id');
  const authHeader = request.headers.get('authorization');

  if (!userId || !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    // 1. Fetch the IP character data with proper authentication
    const { data: ipCharacter, error: fetchError } = await supabase
      .from('user_ip_characters')
      .select('*')
      .eq('id', ipId)
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