"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export default function ResetPasswordModal({
  open,
  onClose,
  userId,
}: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const resetPassword = async () => {
    setLoading(true);

    const res = await fetch("/api/users/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: userId,
        password,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (data.success) {
      alert("Password reset successfully.");
      setPassword("");
      onClose();
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[400px]">
        <h2 className="text-xl font-semibold mb-4">Reset Password</h2>

        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={resetPassword}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Updating..." : "Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}