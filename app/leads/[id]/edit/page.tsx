import MainLayout from "@/components/layout/MainLayout";
import LeadForm from "@/components/leads/LeadForm";
import { getLead } from "@/lib/leads";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditLeadPage({
  params,
}: Props) {
  const { id } = await params;

  const lead = await getLead(Number(id));

  if (!lead) {
    notFound();
  }

  return (
    <MainLayout>
      <div className="max-w-7xl space-y-6">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Edit Lead
            </h1>

            <p className="text-slate-500">
              {lead.lead_id}
            </p>
          </div>

          <Link
            href={`/leads/${lead.id}`}
            className="rounded-lg border px-5 py-2"
          >
            Back
          </Link>

        </div>

        <LeadForm
          initialData={lead}
          isEdit={true}
        />

      </div>
    </MainLayout>
  );
}