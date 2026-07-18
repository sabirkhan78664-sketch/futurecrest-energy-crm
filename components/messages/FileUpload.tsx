"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  conversationId: number;
  senderId: string;
  onUploaded?: () => void;
}

export default function FileUpload({
  conversationId,
  senderId,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    setUploading(true);

    try {
      const fileName = `${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from("chat-files")
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("chat-files")
        .getPublicUrl(fileName);

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message: "",
        file_name: file.name,
        file_url: data.publicUrl,
      });

      onUploaded?.();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded border px-4 py-2"
      >
        {uploading ? "Uploading..." : "📎"}
      </button>

      <input
        ref={inputRef}
        hidden
        type="file"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            uploadFile(e.target.files[0]);
          }
        }}
      />
    </>
  );
}