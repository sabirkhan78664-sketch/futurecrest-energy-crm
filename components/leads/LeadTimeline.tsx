"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Clock, Send, User } from "lucide-react";

interface Note {
  id: number;
  lead_id: number;
  user_name: string | null;
  content: string;
  created_at: string;
}

interface Props {
  leadId: number;
  initialNotes: Note[];
}

export default function LeadTimeline({ leadId, initialNotes }: Props) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function addNote() {
    if (!newNote.trim()) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("notes")
      .insert([
        {
          lead_id: leadId,
          content: newNote,
          user_name: "Current Agent", // We will hook this up to real users in Phase 15
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert("Error saving note: " + error.message);
      return;
    }

    // Instantly add the new note to the top of the list
    setNotes([data, ...notes]);
    setNewNote("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-gray-800">
        <Clock size={20} className="text-green-600" />
        Activity Timeline
      </div>

      {/* Add Note Input */}
      <div className="mb-8 flex gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <User size={20} />
        </div>
        <div className="flex-1">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Log a call, request a callback, or leave a note..."
            className="w-full resize-none rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={addNote}
              disabled={loading || !newNote.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add Note"}
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* The Timeline */}
      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        {notes.length === 0 ? (
          <p className="text-center text-gray-500">No notes or activity yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Timeline dot */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white bg-blue-100 text-blue-500 shadow md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <Clock size={16} />
              </div>
              
              {/* Note Content */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-lg border bg-slate-50 p-4 shadow-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{note.user_name || "Agent"}</span>
                  <span className="text-xs font-medium text-gray-500">
                    {new Intl.DateTimeFormat("en-AU", {
                      day: "2-digit",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    }).format(new Date(note.created_at))}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}