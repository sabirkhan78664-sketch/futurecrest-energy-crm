import MainLayout from "@/components/layout/MainLayout";
import { requireRole } from "@/lib/auth";
import LeadForm from "@/components/leads/LeadForm";
import Link from "next/link";

export default async function NewLeadPage() {
  await requireRole(["Agent", "Closer", "Admin", "Super Admin"]);

  return (
    <MainLayout>
      <div className="max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Add New Lead
            </h1>

            <p className="text-slate-500">
              Create a new energy lead
            </p>
          </div>

          <Link
            href="/leads"
            className="rounded-lg border px-5 py-2"
          >
            Back
          </Link>
        </div>

        <LeadForm />
      </div>
    </MainLayout>
  );
}