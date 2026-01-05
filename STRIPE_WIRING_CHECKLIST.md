# Stripe Wiring Checklist for Windsurf

> **Context:** ProofAI has a dev billing bypass in place. All plan logic flows through `getUserPlan()`. Stripe should be wired as a **data source**, not as inline logic.

---

## 🎯 Goal

Wire Stripe subscriptions so that `user_subscription_status` table is updated on subscription events. The app already reads from this table via `getUserPlan()`.

---

## 📋 Pre-Wired Components (DO NOT MODIFY)

| Component | Location | Purpose |
|-----------|----------|---------|
| `getUserPlan()` | `app/lib/plans/getUserPlan.ts` | Single source of truth for plan resolution |
| `useUserPlan()` | `app/hooks/useUserPlan.ts` | React hook for client components |
| `useRecordingLimit()` | `app/hooks/useRecordingLimit.ts` | Recording count enforcement |
| `checkRecordingLimit()` | `app/lib/plans/checkRecordingLimit.ts` | Server-side limit check |
| `user_subscription_status` | Supabase table | Stripe subscription state storage |

---

## 🔧 Environment Variables (Already Set)

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
NEXT_PUBLIC_STRIPE_PRICE_COMMUNITY=price_1RmlotGfFlbiKHjXP7lEltCR
NEXT_PUBLIC_STRIPE_PRICE_SELF_DEFENDER=price_1Rmlq8GfFlbiKHjXx8PGJ7w7
NEXT_PUBLIC_STRIPE_PRICE_MISSION_PARTNER=price_1RmlqcGfFlbiKHjXz88vHlP7
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS=price_1RmlrGGfFlbiKHjXUQ1MDzS3
NEXT_PUBLIC_STRIPE_PRICE_COURT_CERTIFICATION=price_1RmlrtGfFlbiKHjXbWp9dJYY
```

---

## ✅ Tasks

### 1. Create Stripe Checkout Session API

**File:** `app/api/stripe/checkout/route.ts`

```typescript
// Accept: priceId, userId
// Create Stripe checkout session
// Include metadata: { userId, planType }
// Return: sessionUrl
```

**Plan → Price ID Mapping:**
| Plan | Price ID Env Var |
|------|------------------|
| community | `NEXT_PUBLIC_STRIPE_PRICE_COMMUNITY` |
| self_defender | `NEXT_PUBLIC_STRIPE_PRICE_SELF_DEFENDER` |
| mission_partner | `NEXT_PUBLIC_STRIPE_PRICE_MISSION_PARTNER` |
| emergency_pack | One-time payment (use `mode: 'payment'`) |

---

### 2. Create Stripe Webhook Handler

**File:** `app/api/stripe/webhook/route.ts`

**Events to handle:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update `user_subscription_status` |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Set `has_active_subscription = false` |
| `invoice.payment_succeeded` | Update `current_period_end` |
| `invoice.payment_failed` | Set `subscription_status = 'past_due'` |

**Update `user_subscription_status` table:**

```sql
-- On successful subscription
UPDATE user_subscription_status SET
  has_active_subscription = true,
  subscription_status = 'active',
  current_plan = 'self_defender', -- from metadata
  stripe_customer_id = 'cus_xxx',
  stripe_price_id = 'price_xxx',
  stripe_current_period_end = '2026-02-04T00:00:00Z',
  subscription_updated_at = now()
WHERE user_id = 'uuid';
```

---

### 3. Map Stripe Plan Names

In webhook, map `price_id` → `current_plan`:

```typescript
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_COMMUNITY!]: 'community',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_SELF_DEFENDER!]: 'self_defender',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_MISSION_PARTNER!]: 'mission_partner',
  // Emergency pack is one-time, handle separately
};
```

---

### 4. Wire Pricing Page Buttons

**File:** `app/components/Pricing.tsx`

Each tier button should:
1. Check if user is logged in
2. Call `/api/stripe/checkout` with the appropriate `priceId`
3. Redirect to Stripe Checkout

```typescript
const handleSubscribe = async (priceId: string) => {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId }),
  });
  const { url } = await res.json();
  window.location.href = url;
};
```

---

### 5. Create Success/Cancel Pages

**Files:**
- `app/checkout/success/page.tsx` — Show success message, redirect to dashboard
- `app/checkout/cancel/page.tsx` — Show cancel message, link back to pricing

---

### 6. Customer Portal (Optional)

**File:** `app/api/stripe/portal/route.ts`

Allow users to manage their subscription:
```typescript
const session = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
});
```

---

## 🚫 DO NOT

- ❌ Add dev conditionals or bypasses — `getUserPlan()` handles this
- ❌ Check Stripe directly in UI components — use `useUserPlan()` hook
- ❌ Modify plan limits — they're defined in `getUserPlan.ts`
- ❌ Touch the recorder or dashboard gating logic

---

## ✅ Verification

After wiring, test:

1. **Checkout flow:** Pricing → Stripe → Success page
2. **Webhook:** Subscription creates/updates `user_subscription_status`
3. **Plan resolution:** `getUserPlan()` returns correct plan after subscription
4. **UI update:** Dashboard shows correct plan badge
5. **Limits enforced:** Recording limits match plan

---

## 🔄 Production Deployment

When ready for production:

1. Remove `NEXT_PUBLIC_ENABLE_DEV_BYPASS=true` from production env
2. Use live Stripe keys (`sk_live_...`, `pk_live_...`)
3. Update webhook endpoint in Stripe Dashboard
4. Test with real payment

---

## 📞 Questions?

The plan resolution logic is in:
- `app/lib/plans/getUserPlan.ts` — Main resolver
- `app/lib/plans/checkRecordingLimit.ts` — Recording count logic

All UI reads from these. Stripe just needs to update `user_subscription_status`.
