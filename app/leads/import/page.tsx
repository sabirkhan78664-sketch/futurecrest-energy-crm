import MainLayout from "@/components/layout/MainLayout";
import { requireRole } from "@/lib/auth";
import PageNavigation from "@/components/navigation/PageNavigation";
import ImportLeadsClient from "@/components/leads/ImportLeadsClient";

export default async function ImportLeadsPage() {
  await requireRole(["Super Admin"]);

  return (
    <MainLayout>
      <PageNavigation />
      <ImportLeadsClient />
    </MainLayout>
  );
}
