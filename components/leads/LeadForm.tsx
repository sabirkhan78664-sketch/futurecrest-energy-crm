"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface LeadFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function LeadForm({
  initialData,
  isEdit = false,
}: LeadFormProps) {
  const router = useRouter();

  const [customerName, setCustomerName] = useState(
    initialData?.customer_name || ""
  );
  const [mobile, setMobile] = useState(
    initialData?.mobile || ""
  );
  const [nmi, setNmi] = useState(
    initialData?.nmi || ""
  );
  const [currentRetailer, setCurrentRetailer] = useState(
    initialData?.current_retailer || ""
  );
  const [offeredRetailer, setOfferedRetailer] = useState(
    initialData?.offered_retailer || ""
  );
  const [campaign, setCampaign] = useState(
    initialData?.campaign || ""
  );
  const [status, setStatus] = useState(
    initialData?.status || "New"
  );
  const [assignedAgent, setAssignedAgent] = useState(
    initialData?.assigned_agent || ""
  );
const [assignedCloser, setAssignedCloser] = useState(
  initialData?.assigned_closer || ""
);

const [closers, setClosers] = useState<any[]>([]);
  // New state variables for callbacks
  const [callbackDate, setCallbackDate] = useState(
    initialData?.callback_date || ""
  );
  const [callbackTime, setCallbackTime] = useState(
    initialData?.callback_time || ""
  );

  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  async function loadUsers() {
    const { data: agentData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "Agent")
      .eq("status", "Active")
      .order("full_name");

    const { data: closerData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "Closer")
      .eq("status", "Active")
      .order("full_name");

    setAgents(agentData || []);
    setClosers(closerData || []);
  }

  loadUsers();
}, []);

  async function saveLead() {
    if (!customerName || !mobile) {
      alert("Please fill in at least the Customer Name and Mobile.");
      return;
    }

    // Require date and time if status is Callback
    if (status === "Callback" && (!callbackDate || !callbackTime)) {
      alert("Please select a Callback Date and Time.");
      return;
    }

    setLoading(true);
    let error;

    // Clean up callback data if status is not Callback anymore
    const finalCallbackDate = status === "Callback" ? callbackDate : null;
    const finalCallbackTime = status === "Callback" ? callbackTime : null;

    if (isEdit) {
      const result = await supabase
        .from("leads")
        .update({
          customer_name: customerName,
          mobile,
          nmi,
          current_retailer: currentRetailer,
          offered_retailer: offeredRetailer,
          campaign,
          status,
          assigned_closer: assignedCloser,
          assigned_agent: assignedAgent,
          callback_date: finalCallbackDate,
          callback_time: finalCallbackTime,
        })
        .eq("id", initialData.id);

      error = result.error;
    } else {
      const leadId = `FCE-${Date.now()}`;

      const result = await supabase
        .from("leads")
        .insert([
          {
            lead_id: leadId,
            customer_name: customerName,
            mobile,
            nmi,
            current_retailer: currentRetailer,
            offered_retailer: offeredRetailer,
            campaign,
            status,
            assigned_closer: assignedCloser,
            assigned_agent: assignedAgent,
            callback_date: finalCallbackDate,
            callback_time: finalCallbackTime,
          },
        ]);

      error = result.error;
    }

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(isEdit ? "Lead Updated Successfully" : "Lead Saved Successfully");
    router.push("/leads");
  }

  return (
    <div className="rounded-xl border bg-white p-8 shadow">
      <h2 className="mb-8 text-3xl font-bold">
        {isEdit ? "Edit Lead" : "New Lead"}
      </h2>

      {/* Customer Information */}
      <div className="mb-8">
        <h3 className="mb-4 border-b pb-2 text-xl font-semibold">
          Customer Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="mb-2 block font-semibold">Customer Name</label>
            <input
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold">Mobile Number</label>
            <input
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold">NMI</label>
            <input
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              value={nmi}
              onChange={(e) => setNmi(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Energy Information */}
      <div className="mb-8">
        <h3 className="mb-4 border-b pb-2 text-xl font-semibold">
          Energy Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="mb-2 block font-semibold">Current Retailer</label>
            <input
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              value={currentRetailer}
              onChange={(e) => setCurrentRetailer(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold">Offered Retailer</label>
            <input
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              value={offeredRetailer}
              onChange={(e) => setOfferedRetailer(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold">Campaign</label>
            <input
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Assignment & Status */}
      <div className="mb-8">
        <h3 className="mb-4 border-b pb-2 text-xl font-semibold">
          Assignment & Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="mb-2 block font-semibold">Assigned Agent</label>
            <select
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              value={assignedAgent}
              onChange={(e) => setAssignedAgent(e.target.value)}
            >
              <option value="">Select Agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
  {agent.full_name}
</option>
              ))}
            </select>
          </div>
          <div>
  <label className="mb-2 block font-semibold">
    Assigned Closer
  </label>

  <select
    className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
    value={assignedCloser}
    onChange={(e) => setAssignedCloser(e.target.value)}
  >
    <option value="">Select Closer</option>

    {closers.map((closer) => (
      <option key={closer.id} value={closer.id}>
        {closer.full_name}
      </option>
    ))}
  </select>
</div>

          <div>
            <label className="mb-2 block font-semibold">Lead Status</label>
            <select
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="New">New</option>
              <option value="Attempt 1">Attempt 1</option>
              <option value="Attempt 2">Attempt 2</option>
              <option value="Callback">Callback</option>
              <option value="Interested">Interested</option>
              <option value="Documents Pending">Documents Pending</option>
              <option value="Verification">Verification</option>
              <option value="Sale">Sale</option>
              <option value="No Answer">No Answer</option>
              <option value="Wrong Number">Wrong Number</option>
              <option value="DNCR">DNCR</option>
              <option value="Rejected">Rejected</option>
              <option value="Lost">Lost</option>
              <option value="Duplicate">Duplicate</option>
            </select>
          </div>

          {/* Conditional Callback Fields - Only show if status is "Callback" */}
          {status === "Callback" && (
            <>
              <div>
                <label className="mb-2 block font-semibold text-blue-700">
                  Callback Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border-2 border-blue-200 bg-blue-50 p-3 outline-none focus:border-blue-500"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-blue-700">
                  Callback Time
                </label>
                <input
                  type="time"
                  className="w-full rounded-lg border-2 border-blue-200 bg-blue-50 p-3 outline-none focus:border-blue-500"
                  value={callbackTime}
                  onChange={(e) => setCallbackTime(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveLead}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {loading ? "Saving..." : isEdit ? "Update Lead" : "Save Lead"}
        </button>
      </div>
    </div>
  );
}