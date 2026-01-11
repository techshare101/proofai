import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: currentUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, credits, expiresInDays, reason } = await request.json();

    if (!email || !credits) {
      return NextResponse.json({ error: 'Email and credits are required' }, { status: 400 });
    }

    // Find user by email
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const targetUser = authUsers?.users.find((u: any) => u.email === email);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate expiry
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Grant humanitarian credits
    const { error: creditsError } = await supabaseAdmin
      .from('humanitarian_credits')
      .insert({
        user_id: targetUser.id,
        granted_by: currentUser.id,
        credits: parseInt(credits),
        expires_at: expiresAt,
        reason: reason || null,
      });

    if (creditsError) {
      console.error('Error granting credits:', creditsError);
      return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 });
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: currentUser.id,
        action: 'grant_humanitarian_credits',
        target_user_id: targetUser.id,
        metadata: { credits, expiresInDays, reason },
      });

    return NextResponse.json({ success: true, userId: targetUser.id });
  } catch (error) {
    console.error('Grant credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
