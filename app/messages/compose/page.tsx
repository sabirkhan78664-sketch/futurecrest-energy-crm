export const dynamic = "force-dynamic";

import MainLayout from "@/components/layout/MainLayout";
import { getCurrentUserProfile } from "@/lib/auth";
import { getMessageUsers } from "@/lib/users";
import { redirect } from "next/navigation";
import ComposeForm from "../../../components/messages/ComposeForm";

export default async function ComposePage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const users = await getMessageUsers();

  return (
    <MainLayout>
      <ComposeForm
        profile={profile}
        users={users}
      />
    </MainLayout>
  );
}