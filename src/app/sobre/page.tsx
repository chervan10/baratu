export default function SobrePage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-black text-gray-900 mb-6">Sobre Nós</h1>
      
      <div className="prose prose-lg prose-green max-w-none space-y-6 text-gray-700">
        <p>
          O <strong>Baratu</strong> nasceu de uma necessidade real de ajudar as famílias moçambicanas, especificamente em Maputo, a encontrarem os melhores preços para a sua mercearia básica e produtos do dia-a-dia.
        </p>
        
        <p>
          Todos os dias, a nossa equipa monitoriza diversos mercados (como Zimpeto, Xipamanine, Malanga) e supermercados da cidade, recolhendo e atualizando os preços dos bens mais essenciais. O objetivo é criar transparência nos preços e garantir que saibas sempre onde o teu metical vale mais.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">A Nossa Missão</h2>
        <p>
          Tornar a pesquisa pelo melhor preço fácil, acessível e disponível para todos os cidadãos da cidade de Maputo através de uma plataforma digital moderna e gratuita.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Como Funciona?</h2>
        <p>
          Basta pesquisares o produto que precisas (por exemplo "Arroz" ou "Tomate") e nós mostramos-te uma tabela comparativa dos preços nos diferentes estabelecimentos. Destacamos sempre a opção mais barata (Melhor Preço) para facilitar a tua escolha antes de saíres de casa. Agora também podes criar a tua "Rota" adicionando os itens, para otimizar o teu "Dia de Rancho"!
        </p>
      </div>
    </div>
  );
}
