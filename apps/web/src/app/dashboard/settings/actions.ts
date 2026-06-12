"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSettingsSchema } from "@/lib/auth/profile-schema";

export type UpdateProfileState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function updateProfile(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const parsed = profileSettingsSchema.safeParse({
    displayName: formData.get("displayName"),
    preferredLanguage: formData.get("preferredLanguage"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "You are signed out. Sign in again." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      preferred_language: parsed.data.preferredLanguage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { status: "success", message: "Profile saved." };
}
