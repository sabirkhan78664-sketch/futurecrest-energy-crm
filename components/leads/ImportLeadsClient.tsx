"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function parseCSV(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_")
  );

  return rows.slice(1).map((values) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = (values[i] || "").trim();
    });
    return obj;
  });
}

export default function ImportLeadsClient() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onFile = async (file: File) => {
    setFileName(file.name);
    setResult(null);
    const parsed = parseCSV(await file.text());

    if (!parsed.length) {
      alert("No CSV rows found.");
      setRows([]);
      return;
    }

    setRows(parsed);
  };

  const importRows = async () => {
    if (!rows.length) {
      alert("Choose a CSV file first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        alert(data.message || "Import failed.");
        return;
      }

      alert(data.message);
      router.refresh();
    } catch (error: any) {
      alert(error?.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  const columns = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import / Update Leads</h1>
        <p className="mt-1 text-slate-500">
          Super Admin only. Use this for your existing campaign data.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="font-bold text-blue-900">How it works</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-800">
          <li><strong>lead_id present</strong> → existing CRM lead is updated.</li>
          <li><strong>lead_id blank</strong> → a new CRM lead is created.</li>
          <li>Your existing duplicate model for new leads is not changed.</li>
          <li>Historical Sold records are kept as Sold / Not Audited.</li>
        </ul>

        <p className="mt-3 text-xs text-blue-700">
          Recommended columns: lead_id, customer_name, mobile, alternate_mobile,
          email, nmi, campaign, status, fuel_type, retailer, address, state,
          postcode, comments, assigned_agent, assigned_closer.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">
          Select CSV file
        </label>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
          className="mt-2 block w-full rounded-lg border border-slate-300 p-3"
        />

        {fileName && (
          <p className="mt-2 text-sm text-slate-600">
            <strong>{fileName}</strong> — {rows.length} rows
          </p>
        )}

        {rows.length > 0 && (
          <div className="mt-5 overflow-x-auto rounded-lg border">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-100">
                <tr>
                  {columns.map((key) => (
                    <th key={key} className="px-3 py-2 font-semibold">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t">
                    {columns.map((key) => (
                      <td key={key} className="px-3 py-2">
                        {row[key] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          type="button"
          onClick={importRows}
          disabled={loading || !rows.length}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Importing / Updating..." : "Import / Update Leads"}
        </button>
      </div>

      {result && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Import Result</h2>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs text-blue-700">Updated</p>
              <p className="text-2xl font-bold text-blue-800">
                {result.updated || 0}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-xs text-green-700">New Records</p>
              <p className="text-2xl font-bold text-green-800">
                {result.inserted || 0}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-xs text-red-700">Errors</p>
              <p className="text-2xl font-bold text-red-800">
                {(result.failedUpdates || 0) + (result.error ? 1 : 0)}
              </p>
            </div>
          </div>

          {result.updateErrors?.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4">
              <p className="font-bold text-red-900">Update errors</p>
              <div className="mt-2 space-y-1 text-sm text-red-800">
                {result.updateErrors.slice(0, 20).map((item: any) => (
                  <div key={item.lead_id}>
                    {item.lead_id}: {item.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
