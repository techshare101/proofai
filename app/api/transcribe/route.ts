import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

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

  if (!apiKey) {
    logger.error("OpenAI API key not configured", undefined, { service: 'transcription' });
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  const requestId = `transcribe-${Date.now()}`;
  logger.apiRequest('POST', '/api/transcribe', { requestId, language });

  try {
    // Step 1: Download file from Supabase signed URL
    if (!fileUrl) {
      logger.error("Missing file URL in transcription request", undefined, { requestId });
      return NextResponse.json({ error: "Missing file URL" }, { status: 400 });
    }

    logger.transcription("Starting file download from signed URL", { 
      requestId, 
      urlPreview: fileUrl?.substring(0, 50) + "..." 
    });
    
    // Download file from signed URL
    let fileRes;
    try {
      fileRes = await fetch(fileUrl);
      
      logger.transcription("File download response received", { 
        requestId, 
        status: fileRes.status, 
        statusText: fileRes.statusText 
      });
      
      if (!fileRes.ok) {
        logger.error("Failed to download audio file", undefined, { 
          requestId, 
          status: fileRes.status, 
          statusText: fileRes.statusText 
        });
        return NextResponse.json({ error: `Download failed: ${fileRes.statusText}` }, { status: 500 });
      }
      
      // Check Content-Type header
      const contentType = fileRes.headers.get('content-type');
      logger.transcription("File content type detected", { requestId, contentType });
    } catch (downloadError) {
      logger.error("Error during file download", downloadError, { requestId });
      return NextResponse.json({ error: `Download error: ${downloadError.message}` }, { status: 500 });
    }
    
    const blob = await fileRes.blob();
    const file = new File([blob], "recording.webm", { type: "video/webm" });
    const fileSizeMB = (blob.size / 1024 / 1024).toFixed(2);
    logger.transcription("File downloaded successfully", { requestId, fileSizeMB });

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
    
    // Call OpenAI API with enhanced error handling
    let openaiRes;
    try {
      const apiUrl = "https://api.openai.com/v1/audio/transcriptions";
      const requestOptions = {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
        body: form,
      };

      console.log("🔄 Calling OpenAI Whisper API...");
      console.log(`🔗 Endpoint: ${apiUrl}`);
      console.log(`🔑 API Key: ${apiKey ? 'Present' : 'MISSING'}`);
      
      // Make the API call with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      openaiRes = await fetch(apiUrl, {
        ...requestOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`🔄 OpenAI response status: ${openaiRes.status} ${openaiRes.statusText}`);
      
      // Log response headers for debugging
      console.log('📋 Response headers:');
      openaiRes.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
      });
      
      if (!openaiRes.ok) {
        const errorText = await openaiRes.text();
        console.error('❌ OpenAI API Error Response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: { message: errorText } };
        }
        return NextResponse.json(
          { 
            error: 'OpenAI API request failed',
            status: openaiRes.status,
            statusText: openaiRes.statusText,
            details: errorData
          }, 
          { status: 502 }
        );
      }
    } catch (openaiError) {
      console.error("❌ Error calling OpenAI API:", openaiError);
      
      // Enhanced error handling for different error types
      let errorMessage = 'Unknown error occurred';
      let statusCode = 500;
      
      if (openaiError.name === 'AbortError') {
        errorMessage = 'Request to OpenAI API timed out after 30 seconds';
        statusCode = 504; // Gateway Timeout
      } else if (openaiError.code === 'ECONNREFUSED') {
        errorMessage = 'Connection to OpenAI API was refused. Please check your network connection and proxy settings.';
        statusCode = 502; // Bad Gateway
      } else if (openaiError.code === 'ENOTFOUND') {
        errorMessage = 'Could not resolve OpenAI API hostname. Please check your DNS settings and network connection.';
        statusCode = 502;
      } else if (openaiError.code === 'ECONNRESET') {
        errorMessage = 'Connection to OpenAI API was reset. This could be due to network issues or server problems.';
        statusCode = 502;
      } else {
        errorMessage = `OpenAI API error: ${openaiError.message}`;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          code: openaiError.code,
          stack: process.env.NODE_ENV === 'development' ? openaiError.stack : undefined 
        }, 
        { status: statusCode }
      );
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
      originalTranscript: rawText, // Add originalTranscript field for PDF generation
      detected_language: result.language || detectedLang,
      language: result.language || detectedLang, // Add language field for consistency
      supported_language: detectedLang,
      is_translated: false, // Flag to indicate if this is a translated transcript
    };
    
    // Ensure transcript is also injected into any summary object if present
    if (result.summary || formData.get('summary')) {
      console.log('📝 Injecting transcript into summary object...');
      // Get existing summary from either the result or form data
      const summary = result.summary || JSON.parse(formData.get('summary') as string || '{}');
      
      // Inject transcript fields into summary object
      enhancedResult.summary = {
        ...summary,
        transcript: rawText,
        rawTranscript: rawText,
        originalTranscript: rawText
      };
      
      console.log('✅ Transcript injected into summary fields');
    }
    
    // Also ensure transcript is injected into structuredSummary if present
    if (result.structuredSummary || formData.get('structuredSummary')) {
      console.log('📝 Injecting transcript into structuredSummary object...');
      // Get existing structuredSummary
      const structuredSummary = result.structuredSummary || 
        JSON.parse(formData.get('structuredSummary') as string || '{}');
      
      // Inject transcript fields into structuredSummary object
      enhancedResult.structuredSummary = {
        ...structuredSummary,
        transcript: rawText,
        rawTranscript: rawText,
        originalTranscript: rawText
      };
      
      console.log('✅ Transcript injected into structuredSummary fields');
    }
    
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



