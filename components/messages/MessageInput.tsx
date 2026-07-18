"use client";

import { useState } from "react";
import FileUpload from "./FileUpload";
import { sendMessage } from "@/lib/messages";

interface MessageInputProps {
  conversationId: number;
  senderId: string;
}

export default function MessageInput({
  conversationId,
  senderId,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;

    try {
      setLoading(true);

      await sendMessage(
        conversationId,
        senderId,
        message
      );

      setMessage("");

      // Realtime will update the chat automatically.
    } catch (error) {
      console.error(error);
      alert("Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-center gap-3">

        <FileUpload
          conversationId={conversationId}
          senderId={senderId}
          onUploaded={() => {}}
        />

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>

      </div>
    </div>
  );
}