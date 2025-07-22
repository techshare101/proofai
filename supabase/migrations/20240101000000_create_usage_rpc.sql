-- Create a function to safely increment usage
create or replace function increment_usage(
  user_id uuid,
  minutes_used int
) returns void language plpgsql as $$
begin
  -- Try to update existing record
  update user_plans
  set 
    whisper_minutes_used = user_plans.whisper_minutes_used + increment_usage.minutes_used,
    updated_at = now()
  where user_plans.user_id = increment_usage.user_id;
  
  -- If no rows were updated, create a new record
  if not found then
    insert into user_plans (
      user_id,
      plan,
      whisper_minutes_limit,
      whisper_minutes_used,
      billing_period_start,
      billing_period_end,
      status,
      created_at,
      updated_at
    ) values (
      user_id,
      'starter',
      0, -- Default to starter plan with 0 minutes
      minutes_used,
      date_trunc('month', now())::date,
      (date_trunc('month', now()) + interval '1 month - 1 day')::date,
      'active',
      now(),
      now()
    );
  end if;
end;
$$;
