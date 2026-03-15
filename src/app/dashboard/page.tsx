import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/auth";

export default function DashboardIndexPage() {
  const auth = getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  if (auth.role === "parent") redirect("/dashboard/parent");
  if (auth.role === "child") redirect("/dashboard/child");
  redirect("/dashboard/admin");
}