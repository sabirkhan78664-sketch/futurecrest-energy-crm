import MainLayout from "@/components/layout/MainLayout";
import AgentForm from "@/components/agents/AgentForm";
import { getAgent } from "@/lib/agents";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAgentPage({
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

        <div>

          <h1 className="text-3xl font-bold">
            Edit Agent
          </h1>

          <p className="text-slate-500">
            Update agent information
          </p>

        </div>

        <AgentForm agent={agent} />

      </div>

    </MainLayout>
  );
}