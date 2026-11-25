import { redirect } from "next/navigation";
import AdminPanel from "@/components/AdminPanel";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "Panel admin" };

export default async function AdminPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/login");
  return <AdminPanel username={admin.username} />;
}
