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
      const url = report.pdf_url;
      console.log('📄 Extracting path from pdf_url:', url);
      
      // Skip blob URLs - these are temporary browser URLs that can't be used
      if (url.startsWith('blob:')) {
        console.error('❌ PDF URL is a blob URL (temporary) - cannot generate signed URL');
        return NextResponse.json({ 
          error: 'This report was created before storage was configured. Please re-record to fix.' 
        }, { status: 400 });
      }
      
      // Pattern 1: Public URL - extract path after bucket name (reports bucket)
      // https://xxx.supabase.co/storage/v1/object/public/reports/path/to/file.pdf
      const publicMatch = url.match(/\/object\/public\/reports\/(.+)$/);
      if (publicMatch) {
        pdfPath = publicMatch[1];
        console.log('📄 Matched public URL pattern, path:', pdfPath);
      }
      
      // Pattern 2: Signed URL - extract path after bucket name
      // https://xxx.supabase.co/storage/v1/object/sign/reports/path/to/file.pdf?token=...
      if (!pdfPath) {
        const signedMatch = url.match(/\/object\/sign\/reports\/(.+?)(\?|$)/);
        if (signedMatch) {
          pdfPath = signedMatch[1];
          console.log('📄 Matched signed URL pattern, path:', pdfPath);
        }
      }
      
      // Pattern 3: Direct path (already just the path, e.g., "filename.pdf")
      if (!pdfPath && !url.startsWith('http')) {
        pdfPath = url;
        console.log('📄 Using direct path:', pdfPath);
      }
      
      // Pattern 4: Any other Supabase storage URL format
      if (!pdfPath) {
        // Try to extract from any reports bucket reference
        const genericMatch = url.match(/reports\/(.+?)(\?|$)/);
        if (genericMatch) {
          pdfPath = genericMatch[1];
          console.log('📄 Matched generic pattern, path:', pdfPath);
        }
      }
      
      // Fix double 'reports/' prefix if present (legacy bug)
      if (pdfPath && pdfPath.startsWith('reports/')) {
        pdfPath = pdfPath.replace(/^reports\//, '');
        console.log('📄 Removed duplicate reports/ prefix, path:', pdfPath);
      }
    }

    if (!pdfPath) {
      console.error('❌ Could not extract PDF path from:', report.pdf_url);
      return NextResponse.json({ error: 'PDF not available' }, { status: 404 });
    }

    console.log('📄 Getting public URL for path:', pdfPath);

    // 5️⃣ Get public URL (reports bucket is public)
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(pdfPath);

    if (!urlData?.publicUrl) {
      console.error('❌ Failed to get public URL');
      return NextResponse.json(
        { error: 'Unable to generate report URL' },
        { status: 500 }
      );
    }

    console.log('✅ Redirecting to public PDF URL:', urlData.publicUrl);

    // 6️⃣ Redirect browser to PDF
    return NextResponse.redirect(urlData.publicUrl);
  } catch (error) {
    console.error('❌ Report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
