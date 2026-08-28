interface CustomerOptionsProps {
  solar: boolean;
  setSolar: (value: boolean) => void;
  concession: boolean;
  setConcession: (value: boolean) => void;
  lifeSupport: boolean;
  setLifeSupport: (value: boolean) => void;
  comments: string;
  setComments: (value: string) => void;
}

export default function CustomerOptions({
  solar, setSolar, concession, setConcession, lifeSupport, setLifeSupport, comments, setComments,
}: CustomerOptionsProps) {
  return (
    <section>
      <h2 className="mb-6 text-lg font-semibold text-slate-800">Customer Options</h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-4 hover:bg-slate-50">
          <input type="checkbox" checked={solar} onChange={(e) => setSolar(e.target.checked)} className="h-5 w-5" />
          <span className="font-medium">Solar</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-4 hover:bg-slate-50">
          <input type="checkbox" checked={concession} onChange={(e) => setConcession(e.target.checked)} className="h-5 w-5" />
          <span className="font-medium">Concession</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-4 hover:bg-slate-50">
          <input type="checkbox" checked={lifeSupport} onChange={(e) => setLifeSupport(e.target.checked)} className="h-5 w-5" />
          <span className="font-medium">Life Support</span>
        </label>
      </div>
      <div className="mt-8">
        <label className="mb-2 block text-sm font-medium">Comments</label>
        <textarea rows={5} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Enter comments..." className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
      </div>
    </section>
  );
}
