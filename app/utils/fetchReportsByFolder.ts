import supabase from "@/lib/supabase";

export async function fetchReportsByFolder(folderId: string, userId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("folder_id", folderId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reports:", error.message);
    return [];
  }

  return data;
}
