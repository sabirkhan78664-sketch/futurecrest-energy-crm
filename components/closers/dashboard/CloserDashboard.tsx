export default function CloserDashboard({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">My Assigned Deals</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Conversion Rate</h3>
          <p className="text-3xl font-bold mt-2">--%</p>
        </div>
      </div>
    </div>
  );
}