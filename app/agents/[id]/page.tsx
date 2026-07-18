import MainLayout from "@/components/layout/MainLayout";
import { getAgent } from "@/lib/agents";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function AgentDetailsPage({
  params,
}: Props) {
  const { id } = await params;

  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  return (
    <MainLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold">
              Agent Profile
            </h1>

            <p className="text-slate-500">
              Complete agent information
            </p>

          </div>

          <div className="flex gap-3">

            <Link
              href="/agents"
              className="rounded-lg border px-5 py-3"
            >
              Back
            </Link>

            <Link
              href={`/agents/${agent.id}/edit`}
              className="rounded-lg bg-blue-600 px-5 py-3 text-white"
            >
              Edit Agent
            </Link>

          </div>

        </div>

        <div className="grid grid-cols-4 gap-5">

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Employee ID
            </p>

            <h2 className="mt-2 text-xl font-bold">
              {agent.employee_id}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Username
            </p>

            <h2 className="mt-2 text-xl font-bold">
              {agent.username}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Assigned Leads
            </p>

            <h2 className="mt-2 text-xl font-bold">
              {agent.assigned_leads ?? 0}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Sales
            </p>

            <h2 className="mt-2 text-xl font-bold text-green-600">
              {agent.sales ?? 0}
            </h2>
          </div>

        </div>

        <div className="rounded-xl bg-white p-8 shadow">

          <h2 className="mb-6 text-xl font-bold">
            Personal Information
          </h2>

          <div className="grid grid-cols-2 gap-6">

            <Info
              label="Employee ID"
              value={agent.employee_id}
            />

            <Info
              label="Username"
              value={agent.username}
            />

            <Info
              label="Full Name"
              value={agent.full_name}
            />

            <Info
              label="Email"
              value={agent.email}
            />

            <Info
              label="Role"
              value={agent.role}
            />

            <Info
              label="Status"
              value={agent.status}
            />

            <Info
              label="Created"
              value={new Date(agent.created_at).toLocaleDateString()}
            />

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
    <div>

      <p className="mb-2 text-sm text-slate-500">
        {label}
      </p>

      <div className="rounded-lg border bg-slate-50 p-3 font-medium">
        {value || "-"}
      </div>

    </div>
  );
}