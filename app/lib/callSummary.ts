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
    if (!summary) {
      throw new Error('No summary received from the API');
    }

    if (summary.includes("I lack the ability") || summary.includes("I apologize") || summary.includes("I'm sorry")) {
      throw new Error('AI was unable to generate a summary');
    }
  return summary;
  } catch (error) {
    console.error('Summary function error:', error);
    throw error;
  }
}
