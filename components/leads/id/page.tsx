import MainLayout from "@/components/layout/MainLayout";
import { adminSupabase } from "@/lib/admin";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

type Profile = {
  id: string;
  full_name: string | null;
  employee_id: string | null;
};

function idFromAssignment(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.id ?? value.user_id ?? null;
  return null;
}

async function getProfile(id: string | null): Promise<Profile | null> {
  if (!id) return null;

  const { data } = await adminSupabase
    .from("profiles")
    .select("id, full_name, employee_id")
    .eq("id", id)
    .maybeSingle();

  return data as Profile | null;
}

function PersonValue({ profile }: { profile: Profile | null }) {
  if (!profile) return <span className="font-semibold">-</span>;

  return (
    <span className="text-right">
      <span className="block font-semibold">{profile.full_name || "-"}</span>
      {profile.employee_id && (
        <span className="block text-sm font-normal text-slate-500">
          {profile.employee_id}
        </span>
      )}
    </span>
  );
}

export default async function ViewLeadPage({ params }: Props) {
  const { id } = await params;

  const { data: lead, error } = await adminSupabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lead) notFound();

  const agentId = idFromAssignment(lead.assigned_agent) || idFromAssignment(lead.created_by);
  const closerId = idFromAssignment(lead.assigned_closer);

  const [agent, closer] = await Promise.all([
    getProfile(agentId),
    getProfile(closerId),
  ]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 text-sm text-slate-500">
              Home / Leads / {lead.lead_id}
            </div>
            <h1 className="text-3xl font-bold">Lead Details</h1>
            <p className="text-slate-500">{lead.lead_id}</p>
          </div>

          <div className="flex gap-3">
            <Link href={`/leads/${lead.id}/edit`} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white">
              Edit Lead
            </Link>
            <Link href="/leads" className="rounded-lg border px-5 py-3 font-semibold">
              ← Back
            </Link>
          </div>
        </div>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Customer Information</h2>
          <Info label="Title" value={lead.title} />
          <Info label="Customer Type" value={lead.customer_type} />
          <Info label="Customer Name" value={lead.customer_name} />
          <Info label="Phone" value={lead.mobile} />
          <Info label="Alt Phone" value={lead.alternate_mobile} />
          <Info label="Email" value={lead.email} />
          <Info label="DOB" value={lead.dob} />
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Address Information</h2>
          <Info label="Address" value={lead.address} />
          <Info label="Suburb" value={lead.suburb} />
          <Info label="State" value={lead.state} />
          <Info label="Postcode" value={lead.postcode} />
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Energy Information</h2>
          <Info label="Fuel Type" value={lead.fuel_type} />
          <Info label="Current Retailer" value={lead.current_retailer} />
          <Info label="Offered Retailer" value={lead.offered_retailer} />
          <Info label="Campaign" value={lead.campaign} />
          <Info label="NMI" value={lead.nmi} />
          <Info label="MIRN" value={lead.mirn} />
          <Info label="DNCR Number" value={lead.dncr_number} />
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Customer Options</h2>
          <Info label="Solar" value={lead.solar ? "Yes" : "No"} />
          <Info label="Concession" value={lead.concession ? "Yes" : "No"} />
          <Info label="Life Support" value={lead.life_support ? "Yes" : "No"} />
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Assignment &amp; Status</h2>
          <Info label="Lead Status" value={lead.status} />
          <Info label="Approval Status" value={lead.approval_status} />
          <Info label="Assignment Status" value={lead.assignment_status} />
          <PersonRow label="Assigned Agent" profile={agent} />
          <PersonRow label="Assigned Closer" profile={closer} />
          <Info label="Post-Sale QA" value={lead.qa_status} />
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Comments</h2>
          <div className="min-h-[120px] rounded-lg border p-4">
            {lead.comments || "No comments available."}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b py-3 last:border-b-0">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-semibold">{value === null || value === undefined || value === "" ? "-" : String(value)}</span>
    </div>
  );
}

function PersonRow({ label, profile }: { label: string; profile: Profile | null }) {
  return (
    <div className="flex justify-between border-b py-3">
      <span className="font-medium text-slate-500">{label}</span>
      <PersonValue profile={profile} />
    </div>
  );
}
