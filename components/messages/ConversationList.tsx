"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Conversation {
  id: number;
  user1: {
    id: string;
    employee_id: string;
    full_name: string;
    role: string;
  };
  user2: {
    id: string;
    employee_id: string;
    full_name: string;
    role: string;
  };
}

interface Props {
  conversations: Conversation[];
  currentUserId: string;
}

export default function ConversationList({
  conversations,
  currentUserId,
}: Props) {
  const pathname = usePathname();

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center border-r bg-white">
        <p className="text-sm text-gray-500">
          No conversations found.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto border-r bg-white">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">
          Conversations
        </h2>
      </div>

      {conversations.map((conversation) => {
        const otherUser =
          conversation.user1.id === currentUserId
            ? conversation.user2
            : conversation.user1;

        const active =
          pathname === `/messages/${conversation.id}`;

        return (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className={`block border-b p-4 transition hover:bg-gray-100 ${
              active ? "bg-blue-50" : ""
            }`}
          >
            <div className="font-semibold">
              {otherUser.full_name}
            </div>

            <div className="text-sm text-gray-500">
              {otherUser.employee_id}
            </div>

            <div className="mt-1 inline-block rounded bg-slate-100 px-2 py-1 text-xs">
              {otherUser.role}
            </div>
          </Link>
        );
      })}
    </div>
  );
}