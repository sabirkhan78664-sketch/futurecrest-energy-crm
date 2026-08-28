import MainLayout from "@/components/layout/MainLayout";
import { requireRole } from "@/lib/auth";
import UserForm from "../../../components/users/UserForm";

export default async function NewUserPage() {
  await requireRole(["Super Admin"]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Add New User
          </h1>

          <p className="text-slate-500">
            Create a new CRM user
          </p>
        </div>

        <UserForm />
      </div>
    </MainLayout>
  );
}