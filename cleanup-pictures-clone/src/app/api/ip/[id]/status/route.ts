import { NextResponse } from 'next/server';
import { getIPCharacterWithStatus } from '../../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ipId } = await params;

  if (!ipId) {
    return NextResponse.json({ error: 'IP ID is required' }, { status: 400 });
  }

  try {
    const characterWithStatus = await getIPCharacterWithStatus(ipId);

    if (!characterWithStatus) {
      return NextResponse.json({ error: 'IP character not found' }, { status: 404 });
    }

    return NextResponse.json(characterWithStatus);
  } catch (error) {
    console.error(`Error fetching IP character status for ${ipId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch IP character status', details: errorMessage }, { status: 500 });
  }
} 