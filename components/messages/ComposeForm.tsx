"use client";

import { useState } from "react";

interface User {
  id: string;
  employee_id: string | null;
  full_name: string;
  role: string;
}

interface Props {
  profile: any;
  users: User[];
}

export default function ComposeForm({ profile, users }: Props) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  function toggleUser(id: string) {
    setSelectedUsers((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow">

      <h1 className="text-3xl font-bold">
        Compose Message
      </h1>

      <p className="mt-2 text-gray-500">
        Logged in as {profile.full_name}
      </p>

      <hr className="my-6" />

      <h2 className="mb-4 text-lg font-semibold">
        Recipients ({selectedUsers.length})
      </h2>

      <div className="max-h-72 overflow-y-auto rounded-lg border">

        {users.map((user) => (

          <label
            key={user.id}
            className="flex cursor-pointer items-center gap-4 border-b p-4 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selectedUsers.includes(user.id)}
              onChange={() => toggleUser(user.id)}
            />

            <div>

              <div className="font-medium">
                {user.employee_id ?? "No ID"} • {user.full_name}
              </div>

              <div className="text-sm text-gray-500">
                {user.role}
              </div>

            </div>

          </label>

        ))}

      </div>

      <div className="mt-6">

        <label className="mb-2 block font-medium">
          Subject
        </label>

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Subject"
        />

      </div>

      <div className="mt-6">

        <label className="mb-2 block font-medium">
          Priority
        </label>

        <select className="w-full rounded-lg border p-3">
          <option>Normal</option>
          <option>High</option>
          <option>Urgent</option>
        </select>

      </div>

      <div className="mt-6">

        <label className="mb-2 block font-medium">
          Message
        </label>

        <textarea
          rows={8}
          className="w-full rounded-lg border p-3"
        />

      </div>

      <div className="mt-8 flex justify-end">

        <button
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Send Message
        </button>

      </div>

    </div>
  );
}