-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create a policy to allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create a function to check if a user has an active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.subscriptions s
    WHERE s.user_id = user_id 
    AND s.status IN ('active', 'trialing')
    AND (s.ends_at IS NULL OR s.ends_at > NOW())
  );
$$;

-- Create a view for the user's subscription status
CREATE OR REPLACE VIEW public.user_subscription_status AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.has_active_subscription,
  s.id as subscription_id,
  s.status as subscription_status,
  s.stripe_price_id,
  s.stripe_current_period_end,
  s.cancel_at_period_end
FROM 
  public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id
WHERE 
  auth.uid() = p.id
ORDER BY 
  s.created_at DESC
LIMIT 1;

-- Create or replace the user_subscription_status view
CREATE OR REPLACE VIEW public.user_subscription_status AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.has_active_subscription,
  p.subscription_status,
  p.subscription_id,
  p.stripe_customer_id,
  p.current_plan,
  s.stripe_price_id,
  s.status as subscription_status_detail,
  s.stripe_current_period_end,
  s.cancel_at_period_end,
  s.created_at as subscription_created_at,
  s.updated_at as subscription_updated_at
FROM 
  public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id
WHERE 
  auth.uid() = p.id
ORDER BY 
  s.created_at DESC
LIMIT 1;

-- Create a policy to allow users to view their own subscription status
CREATE OR REPLACE POLICY "Users can view their own subscription status" 
ON public.user_subscription_status 
FOR SELECT 
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON public.user_subscription_status TO authenticated;
