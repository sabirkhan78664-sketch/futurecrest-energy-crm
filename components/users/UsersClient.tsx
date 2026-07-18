"use client";

import { useEffect, useState } from "react";
import { getUsers } from "@/lib/users";
import UserTable from "./UserTable";

export default function UsersClient() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      const data = await getUsers();
      setUsers(data);
      setLoading(false);
    }

    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow">
        Loading users...
      </div>
    );
  }

  return <UserTable users={users} />;
}