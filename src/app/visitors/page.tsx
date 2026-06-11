import prisma from "@/lib/prisma";
import Link from "next/link";
import { Visitor } from "@prisma/client";
import { Users, Clock, Smartphone, Monitor, MapPin, Compass, ShieldAlert, Home, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Agora mesmo";
  if (diffMins < 60) return `Há ${diffMins} min`;
  if (diffHours < 24) return `Há ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  return `Há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
}

export default async function VisitorsDashboard() {
  let visitors: Visitor[] = [];
  let errorMsg: string | null = null;

  try {
    visitors = await prisma.visitor.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (err: any) {
    console.error("Dashboard DB fetch error:", err);
    errorMsg = err.message || "Não foi possível conectar à base de dados. Por favor configure a DATABASE_URL no ficheiro .env.";
  }

  // Calculate statistics
  const totalVisitors = visitors.length;
  const avgSessionTime = totalVisitors > 0
    ? Math.round(visitors.reduce((acc, v) => acc + v.sessionTime, 0) / totalVisitors)
    : 0;

  const mobileCount = visitors.filter(v => v.mobile === "Mobile").length;
  const mobilePercentage = totalVisitors > 0 ? ((mobileCount / totalVisitors) * 100).toFixed(1) : "0.0";
  const desktopPercentage = totalVisitors > 0 ? (((totalVisitors - mobileCount) / totalVisitors) * 100).toFixed(1) : "0.0";

  // Calculate active now (activity in last 1 minute)
  const activeNowThreshold = new Date(Date.now() - 1 * 60 * 1000);
  const activeNowCount = visitors.filter(v => {
    // If they were created recently, or if they had a long session and were updated recently
    const createdTime = new Date(v.createdAt).getTime();
    return (Date.now() - createdTime) < (v.sessionTime * 1000 + 30 * 1000); // session length + 30s buffer
  }).length;

  // Browser breakdown
  const browsersMap: Record<string, number> = {};
  visitors.forEach(v => {
    let name = "Outro";
    const b = v.browser.toLowerCase();
    if (b.includes("chrome")) name = "Chrome";
    else if (b.includes("safari")) name = "Safari";
    else if (b.includes("firefox")) name = "Firefox";
    else if (b.includes("edge")) name = "Edge";
    else if (b.includes("opera")) name = "Opera";
    else if (b.includes("ie")) name = "IE";
    
    browsersMap[name] = (browsersMap[name] || 0) + 1;
  });

  const browserBreakdown = Object.entries(browsersMap)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalVisitors > 0 ? ((count / totalVisitors) * 100).toFixed(1) : "0.0"
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10 flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-green-800 font-bold text-xs uppercase tracking-widest px-3 py-1 bg-green-100 rounded-full">
            Painel Administrativo
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-2 tracking-tight">
            Análise de Visitantes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Estatísticas de navegação, localização e especificações de dispositivos em tempo real.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm shadow-sm transition-all hover:scale-[1.02]"
          >
            <Home size={16} />
            Início
          </Link>
          <Link
            href="/visitors"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-800 hover:bg-green-700 text-white font-bold text-sm shadow-sm transition-all hover:scale-[1.02]"
          >
            <RefreshCw size={16} />
            Actualizar
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 mb-8 flex items-start gap-4">
          <div className="bg-red-100 text-red-800 p-3 rounded-2xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-red-900">Erro de Ligação à Base de Dados</h3>
            <p className="text-red-700 text-sm mt-1 mb-3">{errorMsg}</p>
            <div className="bg-white border border-red-100 rounded-xl p-3 text-xs font-mono text-red-800 overflow-x-auto max-w-full">
              DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
            </div>
            <p className="text-red-600 text-xs mt-3">
              Por favor configure a variável de ambiente <code className="bg-red-100 px-1 rounded">DATABASE_URL</code> no ficheiro <code className="bg-red-100 px-1 rounded">.env</code> e execute as migrações com <code className="bg-red-100 px-1 rounded">npx prisma db push</code>.
            </p>
          </div>
        </div>
      )}

      {/* Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total de Visitantes</p>
            <h3 className="text-3xl font-black text-gray-800 group-hover:scale-105 transition-transform origin-left">
              {totalVisitors}
            </h3>
          </div>
          <div className="bg-green-50 text-green-800 p-4 rounded-2xl group-hover:bg-green-100 transition-colors">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Tempo Médio de Sessão</p>
            <h3 className="text-3xl font-black text-gray-800 group-hover:scale-105 transition-transform origin-left">
              {formatDuration(avgSessionTime)}
            </h3>
          </div>
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-2xl group-hover:bg-yellow-100 transition-colors">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Sessões Mobile</p>
            <h3 className="text-3xl font-black text-gray-800 group-hover:scale-105 transition-transform origin-left">
              {mobilePercentage}%
            </h3>
          </div>
          <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl group-hover:bg-blue-100 transition-colors">
            <Smartphone size={24} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Activos Agora</p>
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-black text-gray-800 group-hover:scale-105 transition-transform origin-left">
                {activeNowCount}
              </h3>
              {activeNowCount > 0 && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl group-hover:bg-emerald-100 transition-colors">
            <Monitor size={24} />
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Device Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-1">
          <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
            <Smartphone size={18} className="text-green-800" /> Distribuição de Dispositivos
          </h3>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-full flex h-6 rounded-full overflow-hidden bg-gray-100 mb-6">
              <div 
                style={{ width: `${mobilePercentage}%` }} 
                className="bg-green-800 transition-all duration-1000 flex items-center justify-center text-[10px] text-white font-bold"
                title={`Mobile: ${mobilePercentage}%`}
              />
              <div 
                style={{ width: `${desktopPercentage}%` }} 
                className="bg-yellow-400 transition-all duration-1000 flex items-center justify-center text-[10px] text-yellow-950 font-bold"
                title={`Desktop: ${desktopPercentage}%`}
              />
            </div>
            
            <div className="w-full grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-50/50 border border-green-100">
                <Smartphone className="text-green-800" size={18} />
                <div>
                  <span className="text-xs text-gray-500 block">Mobile</span>
                  <span className="font-extrabold text-gray-800">{mobilePercentage}%</span>
                  <span className="text-[10px] text-gray-400 block">({mobileCount} visitas)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-yellow-50/30 border border-yellow-100">
                <Monitor className="text-yellow-600" size={18} />
                <div>
                  <span className="text-xs text-gray-500 block">Desktop</span>
                  <span className="font-extrabold text-gray-800">{desktopPercentage}%</span>
                  <span className="text-[10px] text-gray-400 block">({totalVisitors - mobileCount} visitas)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Browser Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
            <Compass size={18} className="text-green-800" /> Browsers Populares
          </h3>
          <div className="space-y-4">
            {browserBreakdown.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">Nenhum dado disponível</p>
            ) : (
              browserBreakdown.map((browser, idx) => (
                <div key={browser.name} className="flex flex-col">
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-800" style={{ opacity: 1 - idx * 0.15 }} />
                      {browser.name}
                    </span>
                    <span className="font-extrabold text-gray-800">{browser.percentage}% <span className="text-gray-400 font-normal">({browser.count})</span></span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className="bg-green-800 h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${browser.percentage}%`,
                        backgroundColor: `rgba(22, 101, 52, ${1 - idx * 0.15})`
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Visitor Detail Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-lg text-gray-800">Registos Recentes</h3>
          <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-bold">
            Ordenado por mais recente
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider bg-gray-50/20">
                <th className="px-6 py-4">Localização</th>
                <th className="px-6 py-4">Dispositivo</th>
                <th className="px-6 py-4">Navegador</th>
                <th className="px-6 py-4">Duração</th>
                <th className="px-6 py-4">Especificações</th>
                <th className="px-6 py-4 text-right">Data / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Nenhum visitante registado. Comece por abrir o site.
                  </td>
                </tr>
              ) : (
                visitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-green-50/10 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2">
                      <MapPin size={14} className="text-red-500" />
                      {visitor.location}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        visitor.mobile === "Mobile" 
                          ? "bg-blue-50 text-blue-700 border border-blue-100" 
                          : "bg-yellow-50 text-yellow-800 border border-yellow-100"
                      }`}>
                        {visitor.mobile === "Mobile" ? <Smartphone size={12} /> : <Monitor size={12} />}
                        {visitor.mobile}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {visitor.browser}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-green-800">
                      {formatDuration(visitor.sessionTime)}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono truncate max-w-xs" title={visitor.phoneSpec}>
                      {visitor.phoneSpec}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                      {formatRelativeTime(visitor.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
