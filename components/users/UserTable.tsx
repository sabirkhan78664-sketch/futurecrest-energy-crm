"use client";

interface UserTableProps {
  users: any[];
}

export default function UserTable({
  users,
}: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow">

      <table className="min-w-full">

        <thead className="bg-slate-100">

          <tr>
            <th className="px-5 py-4 text-left">Employee ID</th>
            <th className="px-5 py-4 text-left">Name</th>
            <th className="px-5 py-4 text-left">Email</th>
            <th className="px-5 py-4 text-center">Role</th>
            <th className="px-5 py-4 text-center">Status</th>
          </tr>

        </thead>

        <tbody>

          {users.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="py-12 text-center text-slate-500"
              >
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id}
                className="border-t hover:bg-slate-50"
              >
                <td className="px-5 py-4 font-mono text-xs">
                  {user.id.slice(0, 8)}
                </td>

                <td className="px-5 py-4">
                  {user.full_name}
                </td>

                <td className="px-5 py-4">
                  {user.email}
                </td>

                <td className="px-5 py-4 text-center">
                  <span className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700">
                    {user.role}
                  </span>
                </td>

                <td className="px-5 py-4 text-center">
                  <span
                    className={`rounded px-3 py-1 text-sm ${
                      user.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>

              </tr>
            ))
          )}

        </tbody>

      </table>

    </div>
  );
}