"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const router = useRouter();

  // Supabase's client SDK reads the recovery token out of the URL fragment
  // and establishes a temporary "recovery" session automatically when this
  // page loads from the email link. No session means the link was opened
  // directly, is invalid, or has expired.
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
      setCheckingSession(false);
    }

    checkSession();
  }, []);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters.", type: "error" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMessage({ text: error.message, type: "error" });
      return;
    }

    setMessage({ text: "Password updated successfully! Redirecting to login...", type: "success" });
    setSuccess(true);

    await supabase.auth.signOut();

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">FutureCrest CRM</h1>
          <p className="text-sm text-slate-500">Set a new password</p>
        </div>

        {message && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message.text}
          </div>
        )}

        {checkingSession && (
          <p className="text-center text-sm text-slate-500">Checking reset link...</p>
        )}

        {!checkingSession && !hasSession && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
            This password reset link is invalid or has expired. Please request a new one from the login page.
          </div>
        )}

        {!checkingSession && hasSession && !success && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">New Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
