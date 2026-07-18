export default function TopAgent() {
  return (
    <div className="rounded-xl border bg-white p-6 shadow">

      <h2 className="mb-5 text-xl font-bold">
        🏆 Top Agent
      </h2>

      <div className="text-center">

        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white">
          A
        </div>

        <h3 className="text-lg font-bold">
          Alice Johnson
        </h3>

        <p className="text-slate-500">
          42 Sales
        </p>

        <div className="mt-4 h-3 rounded-full bg-slate-200">

          <div className="h-3 w-4/5 rounded-full bg-green-500"></div>

        </div>

        <p className="mt-2 text-sm text-slate-500">
          82% Performance
        </p>

      </div>

    </div>
  );
}