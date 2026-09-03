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

  // Admin/Super Admin can view and process (disposition) any lead, not
  // only one they currently own via Take Lead — the Closer ownership
  // rule (Closer must own the lead to process it) is unaffected; this
  // is Admin/Super Admin-only.
  const canProcessLead = ["Admin", "Super Admin"].includes(
    profile.role
  );

  // Separately tracked so the disposition section can show an accurate
  // "taken by you" vs "you have Admin/Super Admin access" message —
  // canProcessLead no longer implies ownership.
  const isLeadOwner = lead.assigned_closer === profile.id;

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
          isLeadOwner={isLeadOwner}
          currentRole={profile.role}
        />
      </div>
    </MainLayout>
  );
}
