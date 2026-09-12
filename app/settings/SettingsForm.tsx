"use client";

import { useState } from "react";

interface Settings {
  company_name?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  website?: string | null;
  crm_name?: string | null;
  lead_prefix?: string | null;
}

interface Props {
  initialSettings: Settings | null;
}

export default function SettingsForm({ initialSettings }: Props) {
  const [companyName, setCompanyName] = useState(
    initialSettings?.company_name ?? ""
  );
  const [companyEmail, setCompanyEmail] = useState(
    initialSettings?.company_email ?? ""
  );
  const [companyPhone, setCompanyPhone] = useState(
    initialSettings?.company_phone ?? ""
  );
  const [website, setWebsite] = useState(initialSettings?.website ?? "");
  const [crmName, setCrmName] = useState(initialSettings?.crm_name ?? "");
  const [leadPrefix, setLeadPrefix] = useState(
    initialSettings?.lead_prefix ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          company_email: companyEmail,
          company_phone: companyPhone,
          website,
          crm_name: crmName,
          lead_prefix: leadPrefix,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage({
          type: "error",
          text: data.message || "Failed to save settings.",
        });
      } else {
        setMessage({ type: "success", text: "Settings saved." });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow">

      <div className="grid gap-6 md:grid-cols-2">

        <div>
          <label className="mb-2 block font-medium">
            Company Name
          </label>

          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Company Email
          </label>

          <input
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Phone
          </label>

          <input
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Website
          </label>

          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            CRM Name
          </label>

          <input
            value={crmName}
            onChange={(e) => setCrmName(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Lead Prefix
          </label>

          <input
            value={leadPrefix}
            onChange={(e) => setLeadPrefix(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

      </div>

      {message && (
        <p
          className={`mt-4 text-sm font-medium ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>

    </div>
  );
}
