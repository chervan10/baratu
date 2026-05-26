export default function ProductCard({ product }) {
  const cheapest = [...product.precos].sort((a, b) => a.valor - b.valor)[0];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex items-center gap-4 active:scale-95 transition-transform">
      <div className="text-4xl bg-green-50 p-3 rounded-lg">{product.imagem}</div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-800 uppercase text-sm tracking-wide">{product.nome}</h3>
        <p className="text-xs text-gray-500">{product.categoria}</p>
        <div className="mt-1">
          <span className="text-green-700 font-black text-lg">{cheapest.valor},00 MT</span>
          <span className="text-[10px] ml-2 text-gray-400">em {cheapest.mercado}</span>
        </div>
      </div>
      <div className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">
        {cheapest.cidade}
      </div>
    </div>
  );
}