import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { audioUrl, language = "auto" } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 500 });

  try {
    // Step 1: Download file from Supabase signed URL
    console.log("📥 Downloading file from signed URL:", audioUrl?.substring(0, 50) + "...");
    const fileRes = await fetch(audioUrl);
    
    if (!fileRes.ok) {
      console.error(`Failed to download audio: ${fileRes.status} ${fileRes.statusText}`);
      return NextResponse.json({ error: `Download failed: ${fileRes.statusText}` }, { status: 500 });
    }
    
    const blob = await fileRes.blob();
    const file = new File([blob], "recording.webm", { type: "video/webm" });
    console.log(`✅ File downloaded: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

    // Step 2: Prepare OpenAI request
    const form = new FormData();
    form.append("file", file);
    form.append("model", "whisper-1");
    form.append("language", language);

    // Step 3: Send to OpenAI
    console.log("🔄 Calling OpenAI Whisper API...");
    const openaiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    const result = await openaiRes.json();
    if (!openaiRes.ok) {
      console.error("❌ OpenAI Whisper Error:", result);
      return NextResponse.json(result, { status: 500 });
    }

    console.log("✅ Transcription successful");
    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ API error:", err);
    return NextResponse.json({ error: "Server error during transcription" }, { status: 500 });
  }
}
