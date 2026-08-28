interface Props {
  searchParams: Promise<{ reason?: string }>;
}

export default async function UnauthorizedPage({ searchParams }: Props) {
  const { reason } = await searchParams;

  const message =
    reason === "ip"
      ? "Access restricted. Your IP address is not authorised to access this system. Please connect from the office network or contact your administrator."
      : "You do not have permission to access this page.";

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="rounded-xl border bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-red-600">
          Access Denied
        </h1>

        <p className="mt-3 text-gray-600">
          {message}
        </p>
      </div>
    </div>
  );
}
