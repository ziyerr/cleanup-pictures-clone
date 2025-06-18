import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const characterId = url.searchParams.get('characterId');
  
  if (!characterId) {
    return NextResponse.json({ error: 'characterId is required' }, { status: 400 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wrfvysakckcmvquvwuei.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZnZ5c2FrY2tjbXZxdXZ3dWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDEzMDEsImV4cCI6MjA2NDk3NzMwMX0.LgQHwS9rbcmTfL2SegtcDByDTxWqraKMcXRQBPMtYJw';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get character info
    const { data: character, error: charError } = await supabase
      .from('user_ip_characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (charError) {
      return NextResponse.json({ error: 'Character not found', details: charError }, { status: 404 });
    }

    // Get related tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('parent_character_id', characterId)
      .order('created_at', { ascending: false });

    if (tasksError) {
      return NextResponse.json({ error: 'Failed to fetch tasks', details: tasksError }, { status: 500 });
    }

    // Categorize tasks
    const tasksByType = {
      merchandise: tasks?.filter(t => t.task_type.startsWith('merchandise_')) || [],
      multiView: tasks?.filter(t => t.task_type.startsWith('multi_view_')) || [],
      model3D: tasks?.filter(t => t.task_type === '3d_model') || [],
      all: tasks || []
    };

    const taskStats = {
      total: tasksByType.all.length,
      completed: tasksByType.all.filter(t => t.status === 'completed').length,
      failed: tasksByType.all.filter(t => t.status === 'failed').length,
      processing: tasksByType.all.filter(t => t.status === 'processing').length,
      pending: tasksByType.all.filter(t => t.status === 'pending').length
    };

    return NextResponse.json({
      character: {
        id: character.id,
        name: character.name,
        merchandise_task_status: character.merchandise_task_status,
        merchandise_urls: character.merchandise_urls,
        merchandise_count: character.merchandise_urls ? Object.keys(character.merchandise_urls).length : 0
      },
      tasks: tasksByType,
      stats: taskStats,
      debug: {
        timestamp: new Date().toISOString(),
        shouldShowMerchandise: character.merchandise_urls && Object.keys(character.merchandise_urls).length > 0,
        merchandiseTaskComplete: character.merchandise_task_status === 'completed',
      }
    });

  } catch (error) {
    console.error('Debug tasks API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}