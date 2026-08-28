import MainLayout from "@/components/layout/MainLayout";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

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

        <div className="rounded-xl border bg-white p-6 shadow">

          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block font-medium">
                Company Name
              </label>

              <input
                defaultValue={settings?.company_name ?? ""}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Company Email
              </label>

              <input
                defaultValue={settings?.company_email ?? ""}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Phone
              </label>

              <input
                defaultValue={settings?.company_phone ?? ""}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Website
              </label>

              <input
                defaultValue={settings?.website ?? ""}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                CRM Name
              </label>

              <input
                defaultValue={settings?.crm_name ?? ""}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Lead Prefix
              </label>

              <input
                defaultValue={settings?.lead_prefix ?? ""}
                className="w-full rounded-lg border p-3"
              />
            </div>

          </div>

          <button
            className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Save Settings
          </button>

        </div>

      </div>
    </MainLayout>
  );
}