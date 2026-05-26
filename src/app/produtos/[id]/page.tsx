"use client";
import { products } from "@/data/produtos";
import { useRanch } from "@/context/RanchContext";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowLeft, Plus, Check, ShoppingBasket, LayoutGrid } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductDetailPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const { cart, addToRoute, removeFromRoute } = useRanch();
  const [sugestoes, setSugestoes] = useState<typeof products>([]);

  const product = products.find(p => p.id === id);

  // Use useEffect to ensure randomization happens only on client to prevent hydration mismatch
  useEffect(() => {
    if (product) {
      const allOtherProducts = products.filter(p => p.id !== product.id);
      const shuffled = [...allOtherProducts].sort(() => 0.5 - Math.random());
      setSugestoes(shuffled.slice(0, 4));
    }
  }, [product?.id]);

  if (!product) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Produto não encontrado</h1>
        <Link href="/produtos" className="text-green-800 underline font-bold">Voltar para a lista</Link>
      </div>
    );
  }

  const menorPreco = Math.min(...product.precos.map(p => p.valor));

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10">
      <Link href="/produtos" className="inline-flex items-center gap-2 text-green-800 font-bold mb-8 hover:underline">
        <ArrowLeft size={16} /> Voltar à lista
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex items-center justify-center">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-50">
            <Image src={product.imagem} alt={product.nome} fill className="object-cover" />
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-semibold text-green-800 bg-green-50 w-max px-3 py-1 rounded-full mb-4">
            {product.categoria}
          </p>
          <h1 className="text-4xl font-black text-gray-900 mb-6">{product.nome}</h1>
          
          <div className="prose prose-green mb-10 text-gray-600">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Sobre este produto</h3>
            <p>{product.descricao}</p>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-4">Onde Comprar</h3>
          <div className="space-y-4">
            {product.precos.map((p, i) => {
              const isDestaque = p.valor === menorPreco;
              const inCart = cart.some(c => c.id === product.id && c.mercado === p.mercado);
              
              return (
                <div key={i} className={`flex justify-between items-center p-4 rounded-2xl border ${isDestaque ? 'border-green-800 bg-green-50/50 shadow-sm' : 'border-gray-100 bg-white shadow-sm'}`}>
                  <div>
                    <p className="text-sm font-bold text-gray-700 uppercase">{p.mercado}</p>
                    <div className="flex items-center text-gray-500 mt-1">
                      <MapPin size={14} className="mr-1" />
                      <span className="text-xs uppercase">{p.cidade}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-2xl font-black ${isDestaque ? 'text-green-800' : 'text-gray-900'}`}>
                        {p.valor} MT
                      </p>
                      {isDestaque && <span className="text-[10px] font-bold text-green-800 uppercase">Melhor Preço</span>}
                    </div>

                    <button 
                      onClick={() => {
                        if (inCart) {
                          removeFromRoute(product.id, p.mercado);
                        } else {
                          addToRoute({
                            ...product,
                            mercado: p.mercado,
                            cidade: p.cidade,
                            valor: p.valor
                          });
                        }
                      }}
                      className={`w-12 h-12 rounded-full flex justify-center items-center transition-all ${inCart ? 'bg-green-800 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-yellow-400 hover:text-yellow-900 hover:shadow-md'}`}
                      title={inCart ? "Remover da Rota" : "Adicionar à Rota"}
                    >
                      {inCart ? <Check size={20} /> : <Plus size={20} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Suggested Products Section */}
      <div className="pt-10 border-t border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Sugestões para adicionar à tua rota</h2>
            <p className="text-gray-600">Continua a preencher o teu "Dia de Rancho" com estas opções.</p>
          </div>
          <Link href="/rota" className="hidden sm:flex bg-green-800 text-white px-6 py-2 rounded-full font-bold hover:bg-green-900 transition items-center gap-2 shadow-sm">
            <ShoppingBasket size={18} /> Ver Minha Rota
          </Link>
        </div>

        {sugestoes.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {sugestoes.map((item) => {
              // Find the best price to automatically add when clicking the plus button
              const melhorPrecoObj = item.precos.reduce((prev, curr) => prev.valor < curr.valor ? prev : curr);
              const isItemInCart = cart.some(c => c.id === item.id && c.mercado === melhorPrecoObj.mercado);

              return (
                <Link href={`/produtos/${item.id}`} key={item.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100 flex flex-col group cursor-pointer relative">
                  <div className="w-full aspect-square relative bg-gray-50 rounded-xl overflow-hidden mb-4">
                    <Image src={item.imagem} alt={item.nome} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm md:text-base mb-1 line-clamp-1 group-hover:text-green-800 transition-colors">{item.nome}</h3>
                  <p className="text-xs text-green-800 font-semibold mb-3">{item.categoria}</p>
                  
                  <div className="mt-auto flex justify-between items-center z-10">
                    <span className="text-sm font-black text-gray-900">{melhorPrecoObj.valor} MT</span>
                    
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isItemInCart) {
                          removeFromRoute(item.id, melhorPrecoObj.mercado);
                        } else {
                          addToRoute({
                            ...item,
                            mercado: melhorPrecoObj.mercado,
                            cidade: melhorPrecoObj.cidade,
                            valor: melhorPrecoObj.valor
                          });
                        }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${isItemInCart ? 'bg-green-800 text-white' : 'bg-green-50 text-green-800 hover:bg-yellow-400 hover:text-yellow-900'}`}
                      title={isItemInCart ? "Remover da Rota" : "Adicionar Melhor Preço à Rota"}
                    >
                      {isItemInCart ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="w-full p-8 text-center bg-white rounded-2xl border border-gray-100 animate-pulse">
            <p className="text-gray-400 font-semibold">A carregar sugestões...</p>
          </div>
        )}
        
        {/* View All Products and Mobile View CTA */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/produtos" className="bg-white border-2 border-green-800 text-green-800 w-full sm:w-auto text-center px-8 py-3 justify-center rounded-full font-bold hover:bg-green-50 transition flex items-center gap-2">
              <LayoutGrid size={18} /> Ver Todos os Produtos
            </Link>
            
            <Link href="/rota" className="sm:hidden bg-green-800 text-white w-full text-center px-8 py-3 justify-center rounded-full font-bold hover:bg-green-900 transition flex items-center gap-2 shadow-sm">
              <ShoppingBasket size={18} /> Ver Minha Rota
            </Link>
        </div>
      </div>
    </div>
  );
}
