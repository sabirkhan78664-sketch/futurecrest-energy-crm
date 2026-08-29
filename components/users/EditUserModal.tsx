"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  employee_id?: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  can_send_messages?: boolean;
  can_receive_messages?: boolean;
}

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditUserModal({
  open,
  user,
  onClose,
  onSaved,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [canSend, setCanSend] = useState(true);
  const [canReceive, setCanReceive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setFullName(user.full_name || "");
    setPhone(user.phone ?? "");
    setRole(user.role || "");
    setStatus(user.status || "Active");

    setCanSend(
      user.can_send_messages ?? true
    );

    setCanReceive(
      user.can_receive_messages ?? true
    );
  }, [user]);

  if (!open || !user) {
    return null;
  }

  async function handleSave() {
    if (!user) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName,
            phone,
            role,
            status,
            can_send_messages: canSend,
            can_receive_messages:
              canReceive,
          }),
        }
      );

      /*
       * SAFE JSON RESPONSE
       */
      const text = await res.text();

      let result: any = {};

      if (text.trim()) {
        try {
          result = JSON.parse(text);
        } catch {
          console.error(
            "❌ Invalid API response:",
            text
          );

          throw new Error(
            `Server returned invalid JSON: ${text.slice(
              0,
              300
            )}`
          );
        }
      }

      if (!res.ok) {
        throw new Error(
          result?.message ||
            `Request failed with status ${res.status}`
        );
      }

      if (!result.success) {
        throw new Error(
          result?.message ||
            "User update failed."
        );
      }

      alert(
        "User updated successfully."
      );

      onClose();
      onSaved();

    } catch (err: any) {
      console.error(
        "❌ User update error:",
        err
      );

      alert(
        err?.message ||
          "Something went wrong while updating the user."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Edit User
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update user profile and permissions.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>

        </div>

        <div className="space-y-4">

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-lg border border-slate-300 bg-gray-100 p-3 text-gray-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Phone
            </label>

            <input
              type="text"
              placeholder="Phone"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Role
            </label>

            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-600"
            >
              <option value="Super Admin">
                Super Admin
              </option>

              <option value="Admin">
                Admin
              </option>

              <option value="Agent">
                Agent
              </option>

              <option value="Closer">
                Closer
              </option>

              <option value="QA">
                QA
              </option>

              <option value="Channel Partner">
                Channel Partner
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-600"
            >
              <option value="Active">
                🟢 Active
              </option>

              <option value="Suspended">
                🟡 Suspended
              </option>

              <option value="Inactive">
                🔴 Inactive
              </option>
            </select>
          </div>

          {/* CHAT PERMISSIONS */}

          <div className="space-y-3 rounded-lg border border-slate-200 bg-gray-50 p-4">

            <h3 className="text-sm font-semibold text-gray-700">
              Chat Permissions
            </h3>

            <label className="flex cursor-pointer items-center gap-3">

              <input
                type="checkbox"
                checked={canSend}
                onChange={(e) =>
                  setCanSend(
                    e.target.checked
                  )
                }
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              <span className="text-sm font-medium text-gray-700">
                Allow user to send messages
              </span>

            </label>

            <label className="flex cursor-pointer items-center gap-3">

              <input
                type="checkbox"
                checked={canReceive}
                onChange={(e) =>
                  setCanReceive(
                    e.target.checked
                  )
                }
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              <span className="text-sm font-medium text-gray-700">
                Allow user to receive messages
              </span>

            </label>

          </div>

        </div>

        <div className="mt-6 flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg bg-gray-200 px-5 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </div>

    </div>
  );
}