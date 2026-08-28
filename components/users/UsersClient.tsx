"use client";

import UserTable from "./UserTable";

interface Props {
  users: any[];
}

export default function UsersClient({ users }: Props) {
  return <UserTable users={users} />;
}