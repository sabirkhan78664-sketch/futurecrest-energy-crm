"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AddUserModal() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
  employee_id: "",
  username: "",
  full_name: "",
  email: "",
  password: "",
  role: "Agent",
  status: "Active",
});

  async function createUser() {
    setLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const result = await res.json();

    setLoading(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    alert(
`User Created Successfully

Employee ID : ${result.employee_id}
Username    : ${result.username}
Password    : ${result.password}`
);
router.push("/users");
router.refresh();
}

  return (
    <div className="mx-auto max-w-4xl">

      <div className="rounded-xl bg-white p-8 shadow">

        <div className="mb-8 flex items-center justify-between">

          <h2 className="text-2xl font-bold">
            Add New User
          </h2>

          <button
            onClick={() => history.back()}
            className="text-2xl"
          >
            ×
          </button>

        </div>

        <div className="grid grid-cols-2 gap-5">

          <input
            className="rounded-lg border p-3"
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
          />

          <input
            className="rounded-lg border p-3"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <input
  className="rounded-lg border bg-slate-100 p-3"
  placeholder="Employee ID"
  value={form.employee_id}
  readOnly
/>

<input
  className="rounded-lg border p-3"
  placeholder="Username"
  value={form.username}
  onChange={(e) =>
    setForm({
      ...form,
      username: e.target.value.toLowerCase(),
    })
  }
/>

          <select
            className="rounded-lg border p-3"
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value,
              })
            }
          >
            <option>Agent</option>
            <option>Closer</option>
            <option>Admin</option>
            <option>Channel Partner</option>
          </select>

          <input
  className="rounded-lg border bg-slate-100 p-3"
  value="Auto Generated"
  readOnly
/>

          <select
            className="rounded-lg border p-3"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value,
              })
            }
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>

        </div>

        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={() => history.back()}
            className="rounded-lg border px-6 py-3"
          >
            Cancel
          </button>

          <button
            onClick={createUser}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            {loading ? "Creating..." : "Create User"}
          </button>

        </div>

      </div>

    </div>
  );
}