import { requireRole } from "@/lib/auth";
import { getLead } from "@/lib/leads";
import MainLayout from "@/components/layout/MainLayout";
import LeadForm from "@/components/leads/LeadForm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditLeadPage({ params }: Props) {
  const { id } = await params;
  const { profile } = await requireRole(["Admin", "Super Admin"]);
  const lead = await getLead(Number(id));

  if (!lead) notFound();

  // Admin/Super Admin can process (disposition) this lead only when
  // they're the one who currently owns it via Take Lead.
  const canProcessLead =
    ["Admin", "Super Admin"].includes(profile.role) &&
    lead.assigned_closer === profile.id;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Lead</h1>
          <p className="mt-1 text-slate-500">
            Update {lead.lead_id} · {profile.role}
          </p>
        </div>
        <LeadForm
          initialData={lead}
          isEdit
          canProcessLead={canProcessLead}
        />
      </div>
    </MainLayout>
  );
}
