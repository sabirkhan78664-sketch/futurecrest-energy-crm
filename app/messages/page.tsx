import MainLayout from "@/components/layout/MainLayout";

export default function MessagesPage() {
  return (
    <MainLayout>
      <div className="grid h-[calc(100vh-100px)] grid-cols-12 rounded-xl border bg-white shadow">

        <div className="col-span-3 border-r flex items-center justify-center">

          <div className="text-center">

            <h2 className="text-xl font-bold">
              Messages
            </h2>

            <p className="mt-2 text-slate-500">
              Loading conversations...
            </p>

          </div>

        </div>

        <div className="col-span-9 flex items-center justify-center bg-slate-50">

          <div className="text-center">

            <h2 className="text-3xl font-bold">
              Internal Chat
            </h2>

            <p className="mt-2 text-slate-500">
              Conversation module is loading.
            </p>

          </div>

        </div>

      </div>
    </MainLayout>
  );
}   