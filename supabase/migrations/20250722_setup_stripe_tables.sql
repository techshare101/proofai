-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  has_active_subscription BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT UNIQUE,
  subscription_id TEXT,
  subscription_status TEXT,
  current_plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_current_period_end TIMESTAMPTZ,
  status TEXT NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Create webhook_events table for tracking Stripe webhook events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user into the profiles table
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run the handle_new_user function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at columns
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to handle subscription changes
CREATE OR REPLACE FUNCTION public.handle_subscription_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's subscription status in the profiles table
  IF NEW.status = 'active' OR NEW.status = 'trialing' THEN
    UPDATE public.profiles
    SET 
      has_active_subscription = TRUE,
      subscription_id = NEW.stripe_subscription_id,
      subscription_status = NEW.status,
      current_plan = (
        SELECT name 
        FROM public.plans 
        WHERE stripe_price_id = NEW.stripe_price_id 
        LIMIT 1
      )
    WHERE id = NEW.user_id;
  ELSE
    UPDATE public.profiles
    SET 
      has_active_subscription = FALSE,
      subscription_status = NEW.status
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run when a subscription is updated
CREATE TRIGGER on_subscription_updated
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_subscription_updated();

-- Create a function to get the user's subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'has_active_subscription', COALESCE(p.has_active_subscription, FALSE),
    'subscription_status', p.subscription_status,
    'current_plan', p.current_plan,
    'subscription', (
      SELECT jsonb_build_object(
        'id', s.id,
        'stripe_subscription_id', s.stripe_subscription_id,
        'stripe_price_id', s.stripe_price_id,
        'status', s.status,
        'cancel_at_period_end', s.cancel_at_period_end,
        'current_period_end', s.stripe_current_period_end
      )
      FROM public.subscriptions s
      WHERE s.user_id = user_id_param
      ORDER BY created_at DESC
      LIMIT 1
    )
  ) INTO result
  FROM public.profiles p
  WHERE p.id = user_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
