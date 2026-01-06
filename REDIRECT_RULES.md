# Redirect Rules — ProofAI

## 🚨 READ THIS FIRST

This document defines the **single source of truth** for all redirect behavior in the app.
Any deviation from these rules will cause routing bugs, auth loops, and legacy page resurrection.

---

## 🔒 CORE PRINCIPLE

```
If return_to param exists → go there
Else → /dashboard

NEVER redirect to /
```

---

## 📍 Landing Page (`/`)

**Role:** 100% static marketing page

### Absolute Rules
- ❌ No auth checks (`useAuth`, `useSession`, `getUser`)
- ❌ No plan checks (`useUserPlan`)
- ❌ No redirects (`router.push`, `router.replace`)
- ❌ No Supabase session logic
- ❌ No `useEffect` with auth dependencies

### Allowed
- ✅ Hero section
- ✅ Features section
- ✅ CTA buttons (`/login`, `/pricing`)
- ✅ Static content only

### Implementation
```tsx
// app/page.tsx
export const dynamic = 'force-static';
// NO useAuth, NO useRouter, NO useEffect
```

---

## 🔐 Login Page (`/login`)

**Role:** Single entry point for authentication

### Redirect Rule
```tsx
const returnTo = searchParams.get('return_to') || '/dashboard';
// After successful login:
window.location.href = returnTo;
```

### How to Link to Login
```tsx
// From protected page that needs auth:
<Link href="/login?return_to=/dashboard">Sign In</Link>

// From pricing page:
<Link href="/login?return_to=/checkout?plan=self_defender">Sign In</Link>
```

---

## 🔄 Auth Callback (`/auth/callback`)

**Role:** Handle OAuth redirects from Supabase/Google

### Redirect Rule
```tsx
const returnTo = searchParams.get('return_to') || '/dashboard';
// After successful auth:
return NextResponse.redirect(`${origin}${returnTo}`);
```

### Never
- ❌ Redirect to `/`
- ❌ Use plan logic
- ❌ Use legacy routes

---

## 🛡️ Middleware Protection

**Role:** Protect routes and redirect unauthenticated users

### Protected Routes
- `/dashboard`
- `/recorder`
- `/checkout`

### Behavior
```
User hits /dashboard without auth
→ Redirect to /login?return_to=/dashboard

User logs in
→ Redirect to /dashboard (from return_to param)
```

### Legacy Route Blocking
```
/record/pro → /dashboard
/record-old → /dashboard
/recorder-pro → /dashboard
/dashboard-old → /dashboard
```

---

## 💳 Stripe Success Page (`/checkout/success`)

**Role:** Show payment confirmation, then user clicks to dashboard

### Behavior
- Show "Thank You" message
- User clicks "Go to Dashboard" button
- NO auto-redirect
- NO redirect to `/`

---

## 🚫 FORBIDDEN PATTERNS

Delete any code that looks like this:

```tsx
// ❌ WRONG - Plan-based routing
if (plan === 'pro') router.push('/recorder-pro');

// ❌ WRONG - Redirect to /
router.push('/');
window.location.href = '/';

// ❌ WRONG - Legacy route defaults
const DEFAULT_REDIRECT = '/record';

// ❌ WRONG - Auth logic in landing page
if (session) router.push('/dashboard');

// ❌ WRONG - Hardcoded redirects
afterSignInUrl: '/record'
```

---

## ✅ CORRECT PATTERNS

```tsx
// ✅ CORRECT - Single source of truth
const returnTo = searchParams.get('return_to') || '/dashboard';

// ✅ CORRECT - Protected route redirect
url.searchParams.set('return_to', pathname);
return NextResponse.redirect(`${origin}/login?${url.searchParams}`);

// ✅ CORRECT - Post-login redirect
window.location.href = returnTo;

// ✅ CORRECT - Stripe success
success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
```

---

## 🧪 TEST FLOW

Run this test to verify routing is correct:

1. **Unauthenticated user hits `/dashboard`**
   - → Redirected to `/login?return_to=/dashboard`

2. **User logs in**
   - → Redirected to `/dashboard` (from return_to)

3. **User completes Stripe payment**
   - → Lands on `/checkout/success`
   - → Clicks "Go to Dashboard"
   - → Lands on `/dashboard`

4. **User visits `/` while logged in**
   - → Sees marketing page (no redirect)
   - → Can click "Dashboard" in nav to go to `/dashboard`

5. **User hits legacy route `/record/pro`**
   - → Redirected to `/dashboard`

---

## 📅 Last Updated

2026-01-05 — Locked redirect architecture after routing bugs
