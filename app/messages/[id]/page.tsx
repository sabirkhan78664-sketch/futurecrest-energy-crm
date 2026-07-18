import { redirect } from "next/navigation";
import ChatWindow from "@/components/messages/ChatWindow";
import { getCurrentProfile } from "@/lib/auth";
import { getMessages, markAsRead } from "@/lib/messages";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ConversationPage({
  params,
}: PageProps) {
  const { id } = await params;

  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const conversationId = Number(id);

  const messages = await getMessages(conversationId);

  await markAsRead(conversationId, profile.id);

  return (
    <div className="h-[calc(100vh-100px)]">
      <ChatWindow
        messages={messages}
        currentUserId={profile.id}
        conversationId={conversationId}
      />
    </div>
  );
}