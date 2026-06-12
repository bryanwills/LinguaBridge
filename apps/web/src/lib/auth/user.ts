import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  display_name: string | null;
  preferred_language: string;
  timezone: string;
  avatar_url: string | null;
};

/** Server-side guard: returns the signed-in user or redirects to /login. */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Loads the user's profile. A DB trigger creates it at sign-up; the
 * client-side upsert here is a fallback for accounts that predate the trigger.
 */
export async function getOrCreateProfile(user: User): Promise<Profile> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, display_name, preferred_language, timezone, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data: created, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      display_name:
        (user.user_metadata.full_name as string | undefined) ??
        (user.user_metadata.name as string | undefined) ??
        user.email?.split("@")[0] ??
        null,
      avatar_url: (user.user_metadata.avatar_url as string | undefined) ?? null,
    })
    .select("id, display_name, preferred_language, timezone, avatar_url")
    .single();

  if (error || !created) {
    throw new Error(`Failed to bootstrap profile: ${error?.message}`);
  }
  return created;
}
