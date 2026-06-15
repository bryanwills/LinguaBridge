"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createCallWithFriend } from "@/lib/rooms/calls";

export type FriendActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter an email address.")
  .email("Enter a valid email address.");

/** Send a friend request to a registered user by email. */
export async function sendFriendRequest(
  _prev: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "You are signed out. Sign in again." };
  }

  if (parsed.data.toLowerCase() === user.email?.toLowerCase()) {
    return { status: "error", message: "You can't add yourself." };
  }

  const { data: found, error: lookupError } = await supabase
    .rpc("find_user_by_email", { p_email: parsed.data })
    .maybeSingle<{ id: string; display_name: string | null }>();

  if (lookupError) {
    return { status: "error", message: lookupError.message };
  }
  if (!found) {
    return {
      status: "error",
      message: "No registered user with that email. They need an account first.",
    };
  }

  // Block duplicates in either direction.
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status, requester_id")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${found.id}),` +
        `and(requester_id.eq.${found.id},addressee_id.eq.${user.id})`,
    )
    .maybeSingle();

  if (existing) {
    const msg =
      existing.status === "accepted"
        ? "You're already friends."
        : existing.requester_id === user.id
          ? "You already sent them a request."
          : "They already sent you a request — check incoming requests.";
    return { status: "error", message: msg };
  }

  const { error: insertError } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: found.id,
    status: "pending",
  });

  if (insertError) {
    return { status: "error", message: insertError.message };
  }

  revalidatePath("/dashboard/friends");
  return {
    status: "success",
    message: `Request sent to ${found.display_name ?? parsed.data}.`,
  };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Accept an incoming friend request. */
export async function acceptFriendRequest(formData: FormData) {
  const id = String(formData.get("friendshipId") ?? "");
  const { supabase, user } = await requireUser();
  if (!user || !id) return;

  await supabase
    .from("friendships")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("addressee_id", user.id);

  revalidatePath("/dashboard/friends");
}

/** Decline an incoming request, cancel a sent one, or remove a friend. */
export async function removeFriendship(formData: FormData) {
  const id = String(formData.get("friendshipId") ?? "");
  const { supabase, user } = await requireUser();
  if (!user || !id) return;

  await supabase.from("friendships").delete().eq("id", id);

  revalidatePath("/dashboard/friends");
}

/** Start a call with an accepted friend and join the room. */
export async function callFriend(formData: FormData) {
  const friendId = String(formData.get("friendId") ?? "");
  const { supabase, user } = await requireUser();
  if (!user || !friendId) {
    redirect("/dashboard/friends");
  }

  // Confirm they are actually an accepted friend before ringing.
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),` +
        `and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`,
    )
    .maybeSingle();

  if (!friendship) {
    redirect("/dashboard/friends");
  }

  // One outgoing ring at a time for caller UX clarity.
  await supabase
    .from("call_invitations")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("caller_id", user.id)
    .eq("status", "ringing");

  const { roomId } = await createCallWithFriend(supabase, user, friendId);
  redirect(`/call/${roomId}`);
}

/** Join an existing ringing/active call invitation from dashboard. */
export async function joinActiveCall(formData: FormData) {
  const invitationId = String(formData.get("invitationId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  const { supabase, user } = await requireUser();
  if (!user || !invitationId || !roomId) {
    redirect("/dashboard/friends");
  }

  // Mark accepted for callee-side visibility when joining from dashboard.
  await supabase
    .from("call_invitations")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("callee_id", user.id);

  redirect(`/call/${roomId}`);
}
