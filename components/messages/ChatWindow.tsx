"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

interface Props {
  messages: any[];
  currentUserId: string;
  conversationId: number;
}

export default function ChatWindow({
  messages: initialMessages,
  currentUserId,
  conversationId,
}: Props) {
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          const { data } = await supabase
            .from("messages")
            .select(`
              *,
              sender:profiles(
                id,
                employee_id,
                full_name
              )
            `)
            .eq("conversation_id", conversationId)
            .order("created_at", {
              ascending: true,
            });

          setMessages(data ?? []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return (
    <div className="flex h-full flex-col">

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      <MessageInput
        conversationId={conversationId}
        senderId={currentUserId}
      />

    </div>
  );
}