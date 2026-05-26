"use client";
import { useRanch } from "@/context/RanchContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Navigation, Trash2, ShoppingBasket, Map as MapIcon, Compass } from "lucide-react";
import dynamic from "next/dynamic";
import { MERCADOS_COORDS } from "@/data/mercados";
import SaveRouteButton from "./SaveRouteButton";
import { MessageModal } from "@/components/MessageModal";
import { loginUser } from "@/app/actions/auth";

const MapWithNoSSR = dynamic(() => import('@/components/RouteMap'), { ssr: false });

export default function RotaPage() {
  const { cart, removeFromRoute, clearRoute } = useRanch();
  const [showGuidedNav, setShowGuidedNav] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled) {
          setIsAuthenticated(Boolean(data?.user));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAuthenticated(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFollowClick = () => {
    if (isAuthenticated) {
      setShowGuidedNav((current) => !current);
      return;
    }

    setShowLoginModal(true);
  };

  if (cart.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-green-50 text-green-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Navigation size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">A tua rota está vazia</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Adiciona produtos à tua lista a partir da página de Produtos para organizarmos o teu "Dia de Rancho".</p>
        <Link href="/produtos" className="bg-green-800 text-white font-bold px-8 py-3 rounded-full hover:bg-green-900 transition flex items-center gap-2 w-max mx-auto">
          <ShoppingBasket size={20} /> Ir para Produtos
        </Link>
      </div>
    );
  }

  // Group by Market
  const groupedCart: Record<string, typeof cart> = {};
  cart.forEach(item => {
    if (!groupedCart[item.mercado]) {
      groupedCart[item.mercado] = [];
    }
    groupedCart[item.mercado].push(item);
  });

  const mercadorias = Object.keys(groupedCart);
  
  // Calculate totals
  const totalGeral = cart.reduce((acc, item) => acc + item.valor, 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
            Minha Rota <MapIcon className="text-green-800" />
          </h1>
          <p className="text-gray-600">O teu roteiro geográfico interativo para o "Dia de Rancho" em Maputo.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 text-right w-full sm:w-auto mb-2">
            <p className="text-sm font-bold text-gray-500 uppercase">Custo Total Estimado</p>
            <p className="text-3xl font-black text-green-800">{totalGeral} MT</p>
          </div>
          <SaveRouteButton />
        </div>
      </div>

      <div className={showLoginModal ? "grid grid-cols-1 lg:grid-cols-2 gap-10 blur-sm pointer-events-none" : "grid grid-cols-1 lg:grid-cols-2 gap-10"}>
        {/* Map Column */}
        <div className="w-full relative z-0 lg:sticky lg:top-28 h-max">
          <MapWithNoSSR markets={mercadorias} showGuidedNav={showGuidedNav} />
          
          {/* Navigation Button */}
          <div className="mt-6">
            <button
              onClick={handleFollowClick}
              className="bg-yellow-400 text-yellow-950 font-black px-6 py-4 rounded-full hover:bg-yellow-500 transition shadow-lg flex items-center justify-center gap-3 text-lg w-full transform hover:scale-[1.02]"
            >
              <Compass size={24} /> {showGuidedNav ? "Parar Navegação" : "Seguir a Minha Rota"}
            </button>
            <p className="text-center text-xs text-gray-500 mt-3">Navegue pela sua rota no mapa interativo sem sair do site</p>
          </div>
        </div>

        {/* Timeline Column */}
        <div className="relative border-l-4 border-yellow-400 pl-6 md:pl-10 space-y-12 pb-10 mt-4 lg:mt-0">
          {mercadorias.map((mercado, index) => {
            const items = groupedCart[mercado];
            const subtotal = items.reduce((acc, current) => acc + current.valor, 0);
            const cidade = items[0].cidade; // they share the same market/city
            
            return (
              <div key={mercado} className="relative z-10">
                {/* Timeline dot */}
                <div className="absolute -left-[45px] md:-left-[61px] top-0 bg-yellow-400 w-10 h-10 rounded-full flex items-center justify-center font-black text-yellow-900 border-4 border-white shadow-sm">
                  {index + 1}
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 uppercase">Paragem: {mercado}</h2>
                      <div className="flex items-center text-gray-500 mt-1">
                        <MapPin size={14} className="mr-1 text-green-800" />
                        <span className="text-sm uppercase font-semibold">{cidade}</span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase">Subtotal</p>
                      <p className="text-xl font-black text-gray-900">{subtotal} MT</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={`${item.id}-${mercado}`} className="flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-50 relative overflow-hidden border border-gray-100 shrink-0">
                            <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm md:text-base">{item.nome}</p>
                            <p className="text-[10px] md:text-xs text-green-800 font-semibold">{item.categoria}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-gray-800">{item.valor} MT</p>
                          <button 
                            onClick={() => removeFromRoute(item.id, mercado)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center mt-6 relative z-10 w-full mb-10 pt-10 border-t border-gray-200">
        <button 
          onClick={() => {
            clearRoute();
            setShowMessageModal(true);
          }}
          className="text-gray-400 hover:text-red-500 font-bold transition-colors underline flex items-center gap-2"
        >
          <Trash2 size={18} /> Limpar Rota Completa
        </button>
      </div>
      <MessageModal 
        isOpen={showMessageModal} 
        message="Lista elimidada" 
        onClose={() => setShowMessageModal(false)} 
      />

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-200">
            <h2 className="text-2xl font-black text-gray-900 mb-3">Inicia sessão para continuar</h2>
            <p className="text-sm text-gray-600 mb-6">
              Para usar a navegação da tua rota, faz login ou cria uma conta.
            </p>
            <form action={loginUser} className="space-y-4">
              <input type="hidden" name="redirectTo" value="/rota" />
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  className="w-full sm:w-auto flex-1 text-center bg-green-800 text-white font-bold px-5 py-3 rounded-xl hover:bg-green-700 transition"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="w-full sm:w-auto flex-1 text-center bg-gray-100 text-gray-700 font-bold px-5 py-3 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
            <p className="mt-5 text-sm text-gray-500">
              Não tens conta?{' '}
              <Link href="/register" className="font-semibold text-green-800 hover:text-green-700">
                Regista-te aqui
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
