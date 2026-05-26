import { getUser } from "@/lib/auth";
import { getUserRoute } from "@/app/actions/routeActions";
import { redirect } from "next/navigation";
import LoadRouteButton from "./LoadRouteButton";
import { LogoutConfirmationModal } from "./LogoutConfirmationModal";
import Image from "next/image";
import { MapPin } from "lucide-react";

export default async function PerfilPage() {
  const user = await getUser();
  
  if (!user) {
    redirect("/login");
  }

  const savedRoute = await getUserRoute();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Olá, {user.name}</h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <LogoutConfirmationModal />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">A tua Última Lista Guardada</h2>
        
        {savedRoute.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-10 text-center text-gray-500">
            Ainda não guardaste nenhuma lista. Vai até à Rota e guarda a tua seleção!
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {savedRoute.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 relative rounded-xl overflow-hidden shrink-0 bg-white">
                    <Image src={item.imagem} alt={item.nome} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.nome}</h3>
                    <div className="flex items-center text-gray-500 text-xs">
                      <MapPin size={12} className="mr-1" />
                      <span className="uppercase">{item.mercado}</span>
                    </div>
                  </div>
                  <div className="font-black text-green-800">
                    {item.valor} MT
                  </div>
                </div>
              ))}
            </div>
            
            <LoadRouteButton savedItems={savedRoute} />
          </div>
        )}
      </div>
    </div>
  );
}
