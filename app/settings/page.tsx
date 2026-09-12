import MainLayout from "@/components/layout/MainLayout";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  await requireRole([
    "Admin",
    "Super Admin",
  ]);

  const settings = await getSettings();

  return (
    <MainLayout>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold">
            CRM Settings
          </h1>

          <p className="text-slate-500">
            Configure your CRM settings.
          </p>
        </div>

        <SettingsForm initialSettings={settings} />

      </div>
    </MainLayout>
  );
}