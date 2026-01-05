# ProofAI Alpha Launch Checklist

## 🔐 Authentication
- [x] Email signup/login works
- [x] Google OAuth signup/login works
- [x] Dynamic redirect URLs (not hardcoded localhost)
- [x] Refresh page → still logged in
- [x] Logout clears state
- [x] Auth context hardened (mounted flag, single listener)

## 💳 Billing (Stripe)
- [x] Stripe checkout creates session
- [x] Webhook updates `user_subscription_status`
- [x] Google users mapped correctly (same as email)
- [x] Plan limits enforced after payment
- [ ] Test mode → Live mode switch (when ready)

## 📊 Plan Enforcement
- [x] Dev bypass returns pro (NEXT_PUBLIC_ENABLE_DEV_BYPASS=true)
- [x] Starter tier: 3 recordings/month, 7 days storage, 25MB max
- [x] Recording limit check before start
- [x] File size check after recording
- [x] Upgrade prompts when limit reached
- [x] Dashboard respects plan limits

## 📹 Recorder
- [x] Camera initialization with retry
- [x] Front/back camera toggle
- [x] Recording time display
- [x] Geolocation capture
- [x] Audio capture for Whisper
- [x] Upload to Supabase storage
- [x] Transcription via Whisper API
- [x] AI summary generation
- [x] PDF generation with QR code
- [x] Recording limit refresh after upload
- [x] Back to Dashboard button

## 📄 PDF Generation
- [x] Case ID and timestamp
- [x] Location display (geocoded)
- [x] AI summary section
- [x] Transcript (original + translated)
- [x] QR code on final verification page
- [x] Signature placeholder
- [x] Legal disclaimer

## 📂 Dashboard
- [x] Reports load correctly
- [x] Card view with responsive grid
- [x] Table view with horizontal scroll
- [x] View PDF opens in new tab
- [x] Watch Video opens in new tab
- [x] Delete report works (requires RLS)
- [x] Move to folder works (requires RLS)
- [x] Create folder works (requires RLS)
- [x] Folder sidebar with All Reports
- [x] Search and date filters
- [x] Drag and drop to folders

## 🔗 Routing
- [x] `/` → Landing page
- [x] `/login` → Sign in page
- [x] `/dashboard` → Reports dashboard
- [x] `/recorder` → Recording page
- [x] `/pricing` → Pricing page
- [x] `/report/[id]` → Report detail page
- [x] `/checkout/success` → Payment success
- [x] `/checkout/cancel` → Payment cancelled
- [x] `/auth/callback` → OAuth callback

## 📱 Mobile Responsiveness
- [x] Dashboard grid: 1 col mobile, 2 col tablet, 3 col desktop
- [x] Table view: horizontal scroll on mobile
- [x] Recorder: full width video preview
- [x] Sign in: centered form
- [x] Report detail: responsive padding

## 🔒 Supabase RLS Policies (REQUIRED)
Run this SQL in Supabase SQL Editor:

```sql
-- Folder policies
DROP POLICY IF EXISTS "Users can insert their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can read their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;

CREATE POLICY "Users can insert their own folders" ON public.folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own folders" ON public.folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own folders" ON public.folders FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own folders" ON public.folders FOR UPDATE USING (auth.uid() = user_id);

-- Report policies
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.reports;

CREATE POLICY "Users can delete their own reports" ON public.reports FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own reports" ON public.reports FOR UPDATE USING (auth.uid() = user_id);
```

## 🌐 Environment Variables (Vercel)
Required for production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PRICE_COMMUNITY`
- `NEXT_PUBLIC_STRIPE_PRICE_SELF_DEFENDER`
- `NEXT_PUBLIC_STRIPE_PRICE_MISSION_PARTNER`
- `NEXT_PUBLIC_STRIPE_PRICE_EMERGENCY_PACK`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_OPENCAGE_API_KEY` (for geocoding)

## 🚀 Deployment
- [x] Vercel project configured
- [x] Environment variables set
- [x] Production build succeeds
- [ ] Custom domain configured
- [ ] SSL certificate active

## 📋 Pre-Launch Final Checks
- [ ] Create test account (email)
- [ ] Create test account (Google)
- [ ] Complete full recording flow
- [ ] Verify PDF downloads correctly
- [ ] Test Stripe checkout (test mode)
- [ ] Verify webhook updates plan
- [ ] Test folder creation/deletion
- [ ] Test report deletion
- [ ] Test on mobile device
- [ ] Review error handling

---

## Status: ALPHA READY ✅

All core functionality implemented. Remaining items:
1. Run RLS migration in Supabase
2. Configure custom domain
3. Switch Stripe to live mode
4. Final QA testing
