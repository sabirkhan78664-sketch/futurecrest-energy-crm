import LeadHistory from "@/components/history/LeadHistory";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import FollowupTimeline from "@/components/followups/FollowupTimeline";
import LeadFollowups from "@/components/followups/LeadFollowups";
interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ViewLeadPage({ params }: Props) {
  const { id } = await params;

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lead) {
    notFound();
  }

  const { data: followups } = await supabase
    .from("follow_ups")
    .select("*")
    .eq("lead_id", lead.id)
    .order("followup_date", { ascending: false });

  return (
    <MainLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Lead Details
            </h1>

            <p className="text-slate-500">
              {lead.lead_id}
            </p>
          </div>

          <div className="flex gap-3">

            <Link
              href="/leads"
              className="rounded-lg border px-5 py-2"
            >
              Back
            </Link>

            <Link
              href={`/leads/${lead.id}/edit`}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white"
            >
              Edit Lead
            </Link>

          </div>

        </div>

        <div className="grid grid-cols-2 gap-6">

          <Section title="Customer Information">
            <Info label="Title" value={lead.title} />
            <Info label="Customer Type" value={lead.customer_type} />
            <Info label="Customer Name" value={lead.customer_name} />
            <Info label="Phone" value={lead.mobile} />
            <Info label="Alt Phone" value={lead.alternate_mobile} />
            <Info label="Email" value={lead.email} />
            <Info label="DOB" value={lead.dob} />
          </Section>

          <Section title="Address Information">
            <Info label="Address" value={lead.address} />
            <Info label="Suburb" value={lead.suburb} />
            <Info label="State" value={lead.state} />
            <Info label="Postcode" value={lead.postcode} />
          </Section>

          <Section title="Energy Information">
            <Info label="Fuel Type" value={lead.fuel_type} />
            <Info label="Current Retailer" value={lead.current_retailer} />
            <Info label="Offered Retailer" value={lead.offered_retailer} />
            <Info label="NBN Retailer" value={lead.nbn_retailer} />
            <Info label="NMI" value={lead.nmi} />
            <Info label="MIRN" value={lead.mirn} />
            <Info label="AVC No" value={lead.avc_no} />
          </Section>

          <Section title="Campaign Information">
            <Info label="Campaign" value={lead.campaign} />
            <Info label="Status" value={lead.status} />
            <Info label="Solar" value={lead.solar ? "Yes" : "No"} />
            <Info label="Concession" value={lead.concession ? "Yes" : "No"} />
            <Info label="Life Support" value={lead.life_support ? "Yes" : "No"} />
            <Info label="DNCR Number" value={lead.dncr_number} />
            <Info label="CL ID" value={lead.cl_id} />
          </Section>

        </div>

        <Section title="Comments">
          <div className="min-h-[120px] rounded-lg border p-4">
            {lead.comments || "No comments available."}
          </div>
        </Section>

        <LeadFollowups
  leadId={lead.id}
  followups={followups ?? []}
/>
<LeadHistory leadId={lead.id} />
      </div>
    </MainLayout>
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
    <div className="rounded-xl border bg-white p-6 shadow">
      <h2 className="mb-5 text-xl font-bold">
        {title}
      </h2>

      {children}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="mb-4 flex justify-between border-b pb-2">

      <span className="font-medium text-slate-500">
        {label}
      </span>

      <span className="font-semibold">
        {value || "-"}
      </span>

    </div>
  );
}