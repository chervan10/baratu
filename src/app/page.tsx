"use client";

import Link from "next/link";
import { products } from "@/data/produtos";
import Image from "next/image";
import { Search, MapPin, TrendingDown, Plus } from "lucide-react";
import NotificationToast from "./NotificationToast";
import { useRanch } from "@/context/RanchContext";
import { useAuth } from "@/context/AuthContext";
import { MessageModal } from "@/components/MessageModal";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingModal } from "@/components/LoadingModal";

export default function Home({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const [params, setParams] = useState<{ success?: string } | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [destaques, setDestaques] = useState<typeof products>([]);
  const { addToRoute } = useRanch();
  const { checkAuth } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    searchParams.then(setParams);
  }, [searchParams]);

  useEffect(() => {
    if (params?.success === "profile_created") {
      setShowWelcomeModal(true);
    }
  }, [params]);

  useEffect(() => {
    // Shuffle products and select 4 random ones
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    setDestaques(shuffled.slice(0, 4));
  }, []);

  const handleAddToCart = (product: typeof products[0]) => {
    if (!checkAuth()) return;
    const cheapestPrice = product.precos.reduce((min, p) => p.valor < min.valor ? p : min);
    const cartItem = {
      id: product.id,
      nome: product.nome,
      imagem: product.imagem,
      mercado: cheapestPrice.mercado,
      cidade: cheapestPrice.cidade,
      valor: cheapestPrice.valor,
      categoria: product.categoria
    };
    addToRoute(cartItem);
    toast.success(`O produto ${product.nome} foi adicionado ao carrinho!`);
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get('q') as string;
    if (!query.trim()) return;

    setIsSearching(true);
    // Wait 2-3 seconds
    const delay = Math.random() * 1000 + 2000; // 2-3 seconds
    await new Promise(resolve => setTimeout(resolve, delay));

    // Search for product (case insensitive partial match)
    const foundProduct = products.find(p => 
      p.nome.toLowerCase().includes(query.toLowerCase())
    );

    setIsSearching(false);

    if (foundProduct) {
      router.push(`/produtos/${foundProduct.id}`);
    } else {
      router.push(`/produtos?notfound=${encodeURIComponent(query)}`);
    }
  };

  const success = params?.success;

  return (
    <div className="w-full relative pb-20">
      <NotificationToast success={success} />
      <MessageModal
        isOpen={showWelcomeModal}
        title="Bem Vindo ao BARATU"
        message="agora podes navegar no nosso mercado e fazer a usa lista de rancho para o mês."
        buttonText="OK"
        onClose={() => {
          setShowWelcomeModal(false);
          router.push("/");
        }}
      />
      <section className="bg-green-800 text-white py-20 px-4 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tight max-w-4xl">
          Encontra os Melhores <span className="text-yellow-400">Preços</span> do Dia em Maputo
        </h1>
        <p className="text-lg md:text-xl text-green-100 mb-10 max-w-2xl">
          Nós visitamos os mercados de Maputo todos os dias para que possas poupar nas tuas compras. Organiza o teu dia de compras ("Dia de Rancho") e traça a tua rota!
        </p>
        
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            name="q"
            placeholder="O que procuras hoje?"
            className="w-full py-4 pl-12 pr-28 sm:pr-40 rounded-full bg-white text-gray-900 text-base sm:text-lg outline-none focus:ring-4 focus:ring-yellow-100/50 transition-all shadow-2xl"
          />
          <button type="submit" className="absolute right-2 top-2 bottom-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-4 sm:px-6 flex items-center justify-center rounded-full transition-all text-sm sm:text-base">
            <span className="hidden sm:inline">Buscar</span>
            <span className="sm:hidden">Buscar</span>
          </button>
        </form>
      </section>

      {/* Destaques */}
      <section className="max-w-7xl mx-auto px-4 mt-[-40px] relative z-10">
        <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-3xl shadow-md border border-gray-50">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <TrendingDown className="text-green-800" /> Destaques do Dia
          </h2>
          <Link href="/produtos" className="text-green-800 font-bold hover:underline">
            Ver todos &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destaques.map((item) => {
            const menorPreco = Math.min(...item.precos.map(p => p.valor));
            return (
              <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col group hover:-translate-y-1 relative">
                <Link href={`/produtos/${item.id}`} className="flex flex-col flex-1">
                  <div className="h-48 relative w-full mb-4 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center">
                    <Image src={item.imagem} alt={item.nome} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-800 mb-1">{item.nome}</h3>
                  <p className="text-sm text-gray-500 mb-6">{item.categoria}</p>
                  
                  <div className="mt-auto">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">A partir de</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-green-800">{menorPreco} MT</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(item);
                  }}
                  className="absolute top-3 right-3 bg-green-800 text-white p-2 rounded-full hover:bg-green-700 transition-colors shadow-md"
                  title="Adicionar ao carrinho"
                >
                  <Plus size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
      <LoadingModal isOpen={isSearching} message="Searching for product" />
    </div>
  );
}