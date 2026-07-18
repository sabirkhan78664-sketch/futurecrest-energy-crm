"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setFullName(user.full_name);
    setPhone(user.phone ?? "");
    setRole(user.role);
    setStatus(user.status);
  }, [user]);

  if (!open || !user) return null;

  async function handleSave() {
  if (!user) return;

  // Create a non-null local variable
  const currentUser = user;

  try {
    setLoading(true);

    const res = await fetch(`/api/users/${currentUser.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: fullName,
        phone,
        role,
        status,
      }),
    });

    const result = await res.json();

    if (!result.success) {
      alert(result.message);
      return;
    }

    alert("User updated successfully.");
    onSaved();
    onClose();

  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

        <h2 className="mb-6 text-2xl font-bold">
          Edit User
        </h2>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <input
            type="email"
            value={user.email}
            disabled
            className="w-full rounded-lg border bg-gray-100 p-3"
          />

          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option>Super Admin</option>
            <option>Admin</option>
            <option>Agent</option>
            <option>Closer</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>

        </div>

        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-5 py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

        </div>
      </div>
    </div>
  );
}