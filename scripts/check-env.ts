console.log('🔍 Environment Check:');

const envVars = {
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  'NEXT_PUBLIC_OPENAI_API_KEY': process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY': process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
};

for (const [key, value] of Object.entries(envVars)) {
  console.log(`${key}:`, value ? `✅ Set (${value.substring(0, 4)}...)` : '❌ Missing');
}
