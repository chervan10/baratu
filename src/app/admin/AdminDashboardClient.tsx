"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  Users, 
  Clock, 
  Smartphone, 
  Monitor, 
  MapPin, 
  Compass, 
  Search, 
  Calendar, 
  Download, 
  LogOut, 
  Mail, 
  RefreshCw, 
  X, 
  ArrowRight,
  MessageSquare,
  FileText,
  User,
  Globe,
  Settings,
  Grid,
  ShoppingBag,
  Package,
  DollarSign,
  Phone
} from "lucide-react";

interface Visitor {
  id: string;
  visitorId: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  browserVersion: string;
  operatingSystem: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  language: string;
  timezone: string;
  country: string;
  city: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  sessionStart: string;
  sessionEnd: string | null;
  sessionDuration: number;
  visitDate: string;
  createdAt: string;
}

interface Submission {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  verifiedEmail: boolean;
  createdAt: string;
}

interface OrderItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  mercado?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  country: string;
  provinceState: string | null;
  city: string;
  address: string;
  postalCode: string;
  orderNotes: string | null;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
  items: OrderItem[];
}

interface AdminDashboardClientProps {
  adminEmail: string;
}

export default function AdminDashboardClient({ adminEmail }: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"visitors" | "contacts" | "orders">("visitors");
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Filters & Search States
  const [vSearch, setVSearch] = useState("");
  const [vCountry, setVCountry] = useState("");
  const [vBrowser, setVBrowser] = useState("");
  const [vDate, setVDate] = useState("");
  
  const [cSearch, setCSearch] = useState("");
  const [cDate, setCDate] = useState("");

  const [oSearch, setOSearch] = useState("");
  const [oStatus, setOStatus] = useState("");
  const [oDate, setODate] = useState("");

  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const router = useRouter();

  // Fetch all dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch visitors with current filters
      const vParams = new URLSearchParams();
      if (vSearch) vParams.append("search", vSearch);
      if (vCountry) vParams.append("country", vCountry);
      if (vBrowser) vParams.append("browser", vBrowser);
      if (vDate) vParams.append("date", vDate);

      const vRes = await fetch(`/api/admin/analytics?${vParams.toString()}`);
      const vData = await vRes.json();
      if (vRes.ok) {
        setVisitors(vData.visitors || []);
      }

      // 2. Fetch contact submissions with current filters
      const cParams = new URLSearchParams();
      if (cSearch) cParams.append("search", cSearch);
      if (cDate) cParams.append("date", cDate);

      const cRes = await fetch(`/api/admin/submissions?${cParams.toString()}`);
      const cData = await cRes.json();
      if (cRes.ok) {
        setSubmissions(cData.submissions || []);
      }

      // 3. Fetch e-commerce orders with current filters
      const oParams = new URLSearchParams();
      if (oSearch) oParams.append("search", oSearch);
      if (oStatus) oParams.append("status", oStatus);
      if (oDate) oParams.append("date", oDate);

      const oRes = await fetch(`/api/admin/orders?${oParams.toString()}`);
      const oData = await oRes.json();
      if (oRes.ok) {
        setOrders(oData.orders || []);
      }

    } catch (err) {
      console.error(err);
      toast.error("Erro ao actualizar dados do painel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [vCountry, vBrowser, vDate, cDate, oStatus, oDate]); // instant reload on dropdown/date changes

  // Trigger search filters
  const handleVisitorSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleContactSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOrderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Status transitions
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Estado da encomenda atualizado para "${newStatus}".`);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
        setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, orderStatus: newStatus } : prev);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao atualizar estado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de rede ao atualizar estado da encomenda.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Sessão terminada.");
        router.push("/admin/login");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao terminar sessão.");
      setLoggingOut(false);
    }
  };

  // Calculate statistics for visitors
  const totalVisitors = visitors.length;
  const avgSessionTime = totalVisitors > 0
    ? Math.round(visitors.reduce((acc, v) => acc + v.sessionDuration, 0) / totalVisitors)
    : 0;

  // Active Now (updated in the last 1 minute)
  const activeNowCount = visitors.filter(v => {
    const lastActive = v.sessionEnd ? new Date(v.sessionEnd).getTime() : new Date(v.createdAt).getTime();
    return (Date.now() - lastActive) < (60 * 1000); // active in last 60s
  }).length;

  const mobileCount = visitors.filter(v => v.deviceType.toLowerCase() === "mobile").length;
  const tabletCount = visitors.filter(v => v.deviceType.toLowerCase() === "tablet").length;
  const desktopCount = totalVisitors - mobileCount - tabletCount;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Unique lists for dropdowns (computed from unfiltered baseline, but for UX simplicity, computed from current)
  const uniqueCountries = Array.from(new Set(visitors.map(v => v.country))).filter(Boolean);
  const uniqueBrowsers = Array.from(new Set(visitors.map(v => v.browser))).filter(Boolean);

  // CSV Exports
  const exportVisitorsCSV = () => {
    if (visitors.length === 0) {
      toast.error("Não há visitantes para exportar.");
      return;
    }
    const headers = ["ID Visitante", "Dispositivo", "Tipo", "Navegador", "Ecrã", "Idioma", "Fuso Horário", "País", "Cidade", "Região", "Latitude", "Longitude", "Início Sessão", "Duração (seg)", "Data"];
    const rows = [
      headers.join(","),
      ...visitors.map(v => [
        v.visitorId,
        `"${v.deviceName.replace(/"/g, '""')}"`,
        v.deviceType,
        `"${v.browser} ${v.browserVersion}"`,
        `"${v.screenWidth}x${v.screenHeight}"`,
        v.language,
        v.timezone,
        `"${v.country}"`,
        `"${v.city}"`,
        `"${v.region}"`,
        v.latitude || "",
        v.longitude || "",
        v.sessionStart,
        v.sessionDuration,
        v.visitDate
      ].join(","))
    ];
    downloadFile(rows.join("\n"), `visitantes_baratu_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportContactsCSV = () => {
    if (submissions.length === 0) {
      toast.error("Não há submissões para exportar.");
      return;
    }
    const headers = ["ID", "Data de Criacao", "Nome Completo", "E-mail", "Telefone", "Assunto", "Mensagem", "E-mail Verificado"];
    const rows = [
      headers.join(","),
      ...submissions.map(sub => [
        sub.id,
        new Date(sub.createdAt).toLocaleString("pt-MZ"),
        `"${sub.fullName.replace(/"/g, '""')}"`,
        sub.email,
        sub.phone || "",
        `"${sub.subject.replace(/"/g, '""')}"`,
        `"${sub.message.replace(/"/g, '""')}"`,
        sub.verifiedEmail ? "Sim" : "Não"
      ].join(","))
    ];
    downloadFile(rows.join("\n"), `contactos_baratu_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportOrdersCSV = () => {
    if (orders.length === 0) {
      toast.error("Não há encomendas para exportar.");
      return;
    }
    const headers = ["Nº Encomenda", "Cliente", "E-mail", "Telefone", "Cidade", "Total (MT)", "Estado", "Data"];
    const rows = [
      headers.join(","),
      ...orders.map(o => [
        o.orderNumber,
        `"${o.customerName.replace(/"/g, '""')}"`,
        o.customerEmail,
        `"${o.customerPhone}"`,
        `"${o.city.replace(/"/g, '""')}"`,
        o.totalAmount,
        o.orderStatus,
        new Date(o.createdAt).toLocaleDateString("pt-MZ")
      ].join(","))
    ];
    downloadFile(rows.join("\n"), `encomendas_baratu_${new Date().toISOString().split("T")[0]}.csv`);
  };

  // Export to Excel-ready format (copies TSV format to clipboard)
  const copyToExcelClipboard = (type: "visitors" | "contacts" | "orders") => {
    let content = "";
    if (type === "visitors") {
      if (visitors.length === 0) return toast.error("Sem dados.");
      const headers = ["ID Visitante", "Dispositivo", "Tipo", "Navegador", "País", "Cidade", "Duração", "Data"];
      content = headers.join("\t") + "\n" + visitors.map(v => [
        v.visitorId, v.deviceName, v.deviceType, `${v.browser} ${v.browserVersion}`, v.country, v.city, formatDuration(v.sessionDuration), v.visitDate
      ].join("\t")).join("\n");
    } else if (type === "contacts") {
      if (submissions.length === 0) return toast.error("Sem dados.");
      const headers = ["Data", "Nome", "E-mail", "Telefone", "Assunto", "Mensagem"];
      content = headers.join("\t") + "\n" + submissions.map(sub => [
        new Date(sub.createdAt).toLocaleDateString("pt-MZ"), sub.fullName, sub.email, sub.phone || "", sub.subject, sub.message
      ].join("\t")).join("\n");
    } else {
      if (orders.length === 0) return toast.error("Sem dados.");
      const headers = ["Nº Encomenda", "Cliente", "E-mail", "Telefone", "Cidade", "Total (MT)", "Estado", "Data"];
      content = headers.join("\t") + "\n" + orders.map(o => [
        o.orderNumber, o.customerName, o.customerEmail, o.customerPhone, o.city, o.totalAmount, o.orderStatus, new Date(o.createdAt).toLocaleDateString("pt-MZ")
      ].join("\t")).join("\n");
    }
    
    navigator.clipboard.writeText(content);
    toast.success("Dados copiados em formato Excel (TSV)!");
  };

  const downloadFile = (content: string, filename: string) => {
    const csvContent = "\uFEFF" + content;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen bg-stone-50/50">
      
      {/* Top bar header */}
      <header className="bg-green-800 text-white shadow-md border-b border-green-950 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="bg-yellow-400 text-green-900 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
            B
          </span>
          <span className="font-black tracking-wider text-lg">BARATU ADMIN</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="hidden sm:inline-block text-green-200">
            Sessão: <strong>{adminEmail}</strong>
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 border border-green-700 hover:bg-green-700 rounded-xl transition-all cursor-pointer font-bold text-xs"
          >
            {loggingOut ? <RefreshCw size={14} className="animate-spin" /> : <LogOut size={14} />}
            Sair
          </button>
        </div>
      </header>

      {/* Tabs navigation */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-6 py-2 flex gap-4">
        <button
          onClick={() => setActiveTab("visitors")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-black text-sm transition-all cursor-pointer ${
            activeTab === "visitors" 
              ? "border-green-800 text-green-800" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users size={16} />
          Análise de Visitantes
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-black text-sm transition-all cursor-pointer ${
            activeTab === "contacts" 
              ? "border-green-800 text-green-800" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <MessageSquare size={16} />
          Mensagens de Contacto
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-black text-sm transition-all cursor-pointer ${
            activeTab === "orders" 
              ? "border-green-800 text-green-800" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <ShoppingBag size={16} />
          Encomendas Compras
        </button>
      </div>

      {/* Content wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* Tab 1: Visitor Analytics */}
        {activeTab === "visitors" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Visual statistics row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Visitantes</p>
                  <h3 className="text-3xl font-black text-gray-800 flex items-baseline gap-1.5">
                    {totalVisitors}
                    <span className="text-xs text-gray-400 font-bold">/10 Máx</span>
                  </h3>
                </div>
                <div className="bg-green-50 text-green-800 p-4 rounded-2xl">
                  <Users size={24} />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Média de Sessão</p>
                  <h3 className="text-3xl font-black text-gray-800">{formatDuration(avgSessionTime)}</h3>
                </div>
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-2xl">
                  <Clock size={24} />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Sessões Mobile</p>
                  <h3 className="text-3xl font-black text-gray-800">
                    {totalVisitors > 0 ? ((mobileCount / totalVisitors) * 100).toFixed(1) : "0.0"}%
                  </h3>
                </div>
                <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl">
                  <Smartphone size={24} />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ativos Agora</p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-3xl font-black text-gray-800">{activeNowCount}</h3>
                    {activeNowCount > 0 && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl">
                  <Monitor size={24} />
                </div>
              </div>

            </div>

            {/* Layout analytics breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Devices distribution */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-4">
                <h3 className="font-bold text-base text-gray-800 mb-6 flex items-center gap-2">
                  <Smartphone size={16} className="text-green-800" /> Distribuição de Dispositivos
                </h3>
                <div className="flex flex-col items-center justify-center">
                  <div className="w-full flex h-5 rounded-full overflow-hidden bg-gray-100 mb-6">
                    <div 
                      style={{ width: `${totalVisitors > 0 ? (mobileCount / totalVisitors) * 100 : 0}%` }} 
                      className="bg-green-800 transition-all duration-500"
                      title="Telemóvel"
                    />
                    <div 
                      style={{ width: `${totalVisitors > 0 ? (tabletCount / totalVisitors) * 100 : 0}%` }} 
                      className="bg-yellow-400 transition-all duration-500"
                      title="Tablet"
                    />
                    <div 
                      style={{ width: `${totalVisitors > 0 ? (desktopCount / totalVisitors) * 100 : 0}%` }} 
                      className="bg-stone-800 transition-all duration-500"
                      title="Desktop"
                    />
                  </div>
                  
                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-800" /> Telemóvel (Mobile)
                      </span>
                      <span className="font-bold text-gray-800">
                        {mobileCount} ({totalVisitors > 0 ? ((mobileCount / totalVisitors) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Tablet
                      </span>
                      <span className="font-bold text-gray-800">
                        {tabletCount} ({totalVisitors > 0 ? ((tabletCount / totalVisitors) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-stone-800" /> Computador (Desktop)
                      </span>
                      <span className="font-bold text-gray-800">
                        {desktopCount} ({totalVisitors > 0 ? ((desktopCount / totalVisitors) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Geo & System Info Summary */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-8">
                <h3 className="font-bold text-base text-gray-800 mb-6 flex items-center gap-2">
                  <Globe size={16} className="text-green-800" /> Principais Países e Browsers
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Browsers list */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Browsers</h4>
                    <div className="space-y-3">
                      {uniqueBrowsers.length === 0 ? (
                        <p className="text-xs text-gray-400">Nenhum dado</p>
                      ) : (
                        uniqueBrowsers.slice(0, 4).map(b => {
                          const count = visitors.filter(v => v.browser === b).length;
                          const pct = ((count / totalVisitors) * 100).toFixed(0);
                          return (
                            <div key={b} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700 font-semibold">{b}</span>
                              <span className="font-bold text-gray-500">{count} visitas ({pct}%)</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Countries list */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Localizações (Países)</h4>
                    <div className="space-y-3">
                      {uniqueCountries.length === 0 ? (
                        <p className="text-xs text-gray-400">Nenhum dado</p>
                      ) : (
                        uniqueCountries.slice(0, 4).map(c => {
                          const count = visitors.filter(v => v.country === c).length;
                          const pct = ((count / totalVisitors) * 100).toFixed(0);
                          return (
                            <div key={c} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700 font-semibold">{c}</span>
                              <span className="font-bold text-gray-500">{count} visitas ({pct}%)</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Filter Bar for Visitors */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <form onSubmit={handleVisitorSearch} className="flex flex-col md:flex-row gap-4 items-end">
                
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Procurar</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      value={vSearch}
                      onChange={(e) => setVSearch(e.target.value)}
                      placeholder="Pesquisar por dispositivo, cidade, OS..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
                    />
                  </div>
                </div>

                <div className="w-full md:w-44">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">País</label>
                  <select
                    value={vCountry}
                    onChange={(e) => setVCountry(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
                  >
                    <option value="">Todos os Países</option>
                    {uniqueCountries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-44">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Browser</label>
                  <select
                    value={vBrowser}
                    onChange={(e) => setVBrowser(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
                  >
                    <option value="">Todos os Browsers</option>
                    {uniqueBrowsers.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-44">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Data</label>
                  <input
                    type="date"
                    value={vDate}
                    onChange={(e) => setVDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    type="submit"
                    className="flex-1 md:flex-initial px-6 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-extrabold shadow-sm transition-colors cursor-pointer"
                  >
                    Filtrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVSearch("");
                      setVCountry("");
                      setVBrowser("");
                      setVDate("");
                      fetchData(); // reload
                    }}
                    className="px-4 py-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-bold transition-colors cursor-pointer"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToExcelClipboard("visitors")}
                    title="Copiar para Excel"
                    className="p-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
                  >
                    <FileText size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={exportVisitorsCSV}
                    title="Exportar CSV"
                    className="p-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
                  >
                    <Download size={18} />
                  </button>
                </div>

              </form>
            </div>

            {/* Visitors Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-base text-gray-800">Visitantes Únicos ({visitors.length})</h3>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="p-1 text-gray-400 hover:text-green-800 cursor-pointer"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider bg-gray-50/20">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Dispositivo</th>
                      <th className="px-6 py-4">Navegador</th>
                      <th className="px-6 py-4">Localização</th>
                      <th className="px-6 py-4">Duração</th>
                      <th className="px-6 py-4 text-right">Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400">
                          <RefreshCw size={24} className="animate-spin inline mr-2 text-green-800" /> Carregando...
                        </td>
                      </tr>
                    ) : visitors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400">
                          Sem registos de visitantes.
                        </td>
                      </tr>
                    ) : (
                      visitors.map(v => (
                        <tr 
                          key={v.id}
                          onClick={() => setSelectedVisitor(v)}
                          className="hover:bg-green-50/10 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 font-mono font-bold text-xs text-gray-500">
                            {v.visitorId.split("-")[0]}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-800 block text-xs">{v.deviceName}</span>
                            <span className="text-[10px] text-gray-400">{v.deviceType} | {v.operatingSystem}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-medium">
                            {v.browser} <span className="text-gray-400 text-xs">v{v.browserVersion.split(".")[0]}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-800">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-red-500 shrink-0" />
                              {v.city}, {v.country}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-green-800">
                            {formatDuration(v.sessionDuration)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-400 font-medium text-xs">
                            {new Date(v.createdAt).toLocaleDateString("pt-MZ")} {new Date(v.createdAt).toLocaleTimeString("pt-MZ", {hour: '2-digit', minute:'2-digit'})}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Contact Submissions */}
        {activeTab === "contacts" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Filter Bar for Contacts */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <form onSubmit={handleContactSearch} className="flex flex-col md:flex-row gap-4 items-end">
                
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-black">Pesquisar Mensagens</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      value={cSearch}
                      onChange={(e) => setCSearch(e.target.value)}
                      placeholder="Pesquisar por nome, e-mail, assunto..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
                    />
                  </div>
                </div>

                <div className="w-full md:w-56">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-black">Desde a data</label>
                  <input
                    type="date"
                    value={cDate}
                    onChange={(e) => setCDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    type="submit"
                    className="flex-1 md:flex-initial px-6 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-extrabold shadow-sm transition-colors cursor-pointer"
                  >
                    Filtrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCSearch("");
                      setCDate("");
                      fetchData();
                    }}
                    className="px-4 py-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-bold transition-colors cursor-pointer"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToExcelClipboard("contacts")}
                    title="Copiar para Excel"
                    className="p-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
                  >
                    <FileText size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={exportContactsCSV}
                    title="Exportar CSV"
                    className="p-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
                  >
                    <Download size={18} />
                  </button>
                </div>

              </form>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-base text-gray-800">Mensagens Recebidas ({submissions.length})</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider bg-gray-50/20">
                      <th className="px-6 py-4">Nome Completo</th>
                      <th className="px-6 py-4">Assunto</th>
                      <th className="px-6 py-4">E-mail / Telefone</th>
                      <th className="px-6 py-4">E-mail OTP</th>
                      <th className="px-6 py-4 text-right">Data / Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-400">
                          <RefreshCw size={24} className="animate-spin inline mr-2 text-green-800" /> Carregando...
                        </td>
                      </tr>
                    ) : submissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-400">
                          Nenhuma mensagem encontrada.
                        </td>
                      </tr>
                    ) : (
                      submissions.map(sub => (
                        <tr 
                          key={sub.id}
                          onClick={() => setSelectedSubmission(sub)}
                          className="hover:bg-green-50/10 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-gray-800">{sub.fullName}</td>
                          <td className="px-6 py-4 text-gray-600 font-medium max-w-xs truncate">{sub.subject}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700">{sub.email}</span>
                              {sub.phone && <span className="text-xs text-gray-400 font-mono">{sub.phone}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                              Validado
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-400 font-medium text-xs">
                            {new Date(sub.createdAt).toLocaleDateString("pt-MZ")} {new Date(sub.createdAt).toLocaleTimeString("pt-MZ", {hour: '2-digit', minute:'2-digit'})}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Orders Management */}
        {activeTab === "orders" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Visual statistics row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Encomendas</p>
                  <h3 className="text-3xl font-black text-gray-800">{orders.length}</h3>
                </div>
                <div className="bg-green-50 text-green-800 p-4 rounded-2xl">
                  <Package size={24} />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Faturação Total</p>
                  <h3 className="text-3xl font-black text-green-800">
                    {orders
                      .filter(o => o.orderStatus !== "Cancelled")
                      .reduce((acc, o) => acc + o.totalAmount, 0)
                      .toFixed(0)} MT
                  </h3>
                </div>
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-2xl">
                  <DollarSign size={24} />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pendentes</p>
                  <h3 className="text-3xl font-black text-gray-800">
                    {orders.filter(o => o.orderStatus === "Pending").length}
                  </h3>
                </div>
                <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl">
                  <Clock size={24} />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Entregues</p>
                  <h3 className="text-3xl font-black text-gray-800">
                    {orders.filter(o => o.orderStatus === "Delivered").length}
                  </h3>
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl">
                  <Users size={24} />
                </div>
              </div>

            </div>

            {/* Filter Bar for Orders */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <form onSubmit={handleOrderSearch} className="flex flex-col md:flex-row gap-4 items-end">
                
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-black">Pesquisar Encomendas</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      value={oSearch}
                      onChange={(e) => setOSearch(e.target.value)}
                      placeholder="Pesquisar por nº de encomenda, nome, e-mail..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
                    />
                  </div>
                </div>

                <div className="w-full md:w-56">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-black">Estado</label>
                  <select
                    value={oStatus}
                    onChange={(e) => setOStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
                  >
                    <option value="">Todos os Estados</option>
                    <option value="Pending">Pendente (Pending)</option>
                    <option value="Confirmed">Confirmada (Confirmed)</option>
                    <option value="Processing">Processando (Processing)</option>
                    <option value="Shipped">Enviada (Shipped)</option>
                    <option value="Delivered">Entregue (Delivered)</option>
                    <option value="Cancelled">Cancelada (Cancelled)</option>
                  </select>
                </div>

                <div className="w-full md:w-56">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-black">Desde a data</label>
                  <input
                    type="date"
                    value={oDate}
                    onChange={(e) => setODate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    type="submit"
                    className="flex-1 md:flex-initial px-6 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-extrabold shadow-sm transition-colors cursor-pointer"
                  >
                    Filtrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOSearch("");
                      setOStatus("");
                      setODate("");
                      fetchData();
                    }}
                    className="px-4 py-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-bold transition-colors cursor-pointer"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToExcelClipboard("orders")}
                    title="Copiar para Excel"
                    className="p-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
                  >
                    <FileText size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={exportOrdersCSV}
                    title="Exportar CSV"
                    className="p-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
                  >
                    <Download size={18} />
                  </button>
                </div>

              </form>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-base text-gray-800">Encomendas Online ({orders.length})</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider bg-gray-50/20">
                      <th className="px-6 py-4">Nº Encomenda</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Localização / Cidade</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Data / Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400">
                          <RefreshCw size={24} className="animate-spin inline mr-2 text-green-800" /> Carregando...
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400">
                          Nenhuma encomenda registada.
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => {
                        let statusColor = "bg-gray-50 text-gray-700 border-gray-200";
                        if (order.orderStatus === "Pending") statusColor = "bg-yellow-50 text-yellow-800 border-yellow-200";
                        else if (order.orderStatus === "Confirmed" || order.orderStatus === "Processing") statusColor = "bg-blue-50 text-blue-800 border-blue-200";
                        else if (order.orderStatus === "Shipped") statusColor = "bg-indigo-50 text-indigo-800 border-indigo-200";
                        else if (order.orderStatus === "Delivered") statusColor = "bg-green-50 text-green-800 border-green-200";
                        else if (order.orderStatus === "Cancelled") statusColor = "bg-red-50 text-red-800 border-red-200";

                        return (
                          <tr 
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className="hover:bg-green-50/10 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 font-mono font-bold text-gray-800">{order.orderNumber}</td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-800 block">{order.customerName}</span>
                              <span className="text-xs text-gray-400">{order.customerEmail}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-600 font-medium">
                              <span className="flex items-center gap-1">
                                <MapPin size={12} className="text-red-500 shrink-0" />
                                {order.city}, {order.country}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-green-800">{order.totalAmount.toFixed(0)} MT</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}>
                                {order.orderStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-400 font-medium text-xs">
                              {new Date(order.createdAt).toLocaleDateString("pt-MZ")} {new Date(order.createdAt).toLocaleTimeString("pt-MZ", {hour: '2-digit', minute:'2-digit'})}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Visitor Detail Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl border border-gray-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedVisitor(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-50 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Users className="text-green-800 shrink-0" size={24} /> Detalhes do Visitante
            </h3>

            <div className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Visitor ID</span>
                  <span className="font-mono text-gray-800 break-all font-bold">{selectedVisitor.visitorId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Tipo de Dispositivo</span>
                  <span className="font-bold text-gray-800">{selectedVisitor.deviceType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Dispositivo</span>
                  <span className="font-bold text-gray-800">{selectedVisitor.deviceName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Resolução Ecrã</span>
                  <span className="font-bold text-gray-800">{selectedVisitor.screenWidth} x {selectedVisitor.screenHeight} (@{selectedVisitor.pixelRatio}x)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Navegador</span>
                  <span className="font-bold text-gray-800">{selectedVisitor.browser} (v{selectedVisitor.browserVersion})</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Sistema Operativo</span>
                  <span className="font-bold text-gray-800">{selectedVisitor.operatingSystem} (v{selectedVisitor.osVersion})</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Idioma Navegador</span>
                  <span className="font-bold text-gray-800">{selectedVisitor.language}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Fuso Horário</span>
                  <span className="font-bold text-gray-800">{selectedVisitor.timezone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Localização</span>
                  <span className="font-bold text-gray-800">{selectedVisitor.city}, {selectedVisitor.region}, {selectedVisitor.country}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Coordenadas GPS</span>
                  {selectedVisitor.latitude && selectedVisitor.longitude ? (
                    <a 
                      href={`https://www.google.com/maps?q=${selectedVisitor.latitude},${selectedVisitor.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-800 hover:underline flex items-center gap-1 font-bold"
                    >
                      {selectedVisitor.latitude.toFixed(4)}, {selectedVisitor.longitude.toFixed(4)}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-gray-500 font-bold">Não concedido (IP Fallback)</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Início da Sessão</span>
                  <span className="font-bold text-gray-800">{new Date(selectedVisitor.sessionStart).toLocaleString("pt-MZ")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Tempo Total de Sessão</span>
                  <span className="font-bold text-green-800 font-mono text-sm">{formatDuration(selectedVisitor.sessionDuration)}</span>
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedVisitor(null)}
                className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors cursor-pointer text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl border border-gray-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-50 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="text-green-800 shrink-0" size={24} /> Mensagem de Contacto
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Nome Completo</span>
                  <span className="font-bold text-gray-800">{selectedSubmission.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Data de Envio</span>
                  <span className="font-bold text-gray-800">{new Date(selectedSubmission.createdAt).toLocaleString("pt-MZ")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">E-mail</span>
                  <a href={`mailto:${selectedSubmission.email}`} className="text-green-800 hover:underline font-bold break-all flex items-center gap-1">
                    {selectedSubmission.email}
                    <ArrowRight size={12} />
                  </a>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Contacto Telefónico</span>
                  <span className="font-bold text-gray-800">{selectedSubmission.phone || "Não fornecido"}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-2">Mensagem</span>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <a
                href={`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`}
                className="flex-1 py-3 bg-green-800 hover:bg-green-700 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-colors text-center flex items-center justify-center gap-2"
              >
                <Mail size={14} /> Responder
              </a>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-2xl transition-colors cursor-pointer text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-50 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4 pr-6">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Package className="text-green-800 shrink-0" size={24} /> Encomenda #{selectedOrder.orderNumber}
              </h3>
              <div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black border ${
                  selectedOrder.orderStatus === "Pending" ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
                  selectedOrder.orderStatus === "Confirmed" || selectedOrder.orderStatus === "Processing" ? "bg-blue-50 text-blue-800 border-blue-200" :
                  selectedOrder.orderStatus === "Shipped" ? "bg-indigo-50 text-indigo-800 border-indigo-200" :
                  selectedOrder.orderStatus === "Delivered" ? "bg-green-50 text-green-800 border-green-200" :
                  "bg-red-50 text-red-800 border-red-200"
                }`}>
                  {selectedOrder.orderStatus}
                </span>
              </div>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Dados do Cliente</span>
                  <p className="font-extrabold text-gray-800 text-sm">{selectedOrder.customerName}</p>
                  <p className="flex items-center gap-1.5 font-medium text-gray-600">
                    <Mail size={12} className="text-gray-400 shrink-0" />
                    <a href={`mailto:${selectedOrder.customerEmail}`} className="text-green-800 hover:underline">{selectedOrder.customerEmail}</a>
                  </p>
                  <p className="flex items-center gap-1.5 font-medium text-gray-600">
                    <Phone size={12} className="text-gray-400 shrink-0" />
                    {selectedOrder.customerPhone}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Destino de Envio</span>
                  <p className="font-extrabold text-gray-800 text-sm">{selectedOrder.address}</p>
                  <p className="font-medium text-gray-600">{selectedOrder.city}, {selectedOrder.postalCode}</p>
                  <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">{selectedOrder.provinceState ? selectedOrder.provinceState + ", " : ""}{selectedOrder.country}</p>
                </div>

              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Artigos Encomendados</h4>
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="px-4 py-2.5">Artigo</th>
                        <th className="px-4 py-2.5 text-center">Qtd</th>
                        <th className="px-4 py-2.5 text-right">Preço</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-bold text-gray-800">{item.productName}</td>
                          <td className="px-4 py-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{item.unitPrice} MT</td>
                          <td className="px-4 py-2.5 text-right font-bold font-mono">{item.totalPrice} MT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col items-end text-xs">
                <div className="w-full sm:w-64 space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Subtotal:</span>
                    <span className="font-bold">{selectedOrder.subtotal.toFixed(0)} MT</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Transporte:</span>
                    <span className="font-bold">{selectedOrder.shippingCost.toFixed(0)} MT</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>IVA (17%):</span>
                    <span className="font-bold">{selectedOrder.tax.toFixed(0)} MT</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-700 font-bold">
                      <span>Desconto:</span>
                      <span>-{selectedOrder.discount.toFixed(0)} MT</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline border-t border-gray-100 pt-2 text-sm">
                    <span className="font-bold text-gray-800">Total Pago:</span>
                    <span className="text-lg font-black text-green-800">{selectedOrder.totalAmount.toFixed(0)} MT</span>
                  </div>
                </div>
              </div>

              {selectedOrder.orderNotes && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 text-xs">
                  <span className="text-[10px] text-amber-700 font-bold block uppercase tracking-wider">Notas de Entrega do Cliente</span>
                  <p className="text-amber-900 mt-1 italic leading-relaxed font-semibold">"{selectedOrder.orderNotes}"</p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-black">Alterar Estado da Encomenda</label>
                <div className="flex gap-2">
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                    disabled={updatingStatus}
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-green-100 focus:border-green-800 transition-all font-bold text-gray-800"
                  >
                    <option value="Pending">Pendente (Pending)</option>
                    <option value="Confirmed">Confirmada (Confirmed)</option>
                    <option value="Processing">Processando (Processing)</option>
                    <option value="Shipped">Enviada (Shipped)</option>
                    <option value="Delivered">Entregue (Delivered)</option>
                    <option value="Cancelled">Cancelada (Cancelled)</option>
                  </select>
                  {updatingStatus && (
                    <div className="flex items-center px-3 text-green-800 animate-spin">
                      <RefreshCw size={18} />
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-gray-900 text-white font-extrabold rounded-2xl hover:bg-gray-800 transition-colors cursor-pointer text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  function handleRefresh() {
    fetchData();
    toast.success("Painel actualizado!");
  }
}

// Inline helper for link icon
function ExternalLink({ size = 16, className = "" }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
