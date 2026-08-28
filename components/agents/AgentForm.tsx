"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAgent } from "@/lib/agents";

interface Props {
  agent: any;
}

export default function AgentForm({ agent }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: agent.full_name || "",
    username: agent.username || "",
    email: agent.email || "",
    role: agent.role || "Agent",
    status: agent.status || "Active",
  });

  async function saveAgent() {
    try {
      setLoading(true);

      await updateAgent(agent.id, form);

      alert("Agent updated successfully.");

      router.push("/agents");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow">

      <h2 className="mb-8 text-2xl font-bold">
        Edit Agent
      </h2>

      <div className="grid grid-cols-2 gap-5">

        <div>
          <label className="mb-2 block text-sm font-medium">
            Employee ID
          </label>

          <input
            value={agent.employee_id}
            disabled
            className="w-full rounded-lg border bg-slate-100 p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Username
          </label>

          <input
            value={form.username}
            onChange={(e) =>
              setForm({
                ...form,
                username: e.target.value,
              })
            }
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Full Name
          </label>

          <input
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Role
          </label>

          <select
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value,
              })
            }
            className="w-full rounded-lg border p-3"
          >
            <option>Agent</option>
            <option>Closer</option>
            <option>Admin</option>
            <option>Channel Partner</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Status
          </label>

          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value,
              })
            }
            className="w-full rounded-lg border p-3"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

      </div>

      <div className="mt-8 flex justify-end gap-3">

        <button
          onClick={() => router.back()}
          className="rounded-lg border px-6 py-3"
        >
          Cancel
        </button>

        <button
          onClick={saveAgent}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

      </div>

    </div>
  );
}