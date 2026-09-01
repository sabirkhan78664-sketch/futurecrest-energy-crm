"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";

import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  PhoneCall,
  PhoneMissed,
  ThumbsDown,
  ShieldOff,
  XCircle,
  Save,
  Loader2,
  AlertCircle,
  ClipboardList,
  UserCheck,
} from "lucide-react";

interface Lead {
  id: number;
  lead_id: string | null;

  title: string | null;
  customer_type: string | null;
  customer_name: string | null;
  mobile: string | null;
  alternate_mobile: string | null;
  email: string | null;
  dob: string | null;

  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;

  fuel_type: string | null;
  campaign: string | null;
  current_retailer: string | null;
  offered_retailer: string | null;
  nmi: string | null;
  mirn: string | null;

  dncr: string | null;
  dncr_number: string | null;
  cl_id: string | null;
  channel_name: string | null;

  solar: boolean | null;
  concession: boolean | null;
  life_support: boolean | null;

  status: string | null;
  approval_status: string | null;
  assignment_status: string | null;
  qa_status: string | null;

  assigned_agent: string | null;
  assigned_closer: string | null;
  assigned_at: string | null;
  creator?: { id: string; employee_id: string | null; full_name: string | null; username: string | null } | null;
  agent?: { id: string; employee_id: string | null; full_name: string | null; username: string | null } | null;
  closer?: { id: string; employee_id: string | null; full_name: string | null; username: string | null } | null;

  comments: string | null;

  callback_date: string | null;
  callback_time: string | null;
  closed_at: string | null;

  nbn_retailer: string | null;
  nbn_provider: string | null;
  offered_nbn_retailer: string | null;
  avc_no: string | null;
  paying: string | null;
  home_owner: string | null;
  nbn_lt_booking: string | null;

  phi_first_name: string | null;
  phi_last_name: string | null;
  phi_current_fund: string | null;
  phi_status: string | null;
  phi_booked_by: string | null;
  phi_booked_date: string | null;
  phi_booked_time: string | null;
  phi_agent_note: string | null;
  phi_advisor_feedback: string | null;
  phi_outcome: string | null;
  phi_lt_booking: string | null;
}

type Outcome =
  | "Sold"
  | "Not Interested"
  | "No Answer"
  | "Callback"
  | "Lost"
  | "Internal DNC"
  | "";

export default function CloserProcessLeadPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params.id);

  const [lead, setLead] = useState<Lead | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Closer can edit customer/lead fields on leads assigned to them —
  // enforced server-side by /api/leads/[id]/edit.
  const editing = true;

  const [savingEdits, setSavingEdits] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [outcome, setOutcome] = useState<Outcome>("");

  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTime, setCallbackTime] = useState("");

  const [closerComments, setCloserComments] = useState("");

  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    loadLead();
  }, [id]);

  async function loadLead() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/closer/sales/${id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load lead."
        );
      }

      if (!data.lead) {
        throw new Error("Lead not found.");
      }

      setLead(data.lead);
      setForm(createEditableForm(data.lead));

      if (data.lead.callback_date) {
        setCallbackDate(data.lead.callback_date);
      }

      if (data.lead.callback_time) {
        setCallbackTime(data.lead.callback_time);
      }

      setCloserComments(data.lead.comments || "");
    } catch (err: any) {
      console.error("Load lead error:", err);

      setError(
        err?.message || "Unable to load lead."
      );
    } finally {
      setLoading(false);
    }
  }

  function createEditableForm(leadData: Lead) {
    return {
      title: leadData.title || "",
      customer_type: leadData.customer_type || "",
      customer_name: leadData.customer_name || "",
      mobile: leadData.mobile || "",
      alternate_mobile:
        leadData.alternate_mobile || "",
      email: leadData.email || "",

      dob: leadData.dob || "",

      address: leadData.address || "",
      suburb: leadData.suburb || "",
      state: leadData.state || "",
      postcode: leadData.postcode || "",

      fuel_type: leadData.fuel_type || "",

      current_retailer:
        leadData.current_retailer || "",

      offered_retailer:
        leadData.offered_retailer || "",

      nmi: leadData.nmi || "",

      mirn: leadData.mirn || "",

      campaign: leadData.campaign || "",

      dncr: leadData.dncr || "",

      dncr_number:
        leadData.dncr_number || "",

      cl_id: leadData.cl_id || "",

      channel_name: leadData.channel_name || "",

      solar: leadData.solar ?? false,

      concession:
        leadData.concession ?? false,

      life_support:
        leadData.life_support ?? false,

      nbn_retailer:
        leadData.nbn_retailer || "",

      nbn_provider:
        leadData.nbn_provider || "",

      offered_nbn_retailer:
        leadData.offered_nbn_retailer || "",

      avc_no: leadData.avc_no || "",

      paying: leadData.paying || "",

      home_owner:
        leadData.home_owner || "",

      nbn_lt_booking:
        leadData.nbn_lt_booking || "",

      phi_first_name:
        leadData.phi_first_name || "",

      phi_last_name:
        leadData.phi_last_name || "",

      phi_current_fund:
        leadData.phi_current_fund || "",

      phi_status:
        leadData.phi_status || "",

      phi_booked_by:
        leadData.phi_booked_by || "",

      phi_booked_date:
        leadData.phi_booked_date || "",

      phi_booked_time:
        leadData.phi_booked_time || "",

      phi_agent_note:
        leadData.phi_agent_note || "",

      phi_advisor_feedback:
        leadData.phi_advisor_feedback || "",

      phi_outcome:
        leadData.phi_outcome || "",

      phi_lt_booking:
        leadData.phi_lt_booking || "",

      comments:
        leadData.comments || "",
    };
  }

  function updateField(
    field: string,
    value: any
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function saveLeadEdits() {
    if (!lead) return;

    try {
      setSavingEdits(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/leads/${lead.id}/edit`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save changes."
        );
      }

      setLead(data.lead);
      setForm(createEditableForm(data.lead));

      setSuccess("Lead details saved.");
    } catch (err) {
      console.error(
        "Save lead edits error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save changes."
      );
    } finally {
      setSavingEdits(false);
    }
  }

  async function submitOutcome() {
    if (!lead) return;

    if (!outcome) {
      alert(
        "Please select an outcome."
      );
      return;
    }

    if (outcome === "Callback") {
      if (!callbackDate) {
        alert(
          "Please select callback date."
        );
        return;
      }

      if (!callbackTime) {
        alert(
          "Please select callback time."
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      /*
       * When Sold is selected, save:
       * Final Retailer
       * Fuel Type
       * Campaign
       *
       * Final Retailer is stored in the existing
       * offered_retailer database column.
       */

      const response = await fetch(
        `/api/closer/sales/${lead.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "outcome",

            outcome,

            callback_date:
              outcome === "Callback"
                ? callbackDate
                : null,

            callback_time:
              outcome === "Callback"
                ? callbackTime
                : null,

            comments: closerComments,

            cl_id: form.cl_id?.trim() || null,

            channel_name:
              form.channel_name?.trim() ||
              null,

            ...(outcome === "Sold"
              ? {
                  offered_retailer:
                    form.offered_retailer
                      ?.trim() || null,

                  fuel_type:
                    form.fuel_type
                      ?.trim() || null,

                  campaign:
                    form.campaign
                      ?.trim() || null,
                }
              : {}),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit outcome."
        );
      }

      setLead(data.lead);

      setSuccess(
        `Lead successfully marked as ${outcome}.`
      );

      setOutcome("");

      if (outcome !== "Callback") {
        setCallbackDate("");
        setCallbackTime("");
      }

      setTimeout(() => {
        router.push("/closer/sales");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error(
        "Submit outcome error:",
        err
      );

      setError(
        err?.message ||
          "Unable to submit outcome."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
          <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-5 shadow">
            <Loader2
              size={24}
              className="animate-spin text-blue-600"
            />

            <span className="font-medium text-slate-700">
              Loading lead...
            </span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error && !lead) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-3 text-red-600">
                  <AlertCircle size={26} />
                </div>

                <h1 className="text-2xl font-bold text-red-700">
                  Unable to load lead
                </h1>
              </div>

              <p className="mb-6 text-slate-600">
                {error}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={loadLead}
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Try Again
                </button>

                <Link
                  href="/closer/sales"
                  className="rounded-lg bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Back to Assigned Leads
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!lead) return null;

  const isClosed =
    lead.status === "Sold" ||
    lead.status === "Lost";

  const campaign =
    String(form.campaign || lead.campaign || "")
      .trim()
      .toUpperCase();

  const isEnergy =
    campaign === "ENERGY";

  const isNBN =
    campaign === "NBN";

  const isPHI =
    campaign === "PHI";

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-[1500px]">

          {/* BACK */}

          <div className="mb-4">
            <Link
              href="/closer/sales"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={17} />

              Back to Assigned Leads
            </Link>
          </div>

          {/* HEADER */}

          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Process Lead
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Review, edit and process this assigned lead.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">

              <div className="grid grid-cols-2 gap-8">

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Lead ID
                  </p>

                  <p className="mt-1 font-bold text-blue-600">
                    {lead.lead_id ||
                      `#${lead.id}`}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Assigned On
                  </p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {formatDateTime(
                      lead.assigned_at
                    )}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* ALERTS */}

          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle size={20} />

              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 font-semibold text-green-700">
              <CheckCircle size={20} />

              <span>{success}</span>
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">

            {/* =====================================================
                LEFT
            ====================================================== */}

            <div className="space-y-5">

              {/* CUSTOMER */}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center justify-between">

                  <SectionHeader
                    icon={<User size={21} />}
                    iconClass="bg-blue-100 text-blue-600"
                    title="Customer Information"
                  />


                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <EditableField
                    label="Title"
                    value={form.title}
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "title",
                        v
                      )
                    }
                  />

                  <EditableField
                    label="Customer Type"
                    value={form.customer_type}
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "customer_type",
                        v
                      )
                    }
                  />

                  <EditableField
                    label="Customer Name"
                    value={
                      form.customer_name
                    }
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "customer_name",
                        v
                      )
                    }
                  />

                  <EditableField
                    label="Date of Birth"
                    type="date"
                    value={form.dob}
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "dob",
                        v
                      )
                    }
                  />

                  <EditableField
                    label="Mobile"
                    value={form.mobile}
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "mobile",
                        v
                      )
                    }
                    icon={<Phone size={15} />}
                  />

                  <EditableField
                    label="Alternate Mobile"
                    value={
                      form.alternate_mobile
                    }
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "alternate_mobile",
                        v
                      )
                    }
                  />

                  <EditableField
                    label="Email"
                    value={form.email}
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "email",
                        v
                      )
                    }
                    icon={<Mail size={15} />}
                  />

                  <EditableField
                    label="Suburb"
                    value={form.suburb}
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "suburb",
                        v
                      )
                    }
                  />

                  <EditableField
                    label="State"
                    value={form.state}
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "state",
                        v
                      )
                    }
                  />

                  <EditableField
                    label="Postcode"
                    value={form.postcode}
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "postcode",
                        v
                      )
                    }
                  />

                </div>

                <div className="mt-5">

                  <EditableField
                    label="Address"
                    value={form.address}
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "address",
                        v
                      )
                    }
                    icon={
                      <MapPin size={15} />
                    }
                  />

                </div>

              </section>

              {/* LEAD INFORMATION */}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <SectionHeader
                  icon={
                    <ClipboardList
                      size={21}
                    />
                  }
                  iconClass="bg-emerald-100 text-emerald-600"
                  title="Lead Information"
                />

                {/* ENERGY */}

                {isEnergy && (
                  <div className="mt-5 space-y-5">

                    <div className="grid gap-5 sm:grid-cols-2">

                      <EditableField
                        label="Fuel Type"
                        value={
                          form.fuel_type
                        }
                        editing={editing}
                        onChange={(v) =>
                          updateField(
                            "fuel_type",
                            v
                          )
                        }
                      />

                      <EditableField
                        label="Current Retailer"
                        value={
                          form.current_retailer
                        }
                        editing={editing}
                        onChange={(v) =>
                          updateField(
                            "current_retailer",
                            v
                          )
                        }
                      />

                      <EditableField
                        label="Offered Retailer"
                        value={
                          form.offered_retailer
                        }
                        editing={editing}
                        onChange={(v) =>
                          updateField(
                            "offered_retailer",
                            v
                          )
                        }
                      />

                      <EditableField
                        label="NMI"
                        value={
                          form.nmi
                        }
                        editing={editing}
                        onChange={(v) =>
                          updateField(
                            "nmi",
                            v
                          )
                        }
                      />

                      <EditableField
                        label="MIRN"
                        value={
                          form.mirn
                        }
                        editing={editing}
                        onChange={(v) =>
                          updateField(
                            "mirn",
                            v
                          )
                        }
                      />

                      <EditableField
                        label="DNCR Number"
                        value={
                          form.dncr_number
                        }
                        editing={editing}
                        onChange={(v) =>
                          updateField(
                            "dncr_number",
                            v
                          )
                        }
                      />

                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">

                      <BooleanEditor
                        label="Solar"
                        value={form.solar}
                        editing={editing}
                        onChange={(v) =>
                          updateField(
                            "solar",
                            v
                          )
                        }
                      />

                      <BooleanEditor
                        label="Concession"
                        value={
                          form.concession
                        }
                        editing={editing}
                        onChange={(v) =>
                          updateField(
                            "concession",
                            v
                          )
                        }
                      />

                      <BooleanEditor
                        label="Life Support"
                        value={
                          form.life_support
                        }
                        editing={editing}
                        onChange={(v) =>
                          updateField(
                            "life_support",
                            v
                          )
                        }
                      />

                    </div>

                  </div>
                )}

                {/* NBN */}

                {isNBN && (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">

                    <EditableField
                      label="NBN Provider"
                      value={
                        form.nbn_provider
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "nbn_provider",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="Offered NBN Retailer"
                      value={
                        form.offered_nbn_retailer
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "offered_nbn_retailer",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="AVC No"
                      value={form.avc_no}
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "avc_no",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="NBN Retailer"
                      value={
                        form.nbn_retailer
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "nbn_retailer",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="DNCR Number"
                      value={
                        form.dncr_number
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "dncr_number",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="CL ID"
                      value={form.cl_id}
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "cl_id",
                          v
                        )
                      }
                    />

                    <SelectField
                      label="Paying"
                      value={form.paying}
                      editing={editing}
                      options={[
                        "Yes",
                        "No",
                      ]}
                      onChange={(v) =>
                        updateField(
                          "paying",
                          v
                        )
                      }
                    />

                    <SelectField
                      label="Home Owner"
                      value={
                        form.home_owner
                      }
                      editing={editing}
                      options={[
                        "Yes",
                        "No",
                      ]}
                      onChange={(v) =>
                        updateField(
                          "home_owner",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="LT / Booking"
                      value={
                        form.nbn_lt_booking
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "nbn_lt_booking",
                          v
                        )
                      }
                    />

                  </div>
                )}

                {/* PHI */}

                {isPHI && (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">

                    <EditableField
                      label="First Name"
                      value={
                        form.phi_first_name
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "phi_first_name",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="Last Name"
                      value={
                        form.phi_last_name
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "phi_last_name",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="Current Fund"
                      value={
                        form.phi_current_fund
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "phi_current_fund",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="PHI Status"
                      value={
                        form.phi_status
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "phi_status",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="Booked By"
                      value={
                        form.phi_booked_by
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "phi_booked_by",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="Booked Date"
                      type="date"
                      value={
                        form.phi_booked_date
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "phi_booked_date",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="Booked Time"
                      type="time"
                      value={
                        form.phi_booked_time
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "phi_booked_time",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="Outcome"
                      value={
                        form.phi_outcome
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "phi_outcome",
                          v
                        )
                      }
                    />

                    <EditableField
                      label="LT / Booking"
                      value={
                        form.phi_lt_booking
                      }
                      editing={editing}
                      onChange={(v) =>
                        updateField(
                          "phi_lt_booking",
                          v
                        )
                      }
                    />

                    <div className="sm:col-span-2">

                      <TextAreaField
                        label="Agent Note"
                        value={
                          form.phi_agent_note
                        }
                        editing={editing}
                        onChange={(v) =>
                          updateField(
                            "phi_agent_note",
                            v
                          )
                        }
                      />

                    </div>

                    <div className="sm:col-span-2">

                      <TextAreaField
                        label="Advisor Feedback"
                        value={
                          form.phi_advisor_feedback
                        }
                        editing={editing}
                        onChange={(v) =>
                          updateField(
                            "phi_advisor_feedback",
                            v
                          )
                        }
                      />

                    </div>

                  </div>
                )}

                {!isEnergy &&
                  !isNBN &&
                  !isPHI && (
                    <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
                      No campaign-specific fields available.
                    </div>
                  )}

                {/* COMMENTS */}

                <div className="mt-6 border-t border-slate-100 pt-5">

                  <TextAreaField
                    label="Lead Comments"
                    value={form.comments}
                    editing={editing}
                    onChange={(v) =>
                      updateField(
                        "comments",
                        v
                      )
                    }
                  />

                </div>

                <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">

                  <button
                    type="button"
                    onClick={saveLeadEdits}
                    disabled={savingEdits}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingEdits ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Lead Details
                      </>
                    )}
                  </button>

                </div>

              </section>

              {/* ASSIGNMENT */}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <SectionHeader
                  icon={
                    <UserCheck
                      size={21}
                    />
                  }
                  iconClass="bg-orange-100 text-orange-600"
                  title="Assignment Information"
                />

                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">

                  <Info
                    label="Assigned Agent"
                    value={
                      lead.agent?.full_name
                        ? `${lead.agent.full_name}${lead.agent.employee_id ? ` (${lead.agent.employee_id})` : ""}`
                        : lead.assigned_agent
                    }
                  />

                  <Info
                    label="Assigned Closer"
                    value={
                      lead.closer?.full_name
                        ? `${lead.closer.full_name}${lead.closer.employee_id ? ` (${lead.closer.employee_id})` : ""}`
                        : lead.assigned_closer
                    }
                  />

                  <Info
                    label="Approval Status"
                    value={
                      lead.approval_status
                    }
                  />

                  <Info
                    label="Assignment Status"
                    value={
                      lead.assignment_status
                    }
                  />

                  <Info
                    label="QA Status"
                    value={
                      lead.qa_status
                    }
                  />

                  <Info
                    label="Current Status"
                    value={
                      lead.status
                    }
                  />

                </div>

                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                  Assignment and approval information is controlled by Admin/QA and cannot be changed by Closer.
                </div>

              </section>

            </div>

            {/* =====================================================
                RIGHT
            ====================================================== */}

            <div>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5">

                  <h2 className="text-xl font-bold text-slate-900">
                    Closing Outcome
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select the final result for this lead.
                  </p>

                </div>

                {/* OUTCOME CARDS */}

                <div className="grid gap-4 md:grid-cols-3">

                  <OutcomeCard
                    selected={
                      outcome === "Sold"
                    }
                    onClick={() =>
                      setOutcome("Sold")
                    }
                    icon={
                      <CheckCircle
                        size={28}
                      />
                    }
                    title="Sold"
                    description="Customer accepted the offer"
                    color="green"
                  />

                  <OutcomeCard
                    selected={
                      outcome === "Not Interested"
                    }
                    onClick={() =>
                      setOutcome(
                        "Not Interested"
                      )
                    }
                    icon={
                      <ThumbsDown
                        size={28}
                      />
                    }
                    title="Not Interested"
                    description="Customer declined the offer"
                    color="gray"
                  />

                  <OutcomeCard
                    selected={
                      outcome === "No Answer"
                    }
                    onClick={() =>
                      setOutcome(
                        "No Answer"
                      )
                    }
                    icon={
                      <PhoneMissed
                        size={28}
                      />
                    }
                    title="No Answer"
                    description="Customer did not pick up"
                    color="amber"
                  />

                  <OutcomeCard
                    selected={
                      outcome === "Callback"
                    }
                    onClick={() =>
                      setOutcome(
                        "Callback"
                      )
                    }
                    icon={
                      <PhoneCall
                        size={28}
                      />
                    }
                    title="Callback"
                    description="Need to follow up later"
                    color="orange"
                  />

                  <OutcomeCard
                    selected={
                      outcome === "Lost"
                    }
                    onClick={() =>
                      setOutcome("Lost")
                    }
                    icon={
                      <XCircle
                        size={28}
                      />
                    }
                    title="Lost"
                    description="Not interested / Unable"
                    color="red"
                  />

                  <OutcomeCard
                    selected={
                      outcome === "Internal DNC"
                    }
                    onClick={() =>
                      setOutcome(
                        "Internal DNC"
                      )
                    }
                    icon={
                      <ShieldOff
                        size={28}
                      />
                    }
                    title="Internal DNC"
                    description="Add to internal do-not-call list"
                    color="rose"
                  />

                </div>

                {/* CLIENT LEAD ID / CHANNEL NAME */}

                <div className="mt-5 grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Client Lead ID
                    </label>

                    <input
                      type="text"
                      value={
                        form.cl_id || ""
                      }
                      onChange={(e) =>
                        updateField(
                          "cl_id",
                          e.target.value
                        )
                      }
                      placeholder="Enter client lead ID"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Channel Name
                    </label>

                    <select
                      value={
                        form.channel_name ||
                        ""
                      }
                      onChange={(e) =>
                        updateField(
                          "channel_name",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select channel</option>
                      <option value="Mango">Mango</option>
                      <option value="Umbrella">Umbrella</option>
                      <option value="Brother">Brother</option>
                    </select>
                  </div>

                </div>

                {/* SOLD */}

                {outcome === "Sold" && (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">

                    <h3 className="text-xl font-bold text-emerald-800">
                      Sale Details
                    </h3>

                    <p className="mt-1 text-sm text-emerald-700">
                      Enter the final sale information before saving the outcome.
                    </p>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">

                      {/* FINAL RETAILER */}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Final Retailer
                        </label>

                        <input
                          type="text"
                          value={
                            form.offered_retailer ||
                            ""
                          }
                          onChange={(e) =>
                            updateField(
                              "offered_retailer",
                              e.target.value
                            )
                          }
                          placeholder="Enter final retailer"
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        />
                      </div>

                      {/* FUEL TYPE */}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Fuel Type
                        </label>

                        <input
                          type="text"
                          value={
                            form.fuel_type ||
                            ""
                          }
                          onChange={(e) =>
                            updateField(
                              "fuel_type",
                              e.target.value
                            )
                          }
                          placeholder="Enter fuel type"
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        />
                      </div>

                    </div>

                    {/* CAMPAIGN */}

                    <div className="mt-5">

                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Campaign
                      </label>

                      <input
                        type="text"
                        value={
                          form.campaign || ""
                        }
                        onChange={(e) =>
                          updateField(
                            "campaign",
                            e.target.value
                          )
                        }
                        placeholder="Enter campaign"
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      />

                    </div>

                  </div>
                )}

                {/* CALLBACK */}

                {outcome === "Callback" && (
                  <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-5">

                    <div className="flex items-center gap-2 font-bold text-orange-800">

                      <Calendar size={20} />

                      Callback Schedule

                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">

                      <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Callback Date *
                        </label>

                        <input
                          type="date"
                          value={callbackDate}
                          onChange={(e) =>
                            setCallbackDate(
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                        />

                      </div>

                      <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Callback Time *
                        </label>

                        <input
                          type="time"
                          value={callbackTime}
                          onChange={(e) =>
                            setCallbackTime(
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                        />

                      </div>

                    </div>

                  </div>
                )}

                {/* LOST */}

                {outcome === "Lost" && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5">

                    <div className="flex items-center gap-2 font-bold text-red-800">

                      <XCircle size={20} />

                      Lost Lead

                    </div>

                    <p className="mt-2 text-sm text-red-700">
                      This lead will be marked as Lost after submission.
                    </p>

                  </div>
                )}

                {/* OUTCOME NOTES */}

                {outcome && (
                  <div className="mt-6">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Closer Notes
                    </label>

                    <textarea
                      value={closerComments}
                      onChange={(e) =>
                        setCloserComments(
                          e.target.value
                        )
                      }
                      rows={5}
                      maxLength={500}
                      placeholder="Add important notes about the outcome..."
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <div className="mt-1 text-right text-xs text-slate-400">
                      {closerComments.length}/500
                    </div>

                  </div>
                )}

                {/* SAVE OUTCOME */}

                <div className="mt-6">

                  <button
                    type="button"
                    onClick={submitOutcome}
                    disabled={
                      !outcome ||
                      submitting ||
                      isClosed
                    }
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white shadow-sm transition ${
                      outcome === "Sold"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : outcome === "Callback"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : outcome === "Lost"
                        ? "bg-red-600 hover:bg-red-700"
                        : outcome === "Not Interested"
                        ? "bg-slate-600 hover:bg-slate-700"
                        : outcome === "No Answer"
                        ? "bg-amber-500 hover:bg-amber-600"
                        : outcome === "Internal DNC"
                        ? "bg-rose-700 hover:bg-rose-800"
                        : "bg-slate-400"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >

                    {submitting ? (
                      <>
                        <Loader2
                          size={20}
                          className="animate-spin"
                        />

                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={20} />

                        Save Outcome

                        {outcome
                          ? ` as ${outcome}`
                          : ""}
                      </>
                    )}

                  </button>

                </div>

              </section>

              {/* INFO */}

              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">

                <div className="flex gap-3">

                  <div className="mt-0.5 text-blue-600">
                    <AlertCircle size={19} />
                  </div>

                  <p className="text-sm text-blue-700">
                    For Sold, enter Final Retailer, Fuel Type and Campaign in Sale Details, then save the outcome.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </MainLayout>
  );
}

/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
  icon,
  iconClass,
  title,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClass}`}
      >
        {icon}
      </div>

      <h2 className="text-lg font-bold text-slate-800">
        {title}
      </h2>

    </div>
  );
}

/* ============================================================
   EDITABLE FIELD
============================================================ */

function EditableField({
  label,
  value,
  editing,
  onChange,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
}) {
  if (!editing) {
    return (
      <Info
        label={label}
        value={value}
        icon={icon}
      />
    );
  }

  return (
    <div>

      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <div className="relative">

        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value || ""}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className={`w-full rounded-lg border border-blue-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            icon ? "pl-10" : ""
          }`}
        />

      </div>

    </div>
  );
}

/* ============================================================
   SELECT
============================================================ */

function SelectField({
  label,
  value,
  editing,
  options,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  options: string[];
  onChange: (value: string) => void;
}) {
  if (!editing) {
    return (
      <Info
        label={label}
        value={value}
      />
    );
  }

  return (
    <div>

      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <select
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-lg border border-blue-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">
          Select...
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>

    </div>
  );
}

/* ============================================================
   TEXTAREA
============================================================ */

function TextAreaField({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  if (!editing) {
    return (
      <Info
        label={label}
        value={value}
      />
    );
  }

  return (
    <div>

      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <textarea
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value)
        }
        rows={4}
        className="w-full resize-none rounded-lg border border-blue-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

    </div>
  );
}

/* ============================================================
   BOOLEAN
============================================================ */

function BooleanEditor({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: boolean;
  editing: boolean;
  onChange: (value: boolean) => void;
}) {
  if (!editing) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">

        <p className="text-xs font-semibold uppercase text-slate-400">
          {label}
        </p>

        <p
          className={`mt-1 text-sm font-bold ${
            value
              ? "text-emerald-600"
              : "text-slate-500"
          }`}
        >
          {value ? "Yes" : "No"}
        </p>

      </div>
    );
  }

  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">

      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        className="h-5 w-5"
      />

    </label>
  );
}

/* ============================================================
   INFO
============================================================ */

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value:
    | string
    | number
    | null
    | undefined;
  icon?: React.ReactNode;
}) {
  return (
    <div>

      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="flex items-center gap-2 break-words text-sm font-semibold text-slate-800">

        {icon && (
          <span className="shrink-0 text-slate-400">
            {icon}
          </span>
        )}

        <span>
          {value || "—"}
        </span>

      </div>

    </div>
  );
}

/* ============================================================
   OUTCOME CARD
============================================================ */

function OutcomeCard({
  selected,
  onClick,
  icon,
  title,
  description,
  color,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  color:
    | "green"
    | "orange"
    | "red"
    | "gray"
    | "amber"
    | "rose";
}) {
  const styles = {
    green: {
      border: "border-emerald-300",
      bg: "bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-600",
      title: "text-emerald-700",
      ring: "ring-emerald-200",
    },

    orange: {
      border: "border-orange-300",
      bg: "bg-orange-50",
      icon: "bg-orange-100 text-orange-600",
      title: "text-orange-700",
      ring: "ring-orange-200",
    },

    red: {
      border: "border-red-300",
      bg: "bg-red-50",
      icon: "bg-red-100 text-red-600",
      title: "text-red-700",
      ring: "ring-red-200",
    },

    gray: {
      border: "border-slate-300",
      bg: "bg-slate-50",
      icon: "bg-slate-200 text-slate-600",
      title: "text-slate-700",
      ring: "ring-slate-200",
    },

    amber: {
      border: "border-amber-300",
      bg: "bg-amber-50",
      icon: "bg-amber-100 text-amber-600",
      title: "text-amber-700",
      ring: "ring-amber-200",
    },

    rose: {
      border: "border-rose-400",
      bg: "bg-rose-50",
      icon: "bg-rose-200 text-rose-800",
      title: "text-rose-800",
      ring: "ring-rose-300",
    },
  };

  const s = styles[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-xl border-2 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${s.border} ${s.bg} ${
        selected
          ? `ring-4 ${s.ring}`
          : ""
      }`}
    >

      {selected && (
        <div className="absolute right-3 top-3">

          <CheckCircle
            size={18}
            className={s.title}
          />

        </div>
      )}

      <div
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${s.icon}`}
      >
        {icon}
      </div>

      <h3
        className={`text-lg font-bold ${s.title}`}
      >
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

    </button>
  );
}

/* ============================================================
   DATE FORMAT
============================================================ */

function formatDateTime(
  value: string | null | undefined
) {
  if (!value) return "—";

  try {
    return new Date(
      value
    ).toLocaleString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}