import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

const secretKey = process.env.JWT_SECRET || "fallback_secret_for_development";
const key = new TextEncoder().encode(secretKey);

export default async function AdminPage() {
  const sessionCookie = (await cookies()).get("admin_session")?.value;

  if (!sessionCookie) {
    redirect("/admin/login");
  }

  let adminEmail = "";
  try {
    const { payload } = await jwtVerify(sessionCookie, key);
    adminEmail = payload.email as string;
  } catch (err) {
    redirect("/admin/login");
  }

  return <AdminDashboardClient adminEmail={adminEmail} />;
}
