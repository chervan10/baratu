import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSubmissionsDashboard from "./AdminSubmissionsDashboard";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  // 1. Server-side session authentication
  const user = await getUser();

  if (!user) {
    redirect("/login?redirect=/admin/submissions");
  }

  // 2. Server-side admin authorization check
  const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
  const adminEmails = adminEmailsEnv
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const isUserAdmin = adminEmails.length > 0 
    ? adminEmails.includes(user.email.toLowerCase())
    : user.email.toLowerCase() === "chervan.cachaco@gmail.com";

  if (!isUserAdmin) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 max-w-lg mx-auto">
          <h1 className="text-3xl font-black text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">
            A sua conta (<strong className="text-gray-800">{user.email}</strong>) não possui privilégios de administrador para aceder a esta página.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-stone-900 text-white font-bold text-sm rounded-full hover:bg-stone-800 transition-all"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  // 3. Render the client-side interactive dashboard
  return <AdminSubmissionsDashboard adminUser={user} />;
}
