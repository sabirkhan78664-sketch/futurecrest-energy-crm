"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      // Wait for session to be saved
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("SESSION:", session);

      if (!session) {
        alert("Login failed. No session found.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while logging in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">

        <h1 className="mb-2 text-center text-3xl font-bold">
          FutureCrest Energy CRM
        </h1>

        <p className="mb-8 text-center text-slate-500">
          Sign in with your account
        </p>

        <input
          type="email"
          placeholder="Email Address"
          className="mb-4 w-full rounded-lg border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="mb-6 w-full rounded-lg border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Signing In..." : "Login"}
        </button>

      </div>
    </div>
  );
}