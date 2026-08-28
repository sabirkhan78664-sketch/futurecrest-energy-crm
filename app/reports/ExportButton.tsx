"use client";

import { Download } from "lucide-react";

export default function ExportButton({ leads }: { leads: any[] }) {
  const exportToCSV = () => {
    if (leads.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Lead ID",
      "Customer Name",
      "Mobile",
      "Email",
      "Sales Status",
      "Approval Status",
      "Post-Sale QA",
      "Fuel Type",
      "Assigned Agent",
      "Assigned Closer",
      "Created At",
    ];

    const csvCell = (value: any) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = leads.map((l) => [
      csvCell(l.lead_id),
      csvCell(l.customer_name),
      csvCell(l.mobile),
      csvCell(l.email),
      csvCell(l.status),
      csvCell(l.approval_status),
      csvCell(
        l.status === "Sold" ? l.qa_status || "Not Audited" : "Not Required"
      ),
      csvCell(l.fuel_type),
      csvCell(l.assigned_agent),
      csvCell(l.assigned_closer),
      csvCell(
        l.created_at ? new Date(l.created_at).toLocaleString() : ""
      ),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `FutureCrest_Leads_Report_${new Date()
        .toISOString()
        .split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={exportToCSV}
      className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-3 text-white shadow-sm transition hover:bg-black"
    >
      <Download size={18} />
      Export Report
    </button>
  );
}
