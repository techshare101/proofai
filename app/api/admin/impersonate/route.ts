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

    if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'support') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const targetUser = authUsers?.users.find((u: any) => u.email === email);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create impersonation session (30 min expiry)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('impersonation_sessions')
      .insert({
        admin_id: currentUser.id,
        user_id: targetUser.id,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating impersonation session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: currentUser.id,
        action: 'start_impersonation',
        target_user_id: targetUser.id,
        metadata: { session_id: session.id, expires_at: expiresAt },
      });

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      userId: targetUser.id,
      email: targetUser.email,
      expiresAt,
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: currentUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all active impersonation sessions for this admin
    await supabaseAdmin
      .from('impersonation_sessions')
      .delete()
      .eq('admin_id', currentUser.id);

    // Log admin action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: currentUser.id,
        action: 'end_impersonation',
        target_user_id: null,
        metadata: {},
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End impersonation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
