import { redirect } from "next/navigation";

export default function NewCloserPage() {
  redirect("/users/new?role=Closer");
}