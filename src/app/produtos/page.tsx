"use client";
import { useState, Suspense } from 'react';
import { products } from '@/data/produtos';
import Image from 'next/image';
import { Search, MapPin, Plus } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useContext } from 'react';
import { useRanch } from '@/context/RanchContext';
import toast from 'react-hot-toast';

function ProdutosContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || "";
  const notFound = searchParams.get('notfound');
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const { addToRoute } = useRanch();

  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.categoria)))];

  const filtered = products.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: typeof products[0]) => {
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Produtos</h1>
          <p className="text-gray-600">Compara os preços nos mercados de Maputo e faz a tua Rota do dia!</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Pesquisar produto..."
            className="w-full p-3 pl-12 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-green-800 transition-all border border-gray-200 shadow-sm"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {notFound && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-center font-semibold">
          Item not found or Item out of stock: "{notFound}"
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-green-800 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-green-800 hover:text-green-800'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filtered.map((item) => {
          const menorPreco = Math.min(...item.precos.map(p => p.valor));
          return (
            <div key={item.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 hover:shadow-lg transition-all group relative">
              <Link href={`/produtos/${item.id}`} className="flex flex-col sm:flex-row gap-6 flex-1">
                <div className="w-full sm:w-1/3 aspect-square relative bg-gray-50 rounded-2xl overflow-hidden shrink-0">
                  <Image src={item.imagem} alt={item.nome} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h2 className="font-bold text-2xl text-gray-800 mb-1 group-hover:text-green-800 transition-colors">{item.nome}</h2>
                  <p className="text-sm font-semibold text-green-800 bg-green-50 w-max px-3 py-1 rounded-full mb-6">
                    {item.categoria}
                  </p>

                  <div className="space-y-3 mt-auto">
                    {item.precos.map((p, i) => {
                      const isDestaque = p.valor === menorPreco;
                      return (
                        <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${isDestaque ? 'border-green-800 bg-green-50/50' : 'border-gray-100 bg-gray-50'}`}>
                          <div>
                            <p className="text-[11px] font-bold text-gray-600 uppercase">{p.mercado}</p>
                            <div className="flex items-center text-gray-500">
                              <MapPin size={12} className="mr-1" />
                              <span className="text-[10px] uppercase">{p.cidade}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <p className={`text-lg font-black ${isDestaque ? 'text-green-800' : 'text-gray-700'}`}>
                              {p.valor} MT
                            </p>
                            {isDestaque && <span className="text-[9px] font-bold text-green-800 uppercase bg-white px-2 py-0.5 rounded-full border border-green-100 inline-block">Melhor Preço</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart(item);
                }}
                className="absolute top-4 right-4 bg-green-800 text-white p-2 rounded-full hover:bg-green-700 transition-colors shadow-md"
                title="Adicionar ao carrinho"
              >
                <Plus size={20} />
              </button>
            </div>
          );
        })}
      </div>
      
      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500 bg-white rounded-3xl border border-gray-100">
          Nenhum produto encontrado para "{search}".
        </div>
      )}
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
        A carregar produtos...
      </div>
    }>
      <ProdutosContent />
    </Suspense>
  );
}
