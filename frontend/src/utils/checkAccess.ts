import { supabase } from "@/lib/supabase";

export async function checkAccess(userId: string, allowedTiers: string[] = ["admin"]) {
  const { data, error } = await supabase
    .from("profiles")
    .select("membership_tier")
    .eq("id", userId)
    .single();

  if (error || !data) return false;

  return allowedTiers.includes(data.membership_tier ?? "free");
}

// add more access codes pre-pilot