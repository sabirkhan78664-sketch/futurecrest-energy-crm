"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRole =
  | "Agent"
  | "Closer"
  | "QA"
  | "Admin"
  | "Super Admin"
  | "Channel Partner";

interface CreatedCredentials {
  employee_id?: string;
  username?: string;
  email?: string;
  password?: string;
}

function generateTemporaryPassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

  const special = "!@#$%^&*";

  let password = "";

  for (let i = 0; i < 10; i++) {
    password +=
      chars[
        Math.floor(
          Math.random() * chars.length
        )
      ];
  }

  password +=
    special[
      Math.floor(
        Math.random() * special.length
      )
    ];

  password +=
    Math.floor(
      Math.random() * 10
    );

  return password;
}

export default function UserForm() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [showCredentials, setShowCredentials] =
    useState(false);

  const [credentials, setCredentials] =
    useState<CreatedCredentials | null>(
      null
    );

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "Agent" as UserRole,
    status: "Active",
    can_send_messages: true,
    can_receive_messages: true,
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const target = e.target;

    const name = target.name;

    const value =
      target.type === "checkbox"
        ? (
            target as HTMLInputElement
          ).checked
        : target.value;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!form.full_name.trim()) {
      alert(
        "Please enter the user's full name."
      );
      return;
    }

    if (!form.email.trim()) {
      alert(
        "Please enter the company email."
      );
      return;
    }

    setLoading(true);
    setShowCredentials(false);
    setCredentials(null);

    const temporaryPassword =
      generateTemporaryPassword();

    try {
      const res = await fetch(
        "/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...form,
            temporary_password:
              temporaryPassword,
          }),
        }
      );

      /*
       * SAFE JSON READER
       * Prevents:
       * Unexpected end of JSON input
       */
      const text =
        await res.text();

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
            result?.error?.message ||
            `User creation failed. HTTP ${res.status}`
        );
      }

      if (!result.success) {
        throw new Error(
          result?.message ||
            "Failed to create user."
        );
      }

      const newCredentials:
        CreatedCredentials = {
        employee_id:
          result.employee_id,

        username:
          result.username,

        email:
          result.email ||
          form.email,

        password:
          result.password ||
          temporaryPassword,
      };

      setCredentials(
        newCredentials
      );

      setShowCredentials(true);

      alert(
        "✅ User created successfully."
      );

    } catch (err: any) {
      console.error(
        "❌ CREATE USER ERROR:",
        err
      );

      alert(
        err?.message ||
          "Something went wrong while creating the user."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyCredentials() {
    if (!credentials) {
      return;
    }

    const text = [
      `Employee ID: ${
        credentials.employee_id ||
        "-"
      }`,
      `Username: ${
        credentials.username ||
        "-"
      }`,
      `Email: ${
        credentials.email ||
        "-"
      }`,
      `Temporary Password: ${
        credentials.password ||
        "-"
      }`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(
        text
      );

      alert(
        "Credentials copied."
      );
    } catch {
      alert(
        "Unable to copy automatically. Please copy them manually."
      );
    }
  }

  function goToUsers() {
    router.push("/users");
    router.refresh();
  }

  return (
    <div className="space-y-6">

      {/* ==========================================
          CREATE USER FORM
      ========================================== */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >

        {/* FULL NAME */}

        <div>
          <label className="font-medium text-slate-700">
            Full Name
          </label>

          <input
            required
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Enter full name"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* EMAIL */}

        <div>
          <label className="font-medium text-slate-700">
            Company Email
          </label>

          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@futurecrest.com"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />

          <p className="mt-1 text-xs text-slate-500">
            This email will be used for CRM login.
          </p>
        </div>

        {/* PHONE */}

        <div>
          <label className="font-medium text-slate-700">
            Phone
          </label>

          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone number"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* ROLE */}

        <div>
          <label className="font-medium text-slate-700">
            Role
          </label>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="Agent">
              Agent
            </option>

            <option value="Closer">
              Closer
            </option>

            <option value="QA">
              QA
            </option>

            <option value="Admin">
              Admin
            </option>

            <option value="Super Admin">
              Super Admin
            </option>

            <option value="Channel Partner">
              Channel Partner
            </option>
          </select>
        </div>

        {form.role === "Channel Partner" && (
          <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            A unique lead submission link will be generated for this partner
            automatically after they're created — you'll find it on their
            dashboard.
          </p>
        )}

        {/* STATUS */}

        <div>
          <label className="font-medium text-slate-700">
            Status
          </label>

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="Active">
              🟢 Active
            </option>

            <option value="Inactive">
              🔴 Inactive
            </option>

            <option value="Suspended">
              🟡 Suspended
            </option>
          </select>
        </div>

        {/* CHAT PERMISSIONS */}

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

          <h3 className="text-sm font-semibold text-slate-700">
            Chat Permissions
          </h3>

          <label className="flex cursor-pointer items-center gap-3">

            <input
              type="checkbox"
              name="can_send_messages"
              checked={
                form.can_send_messages
              }
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />

            <span className="text-sm font-medium text-gray-700">
              Allow user to send messages
            </span>

          </label>

          <label className="flex cursor-pointer items-center gap-3">

            <input
              type="checkbox"
              name="can_receive_messages"
              checked={
                form.can_receive_messages
              }
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />

            <span className="text-sm font-medium text-gray-700">
              Allow user to receive messages
            </span>

          </label>

        </div>

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Creating User..."
            : "Create User"}
        </button>

      </form>

      {/* ==========================================
          GENERATED CREDENTIALS
      ========================================== */}

      {showCredentials &&
        credentials && (
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6">

            <div className="mb-5">

              <h2 className="text-xl font-bold text-green-800">
                ✅ User Created Successfully
              </h2>

              <p className="mt-1 text-sm text-green-700">
                Save these login credentials before leaving this page.
              </p>

            </div>

            <div className="space-y-3 rounded-xl bg-white p-5 shadow-sm">

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Employee ID
                </p>

                <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                  {credentials.employee_id ||
                    "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Username
                </p>

                <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                  {credentials.username ||
                    "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Email
                </p>

                <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                  {credentials.email ||
                    "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Temporary Password
                </p>

                <p className="mt-1 rounded-lg bg-slate-100 p-3 font-mono text-lg font-bold text-slate-900">
                  {credentials.password ||
                    "-"}
                </p>
              </div>

            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={copyCredentials}
                className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
              >
                📋 Copy Credentials
              </button>

              <button
                type="button"
                onClick={goToUsers}
                className="rounded-lg bg-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Go to Users
              </button>

            </div>

          </div>
        )}

    </div>
  );
}