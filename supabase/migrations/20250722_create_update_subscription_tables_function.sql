-- Create a function to update both subscriptions and user_subscription_status tables atomically
CREATE OR REPLACE FUNCTION public.update_subscription_tables(
  subscription_data JSONB,
  status_data JSONB,
  user_id_param UUID
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update or insert into subscriptions table
  WITH sub_update AS (
    INSERT INTO public.subscriptions (
      user_id,
      stripe_subscription_id,
      stripe_customer_id,
      stripe_price_id,
      stripe_current_period_end,
      status,
      cancel_at_period_end,
      updated_at
    ) VALUES (
      (subscription_data->>'user_id')::UUID,
      subscription_data->>'stripe_subscription_id',
      subscription_data->>'stripe_customer_id',
      subscription_data->>'stripe_price_id',
      (subscription_data->>'stripe_current_period_end')::TIMESTAMPTZ,
      subscription_data->>'status',
      (subscription_data->>'cancel_at_period_end')::BOOLEAN,
      NOW()
    )
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      status = EXCLUDED.status,
      stripe_price_id = EXCLUDED.stripe_price_id,
      stripe_current_period_end = EXCLUDED.stripe_current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      updated_at = NOW()
    RETURNING *
  )
  -- Update or insert into user_subscription_status table
  INSERT INTO public.user_subscription_status (
    user_id,
    stripe_customer_id,
    current_plan,
    stripe_price_id,
    subscription_status_detail,
    stripe_current_period_end,
    cancel_at_period_end,
    subscription_updated_at
  ) VALUES (
    (status_data->>'user_id')::UUID,
    status_data->>'stripe_customer_id',
    'premium', -- Default plan
    status_data->>'stripe_price_id',
    status_data->>'subscription_status_detail',
    (status_data->>'stripe_current_period_end')::TIMESTAMPTZ,
    (status_data->>'cancel_at_period_end')::BOOLEAN,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_price_id = EXCLUDED.stripe_price_id,
    subscription_status_detail = EXCLUDED.subscription_status_detail,
    stripe_current_period_end = EXCLUDED.stripe_current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    subscription_updated_at = NOW()
  RETURNING *;
  
  -- Update the has_active_subscription flag based on the subscription status
  UPDATE public.user_subscription_status
  SET 
    has_active_subscription = (
      subscription_status_detail = 'active' 
      AND (cancel_at_period_end = false OR cancel_at_period_end IS NULL)
    ),
    subscription_status = CASE
      WHEN subscription_status_detail = 'active' AND cancel_at_period_end = true THEN 'canceling'
      ELSE subscription_status_detail
    END
  WHERE user_id = user_id_param;
  
  RETURN jsonb_build_object('success', true, 'message', 'Subscription tables updated successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'context', 'Error in update_subscription_tables function'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_subscription_tables(JSONB, JSONB, UUID) TO authenticated;
