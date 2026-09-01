import { requireRole } from "@/lib/auth";
import { getLead } from "@/lib/leads";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidElement, type ReactNode } from "react";
import QASection from "@/components/leads/QASection";
import TakeLeadButton from "@/components/leads/TakeLeadButton";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  const empty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "");

  const displayValue = empty
    ? "-"
    : typeof value === "object" && !isValidElement(value)
      ? (value as any)?.full_name || (value as any)?.username || (value as any)?.employee_id || "-"
      : value;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-1 break-words text-sm font-semibold text-slate-800">
        {displayValue}
      </div>
    </div>
  );
}

function PersonValue({
  person,
}: {
  person: any;
}) {
  if (!person) return "-";

  // Supabase relation shapes can occasionally be nested.
  const value =
    person.profile ??
    person.data ??
    person;

  if (typeof value === "string") {
    return value;
  }

  const name =
    value.full_name ||
    value.name ||
    value.username ||
    value.email ||
    value.employee_id;

  const employeeId =
    value.employee_id &&
    value.employee_id !== name
      ? value.employee_id
      : null;

  if (!name && !employeeId) {
    return "-";
  }

  return (
    <span className="inline-flex flex-col leading-tight">
      <span>{name || "-"}</span>
      {employeeId && (
        <span className="text-xs font-normal text-slate-500">
          {employeeId}
        </span>
      )}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">
        {title}
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

export default async function LeadDetailsPage({
  params,
}: Props) {
  const { profile } = await requireRole([
  "Admin",
  "Super Admin",
  "QA",
  "Closer",
]);

  const { id } = await params;

  const lead = await getLead(Number(id));

  if (!lead) {
    notFound();
  }

  const isCloser = profile.role === "Closer";

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* HEADER */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="mb-2 text-sm text-slate-500">
                Home / Leads / {lead.lead_id}
              </div>

              <h1 className="text-3xl font-bold text-slate-900">
                Lead Details
              </h1>

              <p className="mt-1 text-slate-500">
                {lead.lead_id}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              {/* First-click-wins claim — Admin/Super Admin/Closer,
                  only while nobody has claimed this lead yet. */}
              {["Admin", "Super Admin", "Closer"].includes(
                profile.role
              ) &&
                !lead.assigned_closer && (
                  <TakeLeadButton
                    leadId={lead.id}
                    className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
                  />
                )}

              {/* Only Admin/Super Admin can edit */}
              {!isCloser && (
                <Link
                  href={`/leads/${lead.id}/edit`}
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Edit Lead
                </Link>
              )}

              <Link
                href="/leads"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Back
              </Link>
            </div>
          </div>

          {/* CUSTOMER */}
          <Section title="Customer Information">

            <InfoRow
              label="Title"
              value={lead.title}
            />

            <InfoRow
              label="Customer Type"
              value={lead.customer_type}
            />

            <InfoRow
              label="Customer Name"
              value={lead.customer_name}
            />

            <InfoRow
              label="Phone"
              value={lead.mobile}
            />

            <InfoRow
              label="Alt Phone"
              value={lead.alternate_mobile}
            />

            <InfoRow
              label="Email"
              value={lead.email}
            />

            <InfoRow
              label="DOB"
              value={lead.dob}
            />

          </Section>

          {/* ADDRESS */}
          <Section title="Address Information">

            <InfoRow
              label="Address"
              value={lead.address}
            />

            <InfoRow
              label="Suburb"
              value={lead.suburb}
            />

            <InfoRow
              label="State"
              value={lead.state}
            />

            <InfoRow
              label="Postcode"
              value={lead.postcode}
            />

          </Section>

          {/* ENERGY */}
          <Section title="Energy Information">

            <InfoRow
              label="Fuel Type"
              value={lead.fuel_type}
            />

            <InfoRow
              label="Current Retailer"
              value={lead.current_retailer}
            />

            <InfoRow
              label="Offered Retailer"
              value={lead.offered_retailer}
            />

            <InfoRow
              label="Campaign"
              value={lead.campaign}
            />

            <InfoRow
              label="NMI"
              value={lead.nmi}
            />

            <InfoRow
              label="MIRN"
              value={lead.mirn}
            />

            <InfoRow
              label="DNCR Number"
              value={lead.dncr_number}
            />

          </Section>

          {/* OPTIONS */}
          <Section title="Customer Options">

            <InfoRow
              label="Solar"
              value={
                lead.solar ? "Yes" : "No"
              }
            />

            <InfoRow
              label="Concession"
              value={
                lead.concession ? "Yes" : "No"
              }
            />

            <InfoRow
              label="Life Support"
              value={
                lead.life_support ? "Yes" : "No"
              }
            />

          </Section>

          {/* NBN */}
          {String(lead.campaign || "").toUpperCase() === "NBN" && (
            <Section title="NBN Information">

              <InfoRow
                label="NBN Provider"
                value={lead.nbn_provider}
              />

              <InfoRow
                label="Offered NBN Retailer"
                value={lead.offered_nbn_retailer}
              />

              <InfoRow
                label="AVC No"
                value={lead.avc_no}
              />

              <InfoRow
                label="Paying"
                value={lead.paying}
              />

              <InfoRow
                label="Home Owner"
                value={lead.home_owner}
              />

            </Section>
          )}

          {/* PHI */}
          {String(lead.campaign || "").toUpperCase() === "PHI" && (
            <Section title="PHI Information">

              <InfoRow
                label="First Name"
                value={lead.phi_first_name}
              />

              <InfoRow
                label="Last Name"
                value={lead.phi_last_name}
              />

              <InfoRow
                label="Current Fund"
                value={lead.phi_current_fund}
              />

              <InfoRow
                label="PHI Status"
                value={lead.phi_status}
              />

              <InfoRow
                label="Booked By"
                value={lead.phi_booked_by}
              />

              <InfoRow
                label="Booked Date"
                value={lead.phi_booked_date}
              />

              <InfoRow
                label="Booked Time"
                value={lead.phi_booked_time}
              />

              <InfoRow
                label="Outcome"
                value={lead.phi_outcome}
              />

              <InfoRow
                label="LT / Booking"
                value={lead.phi_lt_booking}
              />

            </Section>
          )}

          {/* STATUS */}
          <Section title="Assignment & Status">

            <InfoRow
              label="Lead Status"
              value={lead.status}
            />

            <InfoRow
              label="Approval Status"
              value={lead.approval_status}
            />

            <InfoRow
              label="Assignment Status"
              value={lead.assignment_status}
            />

            <InfoRow
              label="Agent"
              value={
                <PersonValue
                  person={
                    lead.assignedAgent ||
                    lead.agent ||
                    lead.creator ||
                    lead.assigned_agent ||
                    lead.agent_name
                  }
                />
              }
            />

            <InfoRow
              label="Assigned Closer"
              value={
                <PersonValue
                  person={
                    lead.closer ||
                    lead.assigned_closer
                  }
                />
              }
            />

            <InfoRow
              label="Client Lead ID"
              value={lead.cl_id}
            />

            <InfoRow
              label="Channel Name"
              value={lead.channel_name}
            />

            <InfoRow
              label="Post-Sale QA"
              value={
                lead.status === "Sold"
                  ? lead.qa_status || "Not Audited"
                  : "Not Required"
              }
            />

          </Section>

          {/* POST-SALE QA */}
          {["QA", "Admin", "Super Admin"].includes(profile.role) &&
            lead.status === "Sold" && (
              <QASection
                leadId={String(lead.id)}
                currentStatus={String(lead.status || "")}
                currentQaStatus={lead.qa_status}
                currentUser={{
                  id: profile.id,
                  full_name: profile.full_name || "",
                  role: profile.role,
                }}
              />
            )}

          {/* COMMENTS */}
          <Section title="Comments">

            <div className="col-span-full rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm leading-6 text-slate-700">
              {lead.comments || "-"}
            </div>

          </Section>

        </div>
      </div>
    </MainLayout>
  );
}