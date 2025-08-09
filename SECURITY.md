# Security Configuration Guide

## Critical Security Fix Applied

**⚠️ IMPORTANT**: Hardcoded API keys and secrets have been removed from `vercel.json` for security compliance.

### What Was Fixed

The following sensitive credentials were previously exposed in plain text in `vercel.json`:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_OPENCAGE_API_KEY` 
- `SUPABASE_SERVICE_KEY`

These have been removed and must now be configured as environment variables.

## Required Environment Variables

### For Local Development
1. Copy `.env.example` to `.env.local`
2. Fill in all required values:

```bash
cp .env.example .env.local
```

### For Production Deployment (Vercel)

Configure these environment variables in your Vercel dashboard:

#### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key (keep secret!)

#### OpenAI Configuration
- `OPENAI_API_KEY` - Your OpenAI API key (keep secret!)

#### Geocoding API
- `NEXT_PUBLIC_OPENCAGE_API_KEY` - Your OpenCage API key

#### Stripe Configuration
- `STRIPE_SECRET_KEY` - Your Stripe secret key (keep secret!)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret (keep secret!)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- All Stripe price IDs for your subscription plans

#### Application Configuration
- `NEXT_PUBLIC_SITE_URL` - Your production site URL
- `NODE_ENV=production`

## Security Best Practices

### ✅ What's Secure
- Row Level Security (RLS) policies implemented in Supabase
- Proper authentication middleware
- Environment variables for sensitive data
- Error boundaries for graceful error handling
- TypeScript for type safety

### ⚠️ Important Notes
- Never commit `.env.local` or `.env` files to version control
- Service role keys should only be used server-side
- Regularly rotate API keys and secrets
- Monitor API usage for unusual activity

## Deployment Checklist

Before deploying to production:

1. ✅ Remove hardcoded secrets from `vercel.json` (COMPLETED)
2. ⏳ Clean up development artifacts (`.bak`, `.old` files)
3. ⏳ Standardize error handling and logging
4. ⏳ Address TODO and DEBUG comments
5. ⏳ Complete security audit documentation

## Emergency Response

If you suspect API keys have been compromised:

1. **Immediately rotate** all affected API keys
2. **Update environment variables** in all deployment environments
3. **Monitor logs** for suspicious activity
4. **Review access logs** in Supabase, OpenAI, and Stripe dashboards

## Contact

For security concerns, contact the development team immediately.
