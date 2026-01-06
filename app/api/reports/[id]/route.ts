/**
 * 🔒 SECURE REPORT ACCESS API
 * 
 * This route is the ONLY legal entry point to view reports.
 * 
 * Flow:
 * 1. Auth check
 * 2. Ownership check
 * 3. Generate fresh signed URL (60s)
 * 4. Redirect browser to PDF
 * 
 * Benefits:
 * - No expired URLs
 * - Proper auth enforcement
 * - Audit logging ready
 * - No client-side URL caching issues
 */
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 14+, params is a Promise
    const { id: reportId } = await params;
    
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
    }

    // Create Supabase client with cookie access
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {
              // Ignore - cookies can't be set in server components
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch {
              // Ignore - cookies can't be set in server components
            }
          },
        },
      }
    );

    // 1️⃣ Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      console.log('🔒 Report access denied: No authenticated user');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2️⃣ Fetch report metadata
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, user_id, pdf_url')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('❌ Report not found:', reportId);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // 3️⃣ Ownership check
    if (report.user_id !== user.id) {
      console.error('🔒 Report access denied: User does not own report', {
        userId: user.id,
        reportUserId: report.user_id,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4️⃣ Extract file path from pdf_url and generate fresh signed URL
    let pdfPath: string | null = null;
    
    if (report.pdf_url) {
      // Handle various URL formats to extract the path
      const url = report.pdf_url;
      
      // Pattern 1: Public URL - extract path after bucket name
      // https://xxx.supabase.co/storage/v1/object/public/proofai-pdfs/path/to/file.pdf
      const publicMatch = url.match(/\/object\/public\/proofai-pdfs\/(.+)$/);
      if (publicMatch) {
        pdfPath = publicMatch[1];
      }
      
      // Pattern 2: Signed URL - extract path after bucket name
      // https://xxx.supabase.co/storage/v1/object/sign/proofai-pdfs/path/to/file.pdf?token=...
      if (!pdfPath) {
        const signedMatch = url.match(/\/object\/sign\/proofai-pdfs\/(.+?)(\?|$)/);
        if (signedMatch) {
          pdfPath = signedMatch[1];
        }
      }
      
      // Pattern 3: Direct path (already just the path)
      if (!pdfPath && !url.startsWith('http')) {
        pdfPath = url;
      }
    }

    if (!pdfPath) {
      console.error('❌ Could not extract PDF path from:', report.pdf_url);
      return NextResponse.json({ error: 'PDF not available' }, { status: 404 });
    }

    console.log('📄 Generating signed URL for:', pdfPath);

    // 5️⃣ Generate fresh signed URL (60 seconds)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('proofai-pdfs')
      .createSignedUrl(pdfPath, 60);

    if (signedError || !signedData?.signedUrl) {
      console.error('❌ Failed to generate signed URL:', signedError);
      return NextResponse.json(
        { error: 'Unable to generate report URL' },
        { status: 500 }
      );
    }

    console.log('✅ Redirecting to signed PDF URL');

    // 6️⃣ Redirect browser to PDF
    return NextResponse.redirect(signedData.signedUrl);
  } catch (error) {
    console.error('❌ Report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
