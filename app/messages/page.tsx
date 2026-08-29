"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Check,
  CheckCheck,
  FileText,
  Group,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { usePresence } from "@/components/layout/PresenceProvider";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Profile = {
  id: string;
  employee_id: string;
  full_name: string;
  role?: string;
};

type Message = {
  id: number;
  sender_id: string;
  receiver_id: string | null;
  group_id?: string | null;
  message: string;
  attachment_url?: string | null;
  created_at: string;
  is_read: boolean;
  is_pinned?: boolean;
  edited_at?: string | null;
  read_by?: string[];
  reply_to_id?: number | null;
  mentioned_ids?: string[];
  reactions?: Record<string, string[]>;
};

type ChatGroup = {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  member_count?: number;
};

export default function MessagesPage() {
  return (
    <MainLayout>
      <MessagesContent />
    </MainLayout>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("user");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const composerFormRef = useRef<HTMLFormElement>(null);

  const { onlineUserIds } = usePresence();

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  const [allUsers, setAllUsers] = useState<Profile[]>([]);

  const [chatUsers, setChatUsers] = useState<
    (Profile & { unreadCount: number })[]
  >([]);

  const [groups, setGroups] = useState<ChatGroup[]>([]);

  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const [selectedGroup, setSelectedGroup] =
    useState<ChatGroup | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [newMessage, setNewMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [messageSearch, setMessageSearch] = useState("");

  const [messageFilter, setMessageFilter] = useState<
    "all" | "photos" | "documents" | "links" | "pinned"
  >("all");

  const [showNewChat, setShowNewChat] = useState(false);

  const [showGroupModal, setShowGroupModal] = useState(false);

  const [groupName, setGroupName] = useState("");

  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);

  const [selectedFileName, setSelectedFileName] = useState("");

  const [uploading, setUploading] = useState(false);

  const [editingMessage, setEditingMessage] =
    useState<Message | null>(null);

  const [editText, setEditText] = useState("");

  const [loadingMessages, setLoadingMessages] = useState(false);

  const [messageError, setMessageError] = useState("");

  const [activeGroupMemberIds, setActiveGroupMemberIds] = useState<
    string[]
  >([]);

  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const [mentionedIds, setMentionedIds] = useState<string[]>([]);

  const [showMentionDropdown, setShowMentionDropdown] = useState(false);

  const [mentionQuery, setMentionQuery] = useState("");

  const [reactionPopoverId, setReactionPopoverId] = useState<
    number | null
  >(null);

  const [contextMenu, setContextMenu] = useState<{
    msg: Message;
    x: number;
    y: number;
  } | null>(null);

  const isNearBottomRef = useRef(true);

  const isAdmin =
    currentUser?.role === "Admin" ||
    currentUser?.role === "Super Admin";

  const activeMode = selectedGroup
    ? "group"
    : selectedUser
      ? "direct"
      : "none";

  /*
   * ---------------------------------------------------------
   * SAFE JSON HELPER
   * ---------------------------------------------------------
   */

  const safeJson = async (res: Response): Promise<any> => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  /*
   * ---------------------------------------------------------
   * REFRESH GROUPS
   * ---------------------------------------------------------
   */

  const refreshGroups = async () => {
    try {
      const res = await fetch("/api/messages/groups", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const json = await safeJson(res);

      if (!res.ok) {
        console.error(
          "Failed to load groups:",
          res.status,
          res.statusText,
          json
        );
        return;
      }

      setGroups(Array.isArray(json.groups) ? json.groups : []);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error("No authenticated Supabase user found.");
          return;
        }

        const bootstrapRes = await fetch(
          "/api/messages/direct",
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const bootstrap = await safeJson(bootstrapRes);

        if (!bootstrapRes.ok) {
          console.error(
            "Messages bootstrap failed:",
            bootstrapRes.status,
            bootstrapRes.statusText,
            bootstrap
          );

          return;
        }

        if (!bootstrap.currentUser) {
          console.error(
            "Messages bootstrap did not return currentUser:",
            bootstrap
          );

          return;
        }

        const me = bootstrap.currentUser as Profile;

        if (!mounted) return;

        setCurrentUser(me);

        setAllUsers(
          Array.isArray(bootstrap.users)
            ? (bootstrap.users as Profile[])
            : []
        );

        setChatUsers(
          Array.isArray(bootstrap.chatUsers)
            ? (bootstrap.chatUsers as (Profile & {
                unreadCount: number;
              })[])
            : []
        );

        /*
         * Open requested user from URL.
         *
         * Example:
         * /messages?user=UUID
         */
        if (targetUserId) {
          const found = (
            Array.isArray(bootstrap.users)
              ? bootstrap.users
              : []
          ).find(
            (u: Profile) => u.id === targetUserId
          );

          if (found) {
            setSelectedUser(found as Profile);
            setSelectedGroup(null);
          }
        }

        await refreshGroups();
      } catch (error) {
        console.error(
          "Messages initialization failed:",
          error
        );
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [targetUserId]);

  /*
   * ---------------------------------------------------------
   * MARK DIRECT CHAT AS READ
   * ---------------------------------------------------------
   */

  const markDirectRead = async (otherId: string) => {
    if (!currentUser) return;

    try {
      const res = await fetch(
        "/api/messages/direct",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            contact_id: otherId,
          }),
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        console.error(
          "Failed to mark messages as read:",
          res.status,
          res.statusText,
          json
        );

        return;
      }

      setChatUsers((prev) =>
        prev.map((x) =>
          x.id === otherId
            ? {
                ...x,
                unreadCount: 0,
              }
            : x
        )
      );
    } catch (error) {
      console.error(
        "Failed to mark direct chat as read:",
        error
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * FETCH ACTIVE MESSAGES
   *
   * IMPORTANT:
   * This function NEVER throws a network error into React.
   * This prevents the polling loop from breaking.
   * ---------------------------------------------------------
   */

  const fetchActiveMessages = async () => {
    if (!currentUser) return;

    if (!selectedGroup && !selectedUser) {
      setMessages([]);
      setMessageError("");
      return;
    }

    try {
      setLoadingMessages(true);

      setMessageError("");

      let url = "";

      /*
       * GROUP
       */
      if (selectedGroup) {
        url =
          `/api/messages/groups/` +
          `${encodeURIComponent(selectedGroup.id)}` +
          `/messages`;
      }

      /*
       * DIRECT CHAT
       */
      else if (selectedUser) {
        url =
          `/api/messages/direct?contact_id=` +
          `${encodeURIComponent(selectedUser.id)}`;
      }

      if (!url) {
        setMessages([]);
        return;
      }

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const json = await safeJson(res);

      /*
       * HTTP error
       */
      if (!res.ok) {
        console.error(
          "Messages API failed:",
          {
            url,
            status: res.status,
            statusText: res.statusText,
            response: json,
          }
        );

        setMessageError(
          `Unable to load messages (${res.status}).`
        );

        return;
      }

      /*
       * Validate response
       */
      if (!Array.isArray(json.messages)) {
        console.error(
          "Messages API returned invalid data:",
          json
        );

        setMessages([]);

        setMessageError(
          "Messages response was invalid."
        );

        return;
      }

      /*
       * SUCCESS
       */
      setMessages(
        json.messages as Message[]
      );

      setActiveGroupMemberIds(
        selectedGroup && Array.isArray(json.member_ids)
          ? (json.member_ids as string[])
          : []
      );

      setMessageError("");

      /*
       * Mark direct chat as read
       */
      if (selectedUser) {
        await markDirectRead(
          selectedUser.id
        );
      }
    } catch (error) {
      /*
       * THIS catches:
       *
       * TypeError: Failed to fetch
       *
       * without breaking the page.
       */
      console.error(
        "Failed to fetch active messages:",
        error
      );

      setMessageError(
        "Connection problem. Retrying..."
      );
    } finally {
      setLoadingMessages(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * FETCH WHEN ACTIVE CHAT CHANGES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!currentUser) return;

    // Opening a conversation should always land on the newest message,
    // regardless of where the user had scrolled to in a previous chat.
    isNearBottomRef.current = true;

    fetchActiveMessages();
  }, [
    currentUser?.id,
    selectedUser?.id,
    selectedGroup?.id,
  ]);

  /*
   * ---------------------------------------------------------
   * MESSAGE POLLING
   *
   * 3 seconds instead of 2.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (activeMode === "none") return;

    if (!currentUser) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      await fetchActiveMessages();
    };

    poll();

    const timer = window.setInterval(() => {
      if (!cancelled) {
        poll();
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    activeMode,
    currentUser?.id,
    selectedUser?.id,
    selectedGroup?.id,
  ]);

  /*
   * ---------------------------------------------------------
   * FILTER DIRECT CHATS
   * ---------------------------------------------------------
   */

  const filteredDirect = useMemo(() => {
    const q = searchQuery
      .trim()
      .toLowerCase();

    return chatUsers.filter((u) =>
      `${u.full_name} ${u.employee_id}`
        .toLowerCase()
        .includes(q)
    );
  }, [
    chatUsers,
    searchQuery,
  ]);

  /*
   * ---------------------------------------------------------
   * FILTER GROUPS
   * ---------------------------------------------------------
   */

  const filteredGroups = useMemo(() => {
    const q = searchQuery
      .trim()
      .toLowerCase();

    return groups.filter((g) =>
      g.name
        .toLowerCase()
        .includes(q)
    );
  }, [
    groups,
    searchQuery,
  ]);

  /*
   * ---------------------------------------------------------
   * FILTER MESSAGES
   * ---------------------------------------------------------
   */

  const visibleMessages = useMemo(() => {
    const q = messageSearch
      .trim()
      .toLowerCase();

    return messages.filter((msg) => {
      const attachment = String(
        msg.attachment_url || ""
      ).toLowerCase();

      const text = String(
        msg.message || ""
      ).toLowerCase();

      if (
        q &&
        !text.includes(q) &&
        !attachment.includes(q)
      ) {
        return false;
      }

      if (
        messageFilter === "pinned" &&
        !msg.is_pinned
      ) {
        return false;
      }

      if (
        messageFilter === "links" &&
        !(
          /https?:\/\//i.test(text) ||
          /https?:\/\//i.test(attachment)
        )
      ) {
        return false;
      }

      if (
        messageFilter === "photos" &&
        !/\.(jpg|jpeg|png|gif|webp|heic)(\?|$)/i.test(
          attachment
        )
      ) {
        return false;
      }

      if (
        messageFilter === "documents" &&
        !/\.(pdf|doc|docx|xls|xlsx|csv|txt|zip)(\?|$)/i.test(
          attachment
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    messages,
    messageSearch,
    messageFilter,
  ]);

  /*
   * ---------------------------------------------------------
   * MENTION CANDIDATES
   * ---------------------------------------------------------
   */

  const mentionCandidates = useMemo(() => {
    if (selectedGroup) {
      return allUsers.filter(
        (u) =>
          activeGroupMemberIds.includes(u.id) &&
          u.id !== currentUser?.id
      );
    }

    if (selectedUser) {
      return [selectedUser];
    }

    return [];
  }, [
    selectedGroup,
    selectedUser,
    allUsers,
    activeGroupMemberIds,
    currentUser,
  ]);

  const filteredMentionCandidates = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase();

    if (!q) return mentionCandidates;

    return mentionCandidates.filter((u) =>
      u.full_name?.toLowerCase().includes(q)
    );
  }, [mentionCandidates, mentionQuery]);

  /*
   * ---------------------------------------------------------
   * MENTION HIGHLIGHTING
   * ---------------------------------------------------------
   */

  const mentionableNames = useMemo(() => {
    return allUsers
      .map((u) => u.full_name)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
  }, [allUsers]);

  const renderMessageText = (text: string, isMe: boolean) => {
    if (!text) return null;

    if (mentionableNames.length === 0) return text;

    const pattern = new RegExp(
      `@(${mentionableNames.map(escapeRegExp).join("|")})\\b`,
      "gi"
    );

    const parts: React.ReactNode[] = [];

    let lastIndex = 0;
    let key = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      parts.push(
        <span
          key={key++}
          className={
            isMe
              ? "font-semibold text-blue-100 underline"
              : "font-semibold text-blue-600"
          }
        >
          {match[0]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  // Auto-scroll to the newest message whenever the message list
  // changes (sending, receiving, or opening a different chat/group) —
  // but only if the user was already near the bottom. Otherwise polling
  // updates would yank someone reading older history back to the newest
  // message every few seconds.
  useEffect(() => {
    if (!isNearBottomRef.current) return;

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, activeMode]);

  const handleMessagesScroll = (
    e: React.UIEvent<HTMLDivElement>
  ) => {
    const el = e.currentTarget;

    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <
      150;
  };

  /*
   * ---------------------------------------------------------
   * OPEN DIRECT CHAT
   * ---------------------------------------------------------
   */

  const openDirect = async (
    u: Profile
  ) => {
    setSelectedGroup(null);

    setSelectedUser(u);

    setMessageError("");

    setReplyTo(null);

    setMentionedIds([]);

    await markDirectRead(u.id);
  };

  /*
   * ---------------------------------------------------------
   * OPEN GROUP
   * ---------------------------------------------------------
   */

  const openGroup = (
    g: ChatGroup
  ) => {
    setSelectedUser(null);

    setSelectedGroup(g);

    setMessageError("");

    setReplyTo(null);

    setMentionedIds([]);
  };

  /*
   * ---------------------------------------------------------
   * CREATE DIRECT CHAT
   * ---------------------------------------------------------
   */

  const createDirect = async (
    u: Profile
  ) => {
    /*
     * IMPORTANT:
     * Clear the old search and close modal.
     */
    setSearchQuery("");

    setShowNewChat(false);

    setSelectedGroup(null);

    setSelectedUser(u);

    setMessageError("");

    setReplyTo(null);

    setMentionedIds([]);

    /*
     * Make sure the selected user appears
     * in the left chat list.
     */
    setChatUsers((prev) => {
      if (
        prev.some(
          (x) => x.id === u.id
        )
      ) {
        return prev;
      }

      return [
        {
          ...u,
          unreadCount: 0,
        },
        ...prev,
      ];
    });

    /*
     * Immediately load this conversation.
     */
    await fetchActiveMessages();
  };

  /*
   * ---------------------------------------------------------
   * CREATE GROUP
   * ---------------------------------------------------------
   */

  const createGroup = async () => {
    if (!isAdmin) return;

    if (!groupName.trim()) {
      alert("Enter a group name.");
      return;
    }

    try {
      const res = await fetch(
        "/api/messages/groups",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: groupName.trim(),
            member_ids: groupMemberIds,
          }),
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        alert(
          json.message ||
            "Failed to create group"
        );

        return;
      }

      setShowGroupModal(false);

      setGroupName("");

      setGroupMemberIds([]);

      await refreshGroups();

      if (json.group) {
        openGroup(
          json.group as ChatGroup
        );
      }
    } catch (error) {
      console.error(
        "Create group failed:",
        error
      );

      alert(
        "Unable to create group."
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * DELETE GROUP
   * ---------------------------------------------------------
   */

  const deleteGroup = async (
    id: string
  ) => {
    if (!isAdmin) return;

    const confirmed = confirm(
      "Delete this group? This deletes the group and its group messages."
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/messages/groups/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        alert(
          json.message ||
            "Failed to delete group"
        );

        return;
      }

      if (
        selectedGroup?.id === id
      ) {
        setSelectedGroup(null);
        setMessages([]);
      }

      await refreshGroups();
    } catch (error) {
      console.error(
        "Delete group failed:",
        error
      );

      alert(
        "Unable to delete group."
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * UPLOAD ATTACHMENT
   * ---------------------------------------------------------
   */

  const uploadAttachment = async (
    file: File
  ) => {
    const fd = new FormData();

    fd.append("file", file);

    const res = await fetch(
      "/api/messages/upload",
      {
        method: "POST",
        body: fd,
      }
    );

    const json = await safeJson(res);

    if (!res.ok) {
      throw new Error(
        json.message ||
          "Upload failed"
      );
    }

    return json.url as string;
  };

  /*
   * ---------------------------------------------------------
   * SEND MESSAGE
   * ---------------------------------------------------------
   */

  const sendMessage = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !currentUser ||
      (!selectedUser &&
        !selectedGroup)
    ) {
      return;
    }

    if (
      !newMessage.trim() &&
      !selectedFileName
    ) {
      return;
    }

    let attachment_url:
      | string
      | null = null;

    const file =
      fileInputRef.current?.files?.[0];

    try {
      setUploading(true);

      if (file) {
        attachment_url =
          await uploadAttachment(
            file
          );
      }

      let sentMessage:
        | Message
        | null = null;

      /*
       * GROUP MESSAGE
       */
      if (selectedGroup) {
        const res = await fetch(
          `/api/messages/groups/${encodeURIComponent(
            selectedGroup.id
          )}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              message:
                newMessage.trim(),
              attachment_url,
              reply_to_id:
                replyTo?.id ?? null,
              mentioned_ids:
                mentionedIds,
            }),
          }
        );

        const json =
          await safeJson(res);

        if (!res.ok) {
          throw new Error(
            json.message ||
              "Failed to send"
          );
        }

        sentMessage =
          json.message || null;
      }

      /*
       * DIRECT MESSAGE
       */
      else if (selectedUser) {
        const res = await fetch(
          "/api/messages/direct",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              receiver_id:
                selectedUser.id,
              message:
                newMessage.trim(),
              attachment_url,
              reply_to_id:
                replyTo?.id ?? null,
              mentioned_ids:
                mentionedIds,
            }),
          }
        );

        const json =
          await safeJson(res);

        if (!res.ok) {
          throw new Error(
            json.message ||
              "Failed to send message"
          );
        }

        sentMessage =
          json.message || null;
      }

      /*
       * CLEAR COMPOSER
       */
      setNewMessage("");

      setSelectedFileName("");

      setReplyTo(null);

      setMentionedIds([]);

      setShowMentionDropdown(false);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }

      // autoResizeComposer sets an inline height as the user types; clear
      // it so the textarea collapses back to one line after sending.
      if (messageInputRef.current) {
        messageInputRef.current.style.height = "auto";
      }

      /*
       * The sender should always land on their own new message,
       * even if they had scrolled up to read history.
       */
      isNearBottomRef.current = true;

      /*
       * Immediately show sent message.
       */
      if (sentMessage) {
        setMessages((prev) =>
          prev.some(
            (m) =>
              m.id ===
              sentMessage!.id
          )
            ? prev
            : [
                ...prev,
                sentMessage!,
              ]
        );
      }

      /*
       * Reload from database.
       */
      await fetchActiveMessages();
    } catch (error: any) {
      console.error(
        "Send message failed:",
        error
      );

      alert(
        error?.message ||
          "Failed to send message"
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * PIN MESSAGE
   * ---------------------------------------------------------
   */

  const togglePin = async (
    msg: Message
  ) => {
    if (!isAdmin) return;

    try {
      const res = await fetch(
        `/api/messages/manage/${msg.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            is_pinned:
              !msg.is_pinned,
          }),
        }
      );

      const json =
        await safeJson(res);

      if (!res.ok) {
        alert(
          json.message ||
            "Failed to update pin"
        );

        return;
      }

      await fetchActiveMessages();
    } catch (error) {
      console.error(
        "Pin message failed:",
        error
      );

      alert(
        "Unable to update pin."
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * EDIT MESSAGE
   * ---------------------------------------------------------
   */

  const editAnyMessage = async () => {
    if (
      !editingMessage ||
      !isAdmin
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/messages/manage/${editingMessage.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            message: editText,
          }),
        }
      );

      const json =
        await safeJson(res);

      if (!res.ok) {
        alert(
          json.message ||
            "Failed to edit message"
        );

        return;
      }

      setEditingMessage(null);

      setEditText("");

      await fetchActiveMessages();
    } catch (error) {
      console.error(
        "Edit message failed:",
        error
      );

      alert(
        "Unable to edit message."
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * DELETE MESSAGE
   * ---------------------------------------------------------
   */

  const deleteAnyMessage = async (
    id: number
  ) => {
    if (!isAdmin) return;

    if (
      !confirm(
        "Delete this message for everyone?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/messages/manage/${id}`,
        {
          method: "DELETE",
        }
      );

      const json =
        await safeJson(res);

      if (!res.ok) {
        alert(
          json.message ||
            "Failed to delete message"
        );

        return;
      }

      await fetchActiveMessages();
    } catch (error) {
      console.error(
        "Delete message failed:",
        error
      );

      alert(
        "Unable to delete message."
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * REPLY
   * ---------------------------------------------------------
   */

  const startReply = (msg: Message) => {
    setReplyTo(msg);

    messageInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const findMessageById = (
    id: number | null | undefined
  ) =>
    id == null
      ? undefined
      : messages.find((m) => m.id === id);

  /*
   * ---------------------------------------------------------
   * MENTIONS
   * ---------------------------------------------------------
   */

  const handleMessageChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;

    setNewMessage(value);

    const cursorPos =
      e.target.selectionStart ?? value.length;

    const textBeforeCursor = value.slice(
      0,
      cursorPos
    );

    const match = textBeforeCursor.match(
      /@([^\s@]*)$/
    );

    if (match) {
      setMentionQuery(match[1]);
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
      setMentionQuery("");
    }
  };

  // Enter sends the message; Shift+Enter inserts a newline (the browser
  // default for a textarea, so it just needs to not be intercepted).
  const handleComposerKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      composerFormRef.current?.requestSubmit();
    }
  };

  // Textareas don't grow on their own — keep it at one line until the
  // message wraps, then grow up to a cap so a long message doesn't push
  // the rest of the composer off-screen.
  const autoResizeComposer = (
    e: React.FormEvent<HTMLTextAreaElement>
  ) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const selectMention = (u: Profile) => {
    const cursorPos =
      messageInputRef.current?.selectionStart ??
      newMessage.length;

    const textBeforeCursor = newMessage.slice(
      0,
      cursorPos
    );

    const textAfterCursor = newMessage.slice(
      cursorPos
    );

    const newTextBefore = textBeforeCursor.replace(
      /@([^\s@]*)$/,
      `@${u.full_name} `
    );

    setNewMessage(newTextBefore + textAfterCursor);

    setMentionedIds((prev) =>
      prev.includes(u.id)
        ? prev
        : [...prev, u.id]
    );

    setShowMentionDropdown(false);

    setMentionQuery("");

    requestAnimationFrame(() =>
      messageInputRef.current?.focus()
    );
  };

  /*
   * ---------------------------------------------------------
   * EMOJI REACTIONS
   * ---------------------------------------------------------
   */

  const toggleReaction = async (
    msg: Message,
    emoji: string
  ) => {
    if (!currentUser) return;

    try {
      const res = await fetch(
        `/api/messages/manage/${msg.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ emoji }),
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        alert(
          json.message ||
            "Failed to react to message"
        );

        return;
      }

      setReactionPopoverId(null);

      await fetchActiveMessages();
    } catch (error) {
      console.error(
        "React to message failed:",
        error
      );

      alert(
        "Unable to react to message."
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * FILE SELECT
   * ---------------------------------------------------------
   */

  const selectFile = () => {
    fileInputRef.current?.click();
  };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-white">

      {/* =====================================================
          LEFT CHAT LIST
          ===================================================== */}

      <aside className="flex w-[360px] shrink-0 flex-col border-r border-slate-200 bg-white lg:w-[390px]">

        {/* HEADER */}

        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">

          <h2 className="text-[20px] font-bold tracking-tight text-slate-900">
            Chats
          </h2>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowNewChat(true);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
              title="New Chat"
            >
              <Plus size={21} />
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setShowGroupModal(true)
                }
                className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700"
                title="Create Group"
              >
                <Users size={19} />
              </button>
            )}

          </div>
        </div>

        {/* CHAT SEARCH */}

        <div className="border-b border-slate-100 bg-white p-4">

          <div className="relative">

            <Search
              size={17}
              className="absolute left-4 top-3 text-slate-400"
            />

            <input
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              placeholder="Search chats..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

          </div>

        </div>

        {/* GROUPS */}

        <div className="border-b bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          Groups
        </div>

        <div className="max-h-48 overflow-y-auto divide-y">

          {filteredGroups.length > 0 ? (
            filteredGroups.map((g) => (
              <div
                key={g.id}
                onClick={() =>
                  openGroup(g)
                }
                className={`flex cursor-pointer items-center gap-3 p-3 transition hover:bg-slate-50 ${
                  selectedGroup?.id ===
                  g.id
                    ? "border-l-4 border-emerald-600 bg-emerald-50"
                    : ""
                }`}
              >

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Group size={19} />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-semibold text-slate-900">
                    {g.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {g.member_count ??
                      0}{" "}
                    members
                  </p>

                </div>

              </div>
            ))
          ) : (
            <div className="p-4 text-xs text-slate-400">
              No groups
            </div>
          )}

        </div>

        {/* DIRECT CHATS */}

        <div className="border-b bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          Direct chats
        </div>

        <div className="flex-1 overflow-y-auto divide-y">

          {filteredDirect.length > 0 ? (
            filteredDirect.map(
              (u) => (
                <div
                  key={u.id}
                  onClick={() =>
                    openDirect(u)
                  }
                  className={`flex cursor-pointer items-center justify-between p-3 transition hover:bg-slate-50 ${
                    selectedUser?.id ===
                    u.id
                      ? "border-l-4 border-blue-600 bg-blue-50"
                      : ""
                  }`}
                >

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">

                      {u.full_name
                        ?.charAt(0)
                        .toUpperCase() ||
                        "U"}

                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                          onlineUserIds.has(
                            u.id
                          )
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      />

                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-slate-900">
                        {u.full_name}
                      </p>

                      <p className="truncate font-mono text-xs text-slate-500">
                        {u.employee_id}
                      </p>

                    </div>

                  </div>

                  {u.unreadCount >
                    0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                      {u.unreadCount}
                    </span>
                  )}

                </div>
              )
            )
          ) : (
            <div className="p-5 text-center text-sm text-slate-400">
              No chats found
            </div>
          )}

        </div>

      </aside>

      {/* =====================================================
          CHAT AREA
          ===================================================== */}

      <div className="flex min-w-0 flex-1 flex-col bg-[#efeae2]">

        {/* NO CHAT */}

        {activeMode ===
        "none" ? (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-400">

            <MessageCircle
              size={64}
              strokeWidth={1.5}
            />

            <p className="mt-4 text-lg font-medium">
              Select a chat
            </p>

            <p className="mt-1 text-sm">
              Choose a conversation
              from the left
            </p>

          </div>
        ) : (
          <>

            {/* CHAT HEADER */}

            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm">

              <div className="flex items-center gap-3">

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-white ${
                    selectedGroup
                      ? "bg-emerald-600"
                      : "bg-blue-600"
                  }`}
                >
                  {selectedGroup ? (
                    <Group size={21} />
                  ) : (
                    selectedUser?.full_name
                      ?.charAt(0)
                      .toUpperCase()
                  )}
                </div>

                <div>

                  <p className="font-bold text-slate-900">
                    {selectedGroup?.name ||
                      selectedUser?.full_name}
                  </p>

                  <p className="text-xs text-slate-500">

                    {selectedGroup
                      ? `${selectedGroup.member_count ?? 0} members`
                      : onlineUserIds.has(
                            selectedUser?.id ||
                              ""
                          )
                        ? "Online"
                        : "Offline"}

                  </p>

                </div>

              </div>

              {selectedGroup &&
                isAdmin && (
                  <button
                    type="button"
                    onClick={() =>
                      deleteGroup(
                        selectedGroup.id
                      )
                    }
                    className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                    title="Delete Group"
                  >
                    <Trash2
                      size={17}
                    />
                  </button>
                )}

            </div>

            {/* MESSAGE SEARCH */}

            <div className="border-b bg-white px-4 py-2">

              <div className="flex flex-wrap items-center gap-2">

                <div className="relative min-w-[220px] flex-1">

                  <Search
                    size={14}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />

                  <input
                    value={
                      messageSearch
                    }
                    onChange={(e) =>
                      setMessageSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search messages..."
                    className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-400"
                  />

                </div>

                {(
                  [
                    "all",
                    "photos",
                    "documents",
                    "links",
                    "pinned",
                  ] as const
                ).map(
                  (filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() =>
                        setMessageFilter(
                          filter
                        )
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                        messageFilter ===
                        filter
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filter ===
                      "all"
                        ? "All"
                        : filter ===
                            "photos"
                          ? "Photos"
                          : filter ===
                              "documents"
                            ? "Documents"
                            : filter ===
                                "links"
                              ? "Links"
                              : "Pinned"}
                    </button>
                  )
                )}

              </div>

            </div>

            {/* CONNECTION ERROR */}

            {messageError && (
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-700">
                {messageError}
              </div>
            )}

            {/* MESSAGES */}

            <div
              className="flex-1 space-y-3 overflow-y-auto p-6"
              onScroll={handleMessagesScroll}
            >

              {loadingMessages &&
                visibleMessages.length ===
                  0 && (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Loading messages...
                  </div>
                )}

              {!loadingMessages &&
                visibleMessages.length ===
                  0 && (
                  <div className="flex h-full items-center justify-center">

                    <div className="text-center text-slate-400">

                      <MessageCircle
                        size={42}
                        className="mx-auto"
                      />

                      <p className="mt-3 text-sm font-medium">
                        No messages yet
                      </p>

                      <p className="mt-1 text-xs">
                        Start the conversation
                      </p>

                    </div>

                  </div>
                )}

              {visibleMessages.map(
                (msg) => {
                  const isMe =
                    msg.sender_id ===
                    currentUser?.id;

                  const sender =
                    allUsers.find(
                      (u) =>
                        u.id ===
                        msg.sender_id
                    );

                  const groupSeen =
                    selectedGroup
                      ? Array.isArray(
                          msg.read_by
                        ) &&
                        msg.read_by.length >=
                          (selectedGroup.member_count ||
                            0)
                      : false;

                  const originalMessage =
                    findMessageById(
                      msg.reply_to_id
                    );

                  const originalSender =
                    originalMessage
                      ? allUsers.find(
                          (u) =>
                            u.id ===
                            originalMessage.sender_id
                        )
                      : undefined;

                  const messageReactions =
                    msg.reactions &&
                    typeof msg.reactions ===
                      "object"
                      ? msg.reactions
                      : {};

                  return (
                    <div
                      key={msg.id}
                      className={`group flex ${
                        isMe
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      <div
                        onContextMenu={(e) => {
                          e.preventDefault();

                          setContextMenu({
                            msg,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isMe
                            ? "rounded-tr-none bg-blue-600 text-white"
                            : "rounded-tl-none bg-white text-slate-900"
                        }`}
                      >

                        {selectedGroup &&
                          !isMe && (
                            <p className="mb-1 text-[11px] font-bold text-emerald-700">
                              {sender?.full_name ||
                                "User"}
                            </p>
                          )}

                        {msg.reply_to_id != null && (
                          <div
                            className={`mb-1.5 rounded-lg border-l-4 px-2.5 py-1.5 text-xs ${
                              isMe
                                ? "border-blue-200 bg-blue-500/30 text-blue-50"
                                : "border-emerald-400 bg-slate-100 text-slate-600"
                            }`}
                          >
                            <p className="font-semibold">
                              {originalMessage
                                ? originalSender?.full_name ||
                                  (originalMessage.sender_id ===
                                  currentUser?.id
                                    ? "You"
                                    : "User")
                                : "Original message"}
                            </p>
                            <p className="truncate">
                              {originalMessage
                                ? originalMessage.message ||
                                  "Attachment"
                                : "Message unavailable"}
                            </p>
                          </div>
                        )}

                        {msg.message && (
                          <p className="whitespace-pre-wrap break-words">
                            {renderMessageText(
                              msg.message,
                              isMe
                            )}
                          </p>
                        )}

                        {msg.attachment_url && (
                          <a
                            href={
                              msg.attachment_url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-2 flex items-center gap-1 text-xs underline ${
                              isMe
                                ? "text-blue-100"
                                : "text-blue-600"
                            }`}
                          >
                            <FileText
                              size={13}
                            />
                            Open attachment
                          </a>
                        )}

                        {Object.keys(
                          messageReactions
                        ).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {Object.entries(
                              messageReactions
                            ).map(
                              ([
                                emoji,
                                userIds,
                              ]) => {
                                const ids =
                                  Array.isArray(
                                    userIds
                                  )
                                    ? userIds
                                    : [];

                                if (
                                  ids.length ===
                                  0
                                )
                                  return null;

                                const reacted =
                                  !!currentUser &&
                                  ids.includes(
                                    currentUser.id
                                  );

                                return (
                                  <button
                                    key={
                                      emoji
                                    }
                                    type="button"
                                    onClick={() =>
                                      toggleReaction(
                                        msg,
                                        emoji
                                      )
                                    }
                                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
                                      reacted
                                        ? "border-blue-400 bg-blue-50 text-blue-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    <span>
                                      {
                                        emoji
                                      }
                                    </span>
                                    <span className="font-semibold">
                                      {
                                        ids.length
                                      }
                                    </span>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}

                        <div
                          className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${
                            isMe
                              ? "text-blue-100"
                              : "text-slate-400"
                          }`}
                        >

                          {msg.is_pinned && (
                            <span title="Pinned">
                              📌
                            </span>
                          )}

                          <span>
                            {msg.edited_at
                              ? "edited · "
                              : ""}
                            {new Date(
                              msg.created_at
                            ).toLocaleTimeString(
                              [],
                              {
                                hour:
                                  "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </span>

                          {isMe &&
                            (selectedGroup
                              ? groupSeen
                                ? (
                                    <span className="inline-flex items-center gap-1 font-semibold text-sky-300">
                                      <CheckCheck
                                        size={
                                          14
                                        }
                                      />
                                      Seen
                                    </span>
                                  )
                                : (
                                    <span className="inline-flex items-center gap-1">
                                      <Check
                                        size={
                                          13
                                        }
                                      />
                                      Sent
                                    </span>
                                  )
                              : msg.is_read
                                ? (
                                    <span className="inline-flex items-center gap-1 font-semibold text-sky-300">
                                      <CheckCheck
                                        size={
                                          14
                                        }
                                      />
                                      Seen
                                    </span>
                                  )
                                : (
                                    <span className="inline-flex items-center gap-1">
                                      <Check
                                        size={
                                          13
                                        }
                                      />
                                      Sent
                                    </span>
                                  ))}

                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">

                            <button
                              type="button"
                              onClick={() =>
                                startReply(
                                  msg
                                )
                              }
                              title="Reply"
                            >
                              <Reply
                                size={
                                  13
                                }
                              />
                            </button>

                            <div className="relative">

                              <button
                                type="button"
                                onClick={() =>
                                  setReactionPopoverId(
                                    (prev) =>
                                      prev ===
                                      msg.id
                                        ? null
                                        : msg.id
                                  )
                                }
                                title="React"
                              >
                                <Smile
                                  size={
                                    13
                                  }
                                />
                              </button>

                              {reactionPopoverId ===
                                msg.id && (
                                <div
                                  className={`absolute bottom-full z-10 mb-2 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-lg ${
                                    isMe
                                      ? "right-0"
                                      : "left-0"
                                  }`}
                                >
                                  {QUICK_REACTIONS.map(
                                    (
                                      emoji
                                    ) => (
                                      <button
                                        key={
                                          emoji
                                        }
                                        type="button"
                                        onClick={() =>
                                          toggleReaction(
                                            msg,
                                            emoji
                                          )
                                        }
                                        className="text-base transition-transform hover:scale-125"
                                      >
                                        {
                                          emoji
                                        }
                                      </button>
                                    )
                                  )}
                                </div>
                              )}

                            </div>

                            {isAdmin && (
                              <>

                                <button
                                  type="button"
                                  onClick={() =>
                                    togglePin(
                                      msg
                                    )
                                  }
                                  title={
                                    msg.is_pinned
                                      ? "Unpin message"
                                      : "Pin message"
                                  }
                                >
                                  {msg.is_pinned
                                    ? "📍"
                                    : "📌"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessage(
                                      msg
                                    );

                                    setEditText(
                                      msg.message
                                    );
                                  }}
                                  title="Edit message"
                                >
                                  <Pencil
                                    size={
                                      13
                                    }
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteAnyMessage(
                                      msg.id
                                    )
                                  }
                                  title="Delete message"
                                >
                                  <Trash2
                                    size={
                                      13
                                    }
                                  />
                                </button>

                              </>
                            )}

                          </div>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

              <div ref={messagesEndRef} />

            </div>

            {/* REPLY PREVIEW */}

            {replyTo && (
              <div className="flex items-center justify-between gap-3 border-t bg-slate-50 px-4 py-2">

                <div className="min-w-0 border-l-4 border-blue-500 pl-3">

                  <p className="truncate text-xs font-semibold text-blue-700">
                    Replying to{" "}
                    {allUsers.find(
                      (u) =>
                        u.id ===
                        replyTo.sender_id
                    )?.full_name ||
                      (replyTo.sender_id ===
                      currentUser?.id
                        ? "yourself"
                        : "User")}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {replyTo.message ||
                      "Attachment"}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={cancelReply}
                  aria-label="Cancel reply"
                  className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X size={16} />
                </button>

              </div>
            )}

            {/* COMPOSER */}

            <form
              ref={composerFormRef}
              onSubmit={sendMessage}
              className="flex shrink-0 items-end gap-3 border-t bg-white p-3"
            >

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) =>
                  setSelectedFileName(
                    e.target.files?.[0]
                      ?.name || ""
                  )
                }
                className="hidden"
              />

              <button
                type="button"
                onClick={selectFile}
                className={`rounded-xl border p-3 ${
                  selectedFileName
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "bg-white text-slate-600"
                }`}
                title={
                  selectedFileName ||
                  "Attach file"
                }
              >
                <Paperclip
                  size={19}
                />
              </button>

              <div className="relative flex-1">

                <textarea
                  ref={messageInputRef}
                  value={newMessage}
                  onChange={
                    handleMessageChange
                  }
                  onKeyDown={
                    handleComposerKeyDown
                  }
                  onInput={
                    autoResizeComposer
                  }
                  rows={1}
                  placeholder={
                    selectedGroup
                      ? "Message group..."
                      : "Type a message..."
                  }
                  className="max-h-[120px] min-h-12 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 leading-6 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />

                {showMentionDropdown &&
                  filteredMentionCandidates.length >
                    0 && (
                    <div className="absolute bottom-full left-0 z-10 mb-2 max-h-48 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">

                      {filteredMentionCandidates.map(
                        (u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() =>
                              selectMention(
                                u
                              )
                            }
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >

                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                              {u.full_name
                                ?.charAt(0)
                                .toUpperCase() ||
                                "U"}
                            </div>

                            <span className="truncate">
                              {u.full_name}
                            </span>

                          </button>
                        )
                      )}

                    </div>
                  )}

              </div>

              <button
                type="submit"
                disabled={uploading}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={19} />
              </button>

            </form>

          </>
        )}

      </div>

      {/* =====================================================
          NEW CHAT MODAL
          ===================================================== */}

      {showNewChat && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b p-5">

              <h3 className="text-lg font-bold">
                New Chat
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowNewChat(false)
                }
                aria-label="Close"
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <X />
              </button>

            </div>

            <div className="p-5">

              <div className="relative">

                <Search
                  size={15}
                  className="absolute left-3 top-2.5 text-slate-400"
                />

                <input
                  autoFocus
                  value={
                    searchQuery
                  }
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  placeholder="Search users..."
                  className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
                />

              </div>

              <div className="mt-3 max-h-[55vh] space-y-1 overflow-y-auto">

                {allUsers
                  .filter((u) =>
                    `${u.full_name} ${u.employee_id}`
                      .toLowerCase()
                      .includes(
                        searchQuery
                          .toLowerCase()
                      )
                  )
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() =>
                        createDirect(
                          u
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50"
                    >

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                        <User
                          size={18}
                        />
                      </div>

                      <div className="min-w-0">

                        <p className="truncate font-semibold">
                          {u.full_name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {u.employee_id}
                          {" · "}
                          {u.role ||
                            "User"}
                        </p>

                      </div>

                    </button>
                  ))}

                {allUsers.length ===
                  0 && (
                  <div className="p-5 text-center text-sm text-slate-500">
                    No users available.
                  </div>
                )}

                {allUsers.length >
                  0 &&
                  !allUsers.some(
                    (u) =>
                      `${u.full_name} ${u.employee_id}`
                        .toLowerCase()
                        .includes(
                          searchQuery.toLowerCase()
                        )
                  ) && (
                    <div className="p-5 text-center text-sm text-slate-500">
                      No users match your
                      search.
                    </div>
                  )}

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          CREATE GROUP MODAL
          ===================================================== */}

      {showGroupModal &&
        isAdmin && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4">

            <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">

              <div className="flex items-center justify-between">

                <h3 className="text-lg font-bold">
                  Create Group
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setShowGroupModal(
                      false
                    )
                  }
                  className="rounded-full p-1 hover:bg-slate-100"
                >
                  <X />
                </button>

              </div>

              <input
                value={groupName}
                onChange={(e) =>
                  setGroupName(
                    e.target.value
                  )
                }
                placeholder="Group name"
                className="mt-4 w-full rounded-xl border px-3 py-2.5 outline-none focus:border-emerald-400"
              />

              <p className="mt-4 text-sm font-semibold">
                Select members
              </p>

              <div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-xl border p-3">

                {allUsers.map((u) => {
                  const checked =
                    groupMemberIds.includes(
                      u.id
                    );

                  return (
                    <label
                      key={u.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                    >

                      <input
                        type="checkbox"
                        checked={
                          checked
                        }
                        onChange={() =>
                          setGroupMemberIds(
                            (prev) =>
                              checked
                                ? prev.filter(
                                    (
                                      id
                                    ) =>
                                      id !==
                                      u.id
                                  )
                                : [
                                    ...prev,
                                    u.id,
                                  ]
                          )
                        }
                      />

                      <div>

                        <p className="font-medium">
                          {u.full_name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {u.employee_id}
                        </p>

                      </div>

                    </label>
                  );
                })}

              </div>

              <button
                type="button"
                onClick={
                  createGroup
                }
                className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700"
              >
                Create Group
              </button>

            </div>

          </div>
        )}

      {/* =====================================================
          EDIT MESSAGE MODAL
          ===================================================== */}

      {editingMessage &&
        isAdmin && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">

              <div className="flex items-center justify-between">

                <h3 className="text-lg font-bold">
                  Edit Message
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setEditingMessage(
                      null
                    )
                  }
                  className="rounded-full p-1 hover:bg-slate-100"
                >
                  <X />
                </button>

              </div>

              <textarea
                value={editText}
                onChange={(e) =>
                  setEditText(
                    e.target.value
                  )
                }
                rows={5}
                className="mt-4 w-full rounded-xl border p-3 outline-none focus:border-blue-400"
              />

              <button
                type="button"
                onClick={
                  editAnyMessage
                }
                className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700"
              >
                Save Changes
              </button>

            </div>

          </div>
        )}

      {/* =====================================================
          MESSAGE CONTEXT MENU (right-click)
          ===================================================== */}

      {contextMenu && (
        <>

          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />

          <div
            className="fixed z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
            style={{
              top: Math.min(
                contextMenu.y,
                window.innerHeight - 130
              ),
              left: Math.min(
                contextMenu.x,
                window.innerWidth - 190
              ),
            }}
          >

            <button
              type="button"
              onClick={() => {
                startReply(contextMenu.msg);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Reply size={14} />
              Reply
            </button>

            <div className="flex items-center justify-between gap-1 px-3 py-2">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    toggleReaction(
                      contextMenu.msg,
                      emoji
                    );
                    setContextMenu(null);
                  }}
                  className="text-base transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>

          </div>

        </>
      )}

    </div>
  );
}
