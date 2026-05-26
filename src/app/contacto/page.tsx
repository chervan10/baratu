import { Mail, MapPin } from "lucide-react";

export default function ContactoPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-black text-gray-900 mb-6">Contacto</h1>
      <p className="text-lg text-gray-600 mb-12">
        Tens alguma dúvida, sugestão ou queres reportar um preço incorreto? A nossa equipa está sempre disponível para ti.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center text-green-800 mb-6">
            <Mail size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">E-mail</h2>
          <p className="text-gray-500 mb-6">Para parcerias, suporte ou protestos.</p>
          <a href="mailto:geral@baratu.co.mz" className="text-xl font-bold text-green-800 hover:underline">
            geral@baratu.co.mz
          </a>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="bg-yellow-50 w-16 h-16 rounded-full flex items-center justify-center text-yellow-600 mb-6">
            <MapPin size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">A Nossa Sede</h2>
          <p className="text-gray-500 mb-6">Onde a magia acontece.</p>
          <p className="text-lg font-bold text-gray-800">
            Maputo, Moçambique
          </p>
        </div>
      </div>
    </div>
  );
}
