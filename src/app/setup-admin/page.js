import { redirect } from "next/navigation";
import { SetupAdminForm } from "@/components/AuthForms";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "Setup admin pertama" };

export default function SetupAdminPage() {
  if (getDb().prepare("SELECT id FROM admins LIMIT 1").get()) redirect("/login");
  return <SetupAdminForm />;
}
