-- Add any missing columns to the user_subscription_status table
ALTER TABLE public.user_subscription_status 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS current_plan TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status_detail TEXT,
  ADD COLUMN IF NOT EXISTS stripe_current_period_end TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or replace function to update subscription status
CREATE OR REPLACE FUNCTION public.update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the timestamp
  NEW.subscription_updated_at = NOW();
  
  -- Update the subscription status based on the subscription status detail
  IF NEW.subscription_status_detail = 'active' AND NOT NEW.cancel_at_period_end THEN
    NEW.has_active_subscription = true;
    NEW.subscription_status = 'active';
  ELSIF NEW.subscription_status_detail = 'active' AND NEW.cancel_at_period_end THEN
    NEW.has_active_subscription = true;
    NEW.subscription_status = 'canceling';
  ELSE
    NEW.has_active_subscription = false;
    NEW.subscription_status = COALESCE(NEW.subscription_status_detail, 'inactive');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update subscription status when relevant columns change
DROP TRIGGER IF EXISTS update_subscription_status_trigger ON public.user_subscription_status;
CREATE TRIGGER update_subscription_status_trigger
BEFORE UPDATE OF subscription_status_detail, cancel_at_period_end ON public.user_subscription_status
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_status();

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.user_subscription_status TO authenticated;

-- Create a policy to allow users to view and update their own subscription status
CREATE POLICY "Users can view their own subscription status" 
ON public.user_subscription_status 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription status" 
ON public.user_subscription_status 
FOR UPDATE 
USING (auth.uid() = user_id);
