import MainLayout from "@/components/layout/MainLayout";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import { getClosers } from "@/lib/closers";

export default async function ClosersPage() {
  await requireRole(["Admin", "Super Admin"]);

  const closers = await getClosers();

  return (
    <MainLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Closer Management
            </h1>

            <p className="text-slate-500">
              Manage FutureCrest CRM Closers
            </p>
          </div>

          <Link
  href="/users/new?role=Closer"
  className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
>
  + Add Closer
</Link>

        </div>

        <div className="overflow-x-auto rounded-xl border bg-white shadow">

          <table className="min-w-full">

            <thead className="bg-slate-100">

              <tr>

                <th className="px-5 py-4 text-left">
                  Employee ID
                </th>

                <th className="px-5 py-4 text-left">
                  Username
                </th>

                <th className="px-5 py-4 text-left">
                  Name
                </th>

                <th className="px-5 py-4 text-center">
                  Role
                </th>

                <th className="px-5 py-4 text-center">
                  Status
                </th>

                <th className="px-5 py-4 text-center">
                  Assigned Leads
                </th>

                <th className="px-5 py-4 text-center">
                  Sales
                </th>

                <th className="px-5 py-4 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {closers.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-500"
                  >
                    No closers available.
                  </td>

                </tr>

              ) : (

                closers.map((closer: any) => (

                  <tr
                    key={closer.id}
                    className="border-t hover:bg-slate-50"
                  >

                    <td className="px-5 py-4 font-semibold">
                      {closer.employee_id}
                    </td>

                    <td className="px-5 py-4">
                      {closer.username}
                    </td>

                    <td className="px-5 py-4">
                      {closer.full_name}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {closer.role}
                    </td>

                    <td className="px-5 py-4 text-center">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          closer.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {closer.status}
                      </span>

                    </td>

                    <td className="px-5 py-4 text-center">
                      {closer.assigned_leads ?? 0}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {closer.sales ?? 0}
                    </td>

                    <td className="px-5 py-4">

                      <div className="flex justify-center gap-4">

                        <Link
                          href={`/closers/${closer.id}`}
                          className="text-green-600 hover:underline"
                        >
                          View
                        </Link>

                        <Link
                          href={`/closers/${closer.id}/edit`}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>
    </MainLayout>
  );
}