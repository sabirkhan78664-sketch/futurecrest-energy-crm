"use client";

import { useState } from "react";
import EditUserModal from "./EditUserModal";
import ResetPasswordModal from "./ResetPasswordModal";

interface User {
  id: string;
  employee_id?: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
}

interface UserTableProps {
  users: User[];
}

export default function UserTable({ users }: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  function handleEdit(user: User) {
    setSelectedUser(user);
    setOpen(true);
  }

  function handleResetPassword(user: User) {
    setSelectedUser(user);
    setResetOpen(true);
  }

  function handleSaved() {
    window.location.reload();
  }

  async function handleDelete(user: User) {
    const confirmed = window.confirm(
      `Delete ${user.full_name || "this user"}? This permanently removes their account and cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert("User deleted successfully.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  }

  async function updateStatus(user: User, status: string) {
    try {
      const res = await fetch("/api/users/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          status,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert(`User status changed to ${status}.`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-white shadow">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-5 py-4 text-left">Employee ID</th>
              <th className="px-5 py-4 text-left">Name</th>
              <th className="px-5 py-4 text-left">Email</th>
              <th className="px-5 py-4 text-center">Role</th>
              <th className="px-5 py-4 text-center">Status</th>
              <th className="px-5 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-slate-500"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-mono">
                    {user.employee_id ?? "-"}
                  </td>

                  <td className="px-5 py-4">{user.full_name}</td>

                  <td className="px-5 py-4">{user.email}</td>

                  <td className="px-5 py-4 text-center">
                    <span className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700">
                      {user.role}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : user.status === "Suspended"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleResetPassword(user)}
                        className="rounded-lg bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600"
                      >
                        Reset Password
                      </button>

                      <button
                        onClick={() => handleDelete(user)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                      >
                        Delete
                      </button>

                      <select
                        value={user.status}
                        onChange={(e) =>
                          updateStatus(user, e.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
                      >
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EditUserModal
        open={open}
        user={selectedUser}
        onClose={() => setOpen(false)}
        onSaved={handleSaved}
      />

      <ResetPasswordModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        userId={selectedUser?.id || ""}
      />
    </>
  );
}