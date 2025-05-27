export async function callSummary(prompt: string) {
  try {
    const res = await fetch(
      "https://fiwtckfmtbcxryhhggsb.supabase.co/functions/v1/summarize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to call summary function: ${errorText}`);
    }

    const data = await res.json();
    return data.summary || "No summary returned.";
  } catch (error) {
    console.error('Summary function error:', error);
    throw error;
  }
}
