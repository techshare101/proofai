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

    const { email, reason } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const targetUser = authUsers?.users.find((u: any) => u.email === email);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Grant court certification
    const { error: certError } = await supabaseAdmin
      .from('court_certifications')
      .insert({
        user_id: targetUser.id,
        granted_by: currentUser.id,
        reason: reason || null,
        valid: true,
      });

    if (certError) {
      console.error('Error granting certification:', certError);
      return NextResponse.json({ error: 'Failed to grant certification' }, { status: 500 });
    }

    // Update profile
    await supabaseAdmin
      .from('profiles')
      .update({ has_court_certification: true, court_certified_at: new Date().toISOString() })
      .eq('id', targetUser.id);

    // Log admin action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: currentUser.id,
        action: 'grant_court_certification',
        target_user_id: targetUser.id,
        metadata: { reason },
      });

    return NextResponse.json({ success: true, userId: targetUser.id });
  } catch (error) {
    console.error('Grant certification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
