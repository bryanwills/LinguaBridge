import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getRoomAccess } from "@/lib/rooms/access";
import { CallRoom } from "@/components/call/CallRoom.client";

export const metadata = {
  title: "Call — LinguaBridge",
};

export default async function CallPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const user = await requireUser();

  const access = await getRoomAccess(user, roomId);
  if (!access) {
    // Not a member of this room — send them home rather than leak its existence.
    redirect("/dashboard");
  }

  return (
    <CallRoom
      roomId={access.roomId}
      title={access.title}
      language={access.language}
      userId={user.id}
      displayName={access.displayName}
    />
  );
}
