import { NextResponse } from "next/server";

// List of languages supported by the application
const supportedLangs = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ru', 'pt', 'it'];

// Check if detected language is supported
function handleAutoDetect(whisperResponse: any) {
  const lang = whisperResponse.language;
  if (lang && supportedLangs.includes(lang)) {
    return lang;
  } else {
    return 'unsupported';
  }
}

export async function POST(req: Request) {
  // Parse FormData instead of JSON
  const formData = await req.formData();
  const fileUrl = formData.get('fileUrl') as string;
  const language = formData.get('language') as string || "auto";

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 500 });

  try {
    // Step 1: Download file from Supabase signed URL
    console.log("📥 Downloading file from signed URL:", fileUrl?.substring(0, 50) + "...");
    
    if (!fileUrl) {
      console.error("Missing file URL in the request");
      return NextResponse.json({ error: "Missing file URL" }, { status: 400 });
    }
    
    // Download file from signed URL
    let fileRes;
    try {
      fileRes = await fetch(fileUrl);
      
      console.log(`📥 Download response status: ${fileRes.status} ${fileRes.statusText}`);
      
      if (!fileRes.ok) {
        console.error(`Failed to download audio: ${fileRes.status} ${fileRes.statusText}`);
        return NextResponse.json({ error: `Download failed: ${fileRes.statusText}` }, { status: 500 });
      }
      
      // Check Content-Type header
      const contentType = fileRes.headers.get('content-type');
      console.log(`📥 File content type: ${contentType}`);
    } catch (downloadError) {
      console.error("📥 Error during file download:", downloadError);
      return NextResponse.json({ error: `Download error: ${downloadError.message}` }, { status: 500 });
    }
    
    const blob = await fileRes.blob();
    const file = new File([blob], "recording.webm", { type: "video/webm" });
    console.log(`✅ File downloaded: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

    // Step 2: Prepare OpenAI request
    const form = new FormData();
    form.append("file", file);
    form.append("model", "whisper-1");
    form.append("response_format", "json");
    form.append("temperature", "0");
    
    // Only include language parameter if explicitly specified and not 'auto'
    // Omitting the language parameter allows Whisper to perform better auto-detection
    if (language && language !== "auto") {
      console.log(`🔤 Using specified language: ${language}`);
      form.append("language", language);
    } else {
      console.log("🔤 Language parameter omitted for better auto-detection");
    }

    // Step 3: Send to OpenAI
    console.log("🔄 Calling OpenAI Whisper API...");
    console.log("🔄 Request to OpenAI with file size:", file.size);
    
    // Call OpenAI API
    let openaiRes;
    try {
      openaiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      });
      
      console.log(`🔄 OpenAI response status: ${openaiRes.status} ${openaiRes.statusText}`);
    } catch (openaiError) {
      console.error("❌ Error calling OpenAI API:", openaiError);
      return NextResponse.json({ error: `OpenAI API error: ${openaiError.message}` }, { status: 500 });
    }

    const result = await openaiRes.json();
    if (!openaiRes.ok) {
      console.error("❌ OpenAI Whisper Error:", result);
      return NextResponse.json(result, { status: 500 });
    }

    console.log("✅ Transcription successful");
    
    // Check if detected language is supported
    const detectedLang = handleAutoDetect(result);
    console.log(`🌐 Detected language: ${result.language || 'unknown'}, Supported: ${detectedLang !== 'unsupported' ? 'Yes' : 'No'}`);
    
    // Get original/raw transcript from result
    const rawText = result.text || '';
    
    // Always ensure the raw transcript is available under multiple fields for compatibility
    // This ensures all languages work like Spanish - with proper raw transcript access
    const enhancedResult = {
      ...result,
      text: rawText,
      transcript: rawText, // Ensure transcript field always exists
      rawTranscript: rawText, // Add explicit rawTranscript field
      detected_language: result.language || detectedLang,
      language: result.language || detectedLang, // Add language field for consistency
      supported_language: detectedLang,
      is_translated: false, // Flag to indicate if this is a translated transcript
    };
    
    // Add detailed logging about transcript
    console.log(`🌐 Language details:`, {
      requestedLanguage: language || 'auto',
      detectedLanguage: enhancedResult.language || 'unknown',
      isSupported: detectedLang !== 'unsupported',
      transcriptLength: rawText.length,
    });
    
    console.log(`📝 Raw transcript available: ${enhancedResult.transcript ? 'Yes' : 'No'} (${enhancedResult.transcript?.length || 0} chars)`);
    if (enhancedResult.transcript?.length > 0) {
      console.log(`📝 Transcript preview: "${enhancedResult.transcript.substring(0, 50)}..."`);
    }
    
    return NextResponse.json(enhancedResult);
  } catch (err) {
    console.error("❌ API error:", err);
    // Include more detailed error information
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorName = err instanceof Error ? err.name : 'Unknown';
    const errorStack = err instanceof Error ? err.stack : 'No stack trace';
    
    console.error({
      name: errorName,
      message: errorMessage,
      stack: errorStack
    });
    
    return NextResponse.json({ 
      error: "Server error during transcription", 
      details: errorMessage,
      errorType: errorName
    }, { status: 500 });
  }
}
