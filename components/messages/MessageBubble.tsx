"use client";

interface MessageBubbleProps {
  message: any;
  currentUserId: string;
}

export default function MessageBubble({
  message,
  currentUserId,
}: MessageBubbleProps) {
  const isMine = message.sender_id === currentUserId;

  return (
    <div
      className={`flex mb-4 ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-md rounded-lg px-4 py-3 ${
          isMine
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-900"
        }`}
      >
        <div className="text-xs font-semibold mb-1">
          {message.sender?.full_name}
        </div>

        {message.message && (
          <p>{message.message}</p>
        )}

        {message.file_url && (
          <a
            href={message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 underline"
          >
            📎 {message.file_name}
          </a>
        )}

        <div className="mt-2 text-[11px] opacity-70">
          {new Date(message.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}