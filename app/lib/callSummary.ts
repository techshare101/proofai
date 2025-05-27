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
    const summary = data.summary;
  if (!summary || summary.includes("I lack the ability")) {
    // handle error or skip PDF
    return null;
  }
  return summary;
  } catch (error) {
    console.error('Summary function error:', error);
    throw error;
  }
}
