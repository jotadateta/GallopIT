import React, { useState } from 'react';
import { BaiaState } from '../types';
import { Clock, Check, Send } from 'lucide-react';

interface ScheduleControlProps {
  baias: BaiaState[];
  statusArmario: 'online' | 'offline';
  onAtualizarAgenda: (baiaId: number, novaHora: string) => void;
  onAtualizarTodasAgendas: (agendas: { baia: number; hora: string }[]) => void;
}

export const ScheduleControl: React.FC<ScheduleControlProps> = ({
  baias,
  statusArmario,
  onAtualizarAgenda,
  onAtualizarTodasAgendas
}) => {
  // Local state for time inputs
  const [horasInput, setHorasInput] = useState<{ [key: number]: string }>(() => {
    const initial: { [key: number]: string } = {};
    baias.forEach(b => {
      initial[b.id] = b.agendaHora || '08:30';
    });
    return initial;
  });

  const [salvoStatus, setSalvoStatus] = useState<{ [key: number]: boolean }>({});
  const [salvoGeral, setSalvoGeral] = useState(false);

  const handleTimeChange = (baiaId: number, val: string) => {
    setHorasInput(prev => ({ ...prev, [baiaId]: val }));
  };

  const handleSalvarIndividual = (baiaId: number) => {
    const hora = horasInput[baiaId] || '08:30';
    onAtualizarAgenda(baiaId, hora);
    setSalvoStatus(prev => ({ ...prev, [baiaId]: true }));
    setTimeout(() => {
      setSalvoStatus(prev => ({ ...prev, [baiaId]: false }));
    }, 2500);
  };

  const handleSalvarTodas = () => {
    const lista = baias.map(b => ({
      baia: b.id,
      hora: horasInput[b.id] || b.agendaHora || '08:30'
    }));
    onAtualizarTodasAgendas(lista);
    setSalvoGeral(true);
    setTimeout(() => setSalvoGeral(false), 3000);
  };

  const isArmarioOffline = statusArmario === 'offline';

  return (
    <section className="my-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-stone-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-800 font-heading tracking-tight">
            Agendamento
          </h2>
          <p className="text-xs text-stone-500 font-normal mt-0.5">
            Horários programados para abertura automática no Modo Agenda
          </p>
        </div>

        <button
          disabled={isArmarioOffline}
          onClick={handleSalvarTodas}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
        >
          {salvoGeral ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Agenda Salva!</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Atualizar Todas as Boxes</span>
            </>
          )}
        </button>
      </div>

      {/* Airy List Layout - Mobile Touch Friendly */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="divide-y divide-[#F3F4F6]">
          {baias.map((baia) => {
            const foiSalvo = salvoStatus[baia.id];
            const horaAtual = horasInput[baia.id] || baia.agendaHora || '08:30';

            return (
              <div 
                key={baia.id} 
                className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
              >
                {/* Box Name & Saved Badge */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-stone-50 flex items-center justify-center font-bold text-sm text-stone-700 border border-stone-100 shrink-0">
                    #{baia.id}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-800 font-heading">
                      {baia.nome}
                    </h3>
                    
                    {/* Saved Schedule Badge */}
                    <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e6f4ea] text-[#2e5334]">
                      <Clock className="w-3.5 h-3.5 text-[#558b5b]" />
                      <span>Horário Salvo: {baia.agendaHora || '08:30'}</span>
                    </div>
                  </div>
                </div>

                {/* Input & Action Button - Mobile Ergonomic */}
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                  <input
                    type="time"
                    value={horaAtual}
                    onChange={(e) => handleTimeChange(baia.id, e.target.value)}
                    className="min-h-[44px] flex-1 md:flex-initial bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-base font-bold text-stone-800 focus:outline-none focus:border-[#a3c9a8] transition-colors touch-manipulation"
                    aria-label={`Horário para ${baia.nome}`}
                  />

                  <button
                    disabled={isArmarioOffline}
                    onClick={() => handleSalvarIndividual(baia.id)}
                    className={`min-h-[44px] px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 active:scale-95 touch-manipulation ${
                      foiSalvo
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#a3c9a8] hover:bg-[#8fbc8f] text-white active:bg-[#7ea884]'
                    }`}
                  >
                    {foiSalvo ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Salvo</span>
                      </>
                    ) : (
                      <span>Atualizar</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
