export default function AgentDashboard({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">My Assigned Leads</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Pending Follow-ups</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Closed Deals</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
      </div>
    </div>
  );
}