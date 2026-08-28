"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Search, User, AlertCircle, Paperclip, X, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  employee_id: string;
  full_name: string;
  can_send_messages?: boolean;
  can_receive_messages?: boolean;
}

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  attachment_url?: string;
  created_at: string;
}

interface ChatClientProps {
  currentUser: UserProfile;
}

export default function ChatClient({ currentUser }: ChatClientProps) {
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [activeContact, setActiveContact] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  // State for file attachments
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const [myPermissions, setMyPermissions] = useState({ canSend: true, canReceive: true });
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeContactRef = useRef<string | null>(null);
  
  // Ref to trigger the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    activeContactRef.current = activeContact?.id || null;
  }, [activeContact]);

  useEffect(() => {
    async function fetchContacts() {
      const { data } = await supabase
        .from("profiles")
        .select("id, employee_id, full_name, can_send_messages, can_receive_messages")
        .eq("status", "Active")
        .neq("id", currentUser.id);
      if (data) setContacts(data);
    }
    
    async function fetchMyPermissions() {
      const { data } = await supabase
        .from("profiles")
        .select("can_send_messages, can_receive_messages")
        .eq("id", currentUser.id)
        .single();
      if (data) {
        setMyPermissions({
          canSend: data.can_send_messages ?? true,
          canReceive: data.can_receive_messages ?? true,
        });
      }
    }

    fetchContacts();
    fetchMyPermissions();
  }, [currentUser.id]);

  useEffect(() => {
    const channel = supabase
      .channel('global_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.receiver_id === currentUser.id) {
            if (activeContactRef.current === newMsg.sender_id) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            } else {
              setUnreadCounts((prev) => ({
                ...prev,
                [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id]);

  useEffect(() => {
    if (!activeContact) return;
    setUnreadCounts((prev) => ({ ...prev, [activeContact.id]: 0 }));

    async function fetchMessages() {
      const { data, error } = await supabase
        .from("crm_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeContact?.id}),and(sender_id.eq.${activeContact?.id},receiver_id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    }
    fetchMessages();
  }, [activeContact, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredContacts = contacts.filter((contact) => {
    const name = contact.full_name || "";
    const empId = contact.employee_id || "";
    const query = searchQuery || "";
    return (
      name.toLowerCase().includes(query.toLowerCase()) || 
      empId.toLowerCase().includes(query.toLowerCase())
    );
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !file) || !activeContact || isSending || !myPermissions.canSend) return;

    setIsSending(true);
    let attachmentUrl = null;

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(fileName, file);

      if (uploadError) {
        alert("Failed to upload file: " + uploadError.message);
        setIsSending(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(fileName);
        
      attachmentUrl = publicUrlData.publicUrl;
    }

    const messageText = newMessage;
    setNewMessage(""); 
    setFile(null); 

    const { data, error } = await supabase
      .from("crm_messages")
      .insert([
        {
          sender_id: currentUser.id,
          receiver_id: activeContact.id,
          message: messageText,
          attachment_url: attachmentUrl, 
          is_read: false
        }
      ])
      .select();

    if (error) {
      alert("Supabase Error: " + error.message);
      console.error("Supabase Error Details:", error);
    } else if (data && data[0]) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data[0].id)) return prev;
        return [...prev, data[0] as Message];
      });
    }

    setIsSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-xl border bg-white shadow-sm">
      
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h2 className="mb-4 text-xl font-bold">Chats</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={`flex cursor-pointer items-center gap-3 border-b p-4 transition-colors hover:bg-gray-100 ${
                activeContact?.id === contact.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <User size={20} />
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-semibold">{contact.full_name}</p>
                <p className="truncate text-xs text-gray-500">{contact.employee_id}</p>
              </div>
              {unreadCounts[contact.id] > 0 && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-sm">
                  {unreadCounts[contact.id]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-2/3 flex-col bg-white">
        {activeContact ? (
          <>
            <div className="z-10 flex items-center gap-3 border-b bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-bold">{activeContact.full_name}</h3>
                <p className="text-xs text-gray-500">{activeContact.employee_id}</p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[#e5ddd5] p-4">
              <div className="mb-6 flex justify-center">
                <span className="rounded-md border border-yellow-200 bg-yellow-100/80 px-3 py-1.5 text-xs text-gray-600 shadow-sm">
                  This conversation is end-to-end encrypted within your CRM.
                </span>
              </div>
              
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUser.id;
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                        isMe
                          ? "rounded-tr-none bg-blue-600 text-white"
                          : "rounded-tl-none border border-gray-100 bg-white text-gray-800"
                      }`}
                    >
                      {msg.message && <p className="text-sm">{msg.message}</p>}
                      
                      {msg.attachment_url && (
                        <a 
                          href={msg.attachment_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className={`mt-2 flex items-center gap-2 rounded-md p-2 text-xs font-medium transition-colors hover:opacity-80 ${
                            isMe ? "bg-blue-700 text-blue-50" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <FileText size={16} />
                          <span className="underline">View Attachment</span>
                        </a>
                      )}

                      <p className={`mt-1 text-right text-[10px] ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex flex-col border-t bg-gray-100 p-4">
              
              {file && (
                <div className="mb-3 flex w-max items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-2 text-sm text-blue-700">
                  <Paperclip size={14} />
                  <span className="max-w-[200px] truncate font-medium">{file.name}</span>
                  <button 
                    onClick={() => setFile(null)} 
                    className="ml-2 rounded-full p-1 hover:bg-blue-200"
                    disabled={isSending}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {!myPermissions.canSend ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-3 text-red-600">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">Your chat access has been disabled by the Administrator.</span>
                </div>
              ) : activeContact.can_receive_messages === false ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-200 py-3 text-gray-600">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">This user is not allowed to receive messages.</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={isSending}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    type="text"
                    placeholder={file ? "Add a message (optional)..." : "Type a message..."}
                    className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                  />

                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !file) || isSending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    <Send size={18} className={isSending ? "opacity-50" : ""} />
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-gray-50 text-gray-400">
            <User size={64} className="mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-500">Your Messages</h3>
            <p className="text-sm">Select a user from the sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}