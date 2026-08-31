import React, { useState } from 'react';
import { HistoricoEvento, OperatingMode } from '../types';
import { RefreshCw, Download, Search, Sliders } from 'lucide-react';

interface AuditHistoryProps {
  historico: HistoricoEvento[];
  carregando: boolean;
  isSupabaseConectado: boolean;
  modoAtual?: OperatingMode;
  onChangeModo?: (novoModo: OperatingMode) => void;
  onRefresh: () => void;
}

export const AuditHistory: React.FC<AuditHistoryProps> = ({
  historico,
  carregando,
  isSupabaseConectado,
  modoAtual = 'DELAY',
  onChangeModo,
  onRefresh
}) => {
  const [filtro, setFiltro] = useState('');

  const historicoFiltrado = historico.filter(evt =>
    evt.evento.toLowerCase().includes(filtro.toLowerCase()) ||
    evt.modo.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleExportCSV = () => {
    if (historico.length === 0) return;
    const header = 'ID,DataHora,Evento,Modo\n';
    const rows = historico.map(e => `"${e.id}","${e.created_at}","${e.evento}","${e.modo}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `equiloc_audit_historico_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleClick = () => {
    if (onChangeModo) {
      onChangeModo(modoAtual === 'DELAY' ? 'AGENDA' : 'DELAY');
    }
  };

  return (
    <section className="my-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-stone-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-800 font-heading tracking-tight">
            Histórico & Sistema
          </h2>
          <p className="text-xs text-stone-500 font-normal mt-0.5">
            Registro cronológico de eventos e configurações do sistema
          </p>
        </div>

        {/* Actions - Mobile Friendly */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={carregando}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 transition-all active:scale-95 flex items-center justify-center touch-manipulation"
            title="Atualizar Tabela de Histórico"
            aria-label="Atualizar Histórico"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 font-semibold text-xs flex items-center space-x-2 transition-all active:scale-95 touch-manipulation"
            aria-label="Exportar histórico em arquivo CSV"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden p-4 sm:p-6 space-y-6">

        {/* Filter bar */}
        <div className="p-3.5 sm:p-4 bg-stone-50/70 rounded-2xl border border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar histórico por evento ou modo..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full min-h-[44px] bg-white border border-stone-200 rounded-xl pl-10 pr-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#a3c9a8] touch-manipulation"
            />
          </div>

          <div className="text-xs text-stone-500 flex items-center justify-between sm:justify-end">
            <span className="text-[11px] text-stone-400 sm:hidden">Estado:</span>
            {isSupabaseConectado ? (
              <span className="inline-flex items-center gap-1.5 text-[#2e5334] font-semibold bg-[#e6f4ea] px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#558b5b] animate-pulse"></span>
                Supabase Sincronizado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-stone-600 font-medium bg-stone-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Auditoria Local
              </span>
            )}
          </div>
        </div>

        {/* Event List / Responsive Cards */}
        <div className="divide-y divide-[#EEEEEE] border border-stone-100 rounded-2xl overflow-hidden">
          {historicoFiltrado.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs italic">
              Nenhum evento registrado até o momento.
            </div>
          ) : (
            historicoFiltrado.map((evt, idx) => {
              const dateObj = new Date(evt.created_at);
              const dataFormatted = isNaN(dateObj.getTime())
                ? evt.created_at
                : dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={evt.id || idx} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#a3c9a8] shrink-0 mt-1 sm:mt-0"></span>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-bold text-stone-800 font-heading block break-words">
                        {evt.evento}
                      </span>
                      <div className="text-xs text-stone-400 mt-0.5 font-mono">
                        {dataFormatted}
                      </div>
                    </div>
                  </div>

                  {/* Mode tag & Client Tag */}
                  <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                    {evt.cliente_id && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium text-stone-600 bg-stone-100 border border-stone-200 truncate max-w-[140px]" title={evt.cliente_id}>
                        {evt.cliente_id.replace(/^cliente_/, '')}
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#2e5334] whitespace-nowrap">
                      Modo {evt.modo || 'Sistema'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Configurações: Toggle switch CSS puro (estilo iOS, ativo em verde claro) - Min 48px touch target */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-600 border border-stone-100 shrink-0">
              <Sliders className="w-4 h-4 text-[#558b5b]" />
            </div>
            <div>
              <span className="text-sm font-bold text-stone-800 font-heading block">
                Alternar Modo de Operação
              </span>
              <span className="text-xs text-stone-500">
                Modo Ativo: <strong className="text-stone-800 font-semibold">{modoAtual}</strong> ({modoAtual === 'DELAY' ? 'Intervalo Sequencial' : 'Programação de Horários'})
              </span>
            </div>
          </div>

          {/* iOS Style CSS Toggle Switch with minimum 48x48 touch hit area */}
          <label className="relative inline-flex items-center justify-center cursor-pointer min-h-[48px] min-w-[48px] touch-manipulation">
            <input
              type="checkbox"
              checked={modoAtual === 'AGENDA'}
              onChange={handleToggleClick}
              className="sr-only peer"
              aria-label="Alternar entre Modo DELAY e Modo AGENDA"
            />
            <div className="w-12 h-7 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#a3c9a8]"></div>
          </label>
        </div>

      </div>
    </section>
  );
};

