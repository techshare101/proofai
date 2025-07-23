import { supabase } from "@/lib/supabase";

export async function insertDummyReport(folderId: string, userId: string) {
  const { data, error } = await supabase
    .from("reports")
    .insert([
      {
        title: "Test Report 🧪",
        summary: "This is a dummy summary.",
        folder_id: folderId,
        user_id: userId,
        report_url: "/dummy.pdf",
        created_at: new Date().toISOString(),
      },
    ])
    .select(); // Add select() to return the inserted data with proper typing

  if (error) {
    console.error("Failed to insert dummy report:", error.message);
    return null;
  }

  // With select(), data will be properly typed as an array
  return data && data.length > 0 ? data[0] : null;
}
