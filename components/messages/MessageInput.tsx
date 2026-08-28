"use client";

interface MessageInputProps {
  conversationId: number;
  senderId: string;
}

export default function MessageInput({
  conversationId,
  senderId,
}: MessageInputProps) {
  void conversationId;
  void senderId;

  return (
    <div className="border-t bg-white p-4 text-sm text-slate-500">
      Replies will be available when conversation threads are added.
    </div>
  );
}