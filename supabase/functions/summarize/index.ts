import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📝 Received request:', req.method)
    const { prompt } = await req.json()
    console.log('🎯 Prompt received:', prompt)
    
    const apiKey = Deno.env.get("GEMINI_API_KEY")
    if (!apiKey) {
      console.error('❌ Missing API key')
      throw new Error('Missing API key')
    }

    console.log('🔄 Calling Gemini API...')
    const systemPrompt = `You are a legal analysis AI. Analyze the given event and provide a clear summary of what happened. Do not try to format as JSON, just provide a clear narrative summary.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [
            { text: systemPrompt },
            { text: prompt }
          ] 
        }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          stopSequences: []
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini API error:', response.status, errorText)
      return new Response(JSON.stringify({ error: errorText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    console.log('✅ Summary generated successfully')
    
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API')
    }

    const summaryText = data.candidates[0].content.parts[0].text.trim()
    console.log('Summary text:', summaryText)

    const summaryData = {
      summary: summaryText,
      context: {
        location: null,  // Will be filled by frontend geolocation
        time: new Date().toLocaleString()
      },
      reportRelevance: {
        legal: true,
        hr: true,
        safety: true,
        explanation: summaryText.includes('slip') || summaryText.includes('fall') ? 
          'Workplace safety incident involving potential slip and fall. Requires immediate documentation and risk assessment.' :
          'Workplace incident requiring documentation and follow-up'
      }
    }
    
    console.log('Returning summary data:', summaryData)

    return new Response(JSON.stringify(summaryData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('❌ Function error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
