import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

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

          {/* Customer */}

          <div className="rounded-xl border bg-white p-6 shadow">

            <h2 className="mb-5 text-xl font-bold">
              Customer Information
            </h2>

            <Info label="Title" value={lead.title} />
            <Info label="Customer Type" value={lead.customer_type} />
            <Info label="Customer Name" value={lead.customer_name} />
            <Info label="Phone" value={lead.mobile} />
            <Info label="Alt Phone" value={lead.alternate_mobile} />
            <Info label="Email" value={lead.email} />
            <Info label="DOB" value={lead.dob} />

          </div>

          {/* Address */}

          <div className="rounded-xl border bg-white p-6 shadow">

            <h2 className="mb-5 text-xl font-bold">
              Address Information
            </h2>

            <Info label="Address" value={lead.address} />
            <Info label="Suburb" value={lead.suburb} />
            <Info label="State" value={lead.state} />
            <Info label="Postcode" value={lead.postcode} />

          </div>

          {/* Energy */}

          <div className="rounded-xl border bg-white p-6 shadow">

            <h2 className="mb-5 text-xl font-bold">
              Energy Information
            </h2>

            <Info label="Fuel Type" value={lead.fuel_type} />
            <Info label="Current Retailer" value={lead.current_retailer} />
            <Info label="Offered Retailer" value={lead.offered_retailer} />
            <Info label="NBN Retailer" value={lead.nbn_retailer} />
            <Info label="NMI" value={lead.nmi} />
            <Info label="MIRN" value={lead.mirn} />
            <Info label="AVC No" value={lead.avc_no} />

          </div>

          {/* Campaign */}

          <div className="rounded-xl border bg-white p-6 shadow">

            <h2 className="mb-5 text-xl font-bold">
              Campaign Information
            </h2>

            <Info label="Campaign" value={lead.campaign} />
            <Info label="Status" value={lead.status} />
            <Info label="Solar" value={lead.solar ? "Yes" : "No"} />
            <Info label="Concession" value={lead.concession ? "Yes" : "No"} />
            <Info label="Life Support" value={lead.life_support ? "Yes" : "No"} />
            <Info label="DNCR Number" value={lead.dncr_number} />
            <Info label="CL ID" value={lead.cl_id} />

          </div>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <h2 className="mb-4 text-xl font-bold">
            Comments
          </h2>

          <div className="min-h-[120px] rounded-lg border p-4">
            {lead.comments || "No comments available."}
          </div>

        </div>

      </div>
    </MainLayout>
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