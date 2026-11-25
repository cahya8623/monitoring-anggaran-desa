import { ResetPasswordForm } from "@/components/AuthForms";
export const metadata = { title: "Atur ulang password" };
export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams;
  return <ResetPasswordForm token={typeof params?.token === "string" ? params.token : ""} />;
}
