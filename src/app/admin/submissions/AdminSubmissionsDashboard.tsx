"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  Search, 
  Calendar, 
  Download, 
  Mail, 
  Phone, 
  User, 
  ExternalLink, 
  X, 
  RefreshCw, 
  ArrowLeft,
  MessageSquare,
  FileText,
  Clock
} from "lucide-react";

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

interface AdminSubmissionsDashboardProps {
  adminUser: {
    id: string;
    email: string;
    name: string | null;
  };
}

export default function AdminSubmissionsDashboard({ adminUser }: AdminSubmissionsDashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Fetch submissions from API
  const fetchSubmissions = async (searchQuery = "", dateQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (dateQuery) params.append("date", dateQuery);

      const response = await fetch(`/api/admin/submissions?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setSubmissions(data.submissions || []);
      } else {
        toast.error(data.error || "Erro ao carregar submissões.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro na ligação ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchSubmissions(search, date);
    toast.success("Dados actualizados!");
  };

  // Handle filter/search submissions
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubmissions(search, date);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDate("");
    fetchSubmissions("", "");
  };

  // Export submissions to CSV
  const handleExportCSV = () => {
    if (submissions.length === 0) {
      toast.error("Não há dados para exportar.");
      return;
    }

    const headers = [
      "ID",
      "Data de Criacao",
      "Nome Completo",
      "E-mail",
      "Telefone",
      "Assunto",
      "Mensagem",
      "E-mail Verificado"
    ];

    const csvRows = [
      headers.join(","), // header row
      ...submissions.map(sub => {
        const row = [
          sub.id,
          new Date(sub.createdAt).toLocaleString("pt-MZ"),
          `"${sub.fullName.replace(/"/g, '""')}"`,
          sub.email,
          sub.phone ? `"${sub.phone}"` : '""',
          `"${sub.subject.replace(/"/g, '""')}"`,
          `"${sub.message.replace(/"/g, '""')}"`,
          sub.verifiedEmail ? "Sim" : "Não"
        ];
        return row.join(",");
      })
    ];

    // Added BOM for UTF-8 compatibility in Microsoft Excel
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `submissoes_contacto_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Submissões exportadas para CSV!");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10 flex-1 flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-green-800 font-bold text-xs uppercase tracking-widest px-3 py-1 bg-green-100 rounded-full">
            Painel Administrativo
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-2 tracking-tight">
            Mensagens de Contacto
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie, procure e exporte os contactos enviados pelos utilizadores.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link
            href="/contacto"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
          >
            <ArrowLeft size={16} />
            Voltar ao Formulário
          </Link>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-800 hover:bg-green-700 text-white font-bold text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
        <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          
          {/* Search Term */}
          <div className="flex-1 w-full">
            <label htmlFor="search" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Pesquisar
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </span>
              <input
                id="search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome, e-mail, assunto..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="w-full md:w-56">
            <label htmlFor="date" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Desde a Data
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Calendar size={18} />
              </span>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="submit"
              className="flex-1 md:flex-initial px-6 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-extrabold shadow-sm transition-colors cursor-pointer text-center"
            >
              Filtrar
            </button>
            
            {(search || date) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-bold transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Actualizar dados"
              className="p-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

        </form>
      </div>

      {/* Submissions List / Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-lg text-gray-800">Registos Recebidos ({submissions.length})</h3>
          <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">
            Ordenado por data
          </span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider bg-gray-50/20">
                <th className="px-6 py-4">Nome Completo</th>
                <th className="px-6 py-4">Assunto</th>
                <th className="px-6 py-4">E-mail / Telefone</th>
                <th className="px-6 py-4">E-mail OTP</th>
                <th className="px-6 py-4 text-right">Data / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw size={28} className="animate-spin text-green-800" />
                      <span className="font-medium">Carregando mensagens...</span>
                    </div>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={32} className="text-gray-300" />
                      <span className="font-medium">Nenhuma submissão de contacto encontrada.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((submission) => (
                  <tr 
                    key={submission.id} 
                    onClick={() => setSelectedSubmission(submission)}
                    className="hover:bg-green-50/10 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {submission.fullName}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium max-w-xs truncate" title={submission.subject}>
                      {submission.subject}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-700">{submission.email}</span>
                        {submission.phone && (
                          <span className="text-xs text-gray-400 font-mono">{submission.phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                        Verificado
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                      {new Date(submission.createdAt).toLocaleDateString("pt-MZ")} às {new Date(submission.createdAt).toLocaleTimeString("pt-MZ", {hour: '2-digit', minute:'2-digit'})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div 
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-gray-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-50 rounded-full cursor-pointer"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="bg-green-50 text-green-800 p-3.5 rounded-2xl shrink-0">
                <MessageSquare size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Detalhes do Contacto
                </span>
                <h3 className="text-2xl font-black text-gray-900 mt-2 truncate" title={selectedSubmission.subject}>
                  {selectedSubmission.subject}
                </h3>
              </div>
            </div>

            <div className="space-y-6">
              
              {/* User Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl text-gray-400 border border-gray-100">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Nome do Remetente</span>
                    <span className="text-sm font-bold text-gray-800">{selectedSubmission.fullName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl text-gray-400 border border-gray-100">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Data de Envio</span>
                    <span className="text-sm font-bold text-gray-800">
                      {new Date(selectedSubmission.createdAt).toLocaleString("pt-MZ")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl text-gray-400 border border-gray-100">
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">E-mail</span>
                    <a 
                      href={`mailto:${selectedSubmission.email}`} 
                      className="text-sm font-bold text-green-800 hover:underline break-all flex items-center gap-1"
                    >
                      {selectedSubmission.email}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl text-gray-400 border border-gray-100">
                    <Phone size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Contacto Telefónico</span>
                    <span className="text-sm font-bold text-gray-800">
                      {selectedSubmission.phone || "Não fornecido"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Mensagem</span>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm text-gray-700 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>

              {/* Reply Action */}
              <div className="pt-2 flex gap-3">
                <a
                  href={`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`}
                  className="flex-1 py-3 bg-green-800 hover:bg-green-700 text-white font-extrabold text-sm rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Mail size={16} />
                  Responder por E-mail
                </a>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-sm rounded-2xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
