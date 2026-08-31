import React, { useState } from 'react';
import { DelayConfig } from '../types';
import { Play, Save, CheckCircle } from 'lucide-react';

interface SequenceControlProps {
  delayConfig: DelayConfig;
  statusArmario: 'online' | 'offline';
  onIniciarSequencia: () => void;
  onSalvarDelay: (minutos: number) => void;
}

export const SequenceControl: React.FC<SequenceControlProps> = ({
  delayConfig,
  statusArmario,
  onIniciarSequencia,
  onSalvarDelay
}) => {
  const [minutosInput, setMinutosInput] = useState<number>(delayConfig.minutos || 5);
  const [salvoSucesso, setSalvoSucesso] = useState(false);
  const [sequenciaExecutando, setSequenciaExecutando] = useState(false);

  const handleSalvarDelay = (e: React.FormEvent) => {
    e.preventDefault();
    if (minutosInput < 1) return;
    onSalvarDelay(minutosInput);
    setSalvoSucesso(true);
    setTimeout(() => setSalvoSucesso(false), 3000);
  };

  const handleStartSequence = () => {
    setSequenciaExecutando(true);
    onIniciarSequencia();
    setTimeout(() => setSequenciaExecutando(false), 5000);
  };

  const isArmarioOffline = statusArmario === 'offline';

  return (
    <section className="my-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-800 font-heading tracking-tight">
            Controle de Sequência Automática
          </h2>
          <p className="text-xs text-stone-500 font-normal mt-0.5">
            Disparo automático sequencial das baias (Modo Delay)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-stone-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

          {/* Left Column: Sequence Trigger */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sage-100 text-[#2e5334] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-sage-accent"></span>
                Ciclo Sequencial Programado
              </span>

              <h3 className="text-xl font-bold text-stone-800 font-heading mb-2">
                Iniciar Sequência Diária
              </h3>
              <p className="text-sm text-stone-500 max-w-lg leading-relaxed">
                Ao clicar em iniciar, a <strong className="text-stone-800">Box 1</strong> abrirá imediatamente e as subsequentes (2, 3 e 4) abrirão no intervalo de <strong className="text-[#558b5b] font-semibold">{delayConfig.minutos} minutos</strong>.
              </p>
            </div>

            {/* Sequence Start Button - Min 54px touch target */}
            <button
              disabled={isArmarioOffline || sequenciaExecutando}
              onClick={handleStartSequence}
              className={`w-full min-h-[54px] py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200 shadow-md flex items-center justify-center space-x-3 active:scale-[0.98] touch-manipulation ${
                sequenciaExecutando
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : isArmarioOffline
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-[#a3c9a8] hover:bg-[#8fbc8f] text-white active:bg-[#7ea884]'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{sequenciaExecutando ? 'Iniciando Sequência...' : 'Iniciar Sequência Diária'}</span>
            </button>
          </div>

          {/* Right Column: Delay Input & Quick Presets */}
          <div className="md:col-span-5 bg-stone-50/80 rounded-2xl p-5 sm:p-6 border border-stone-100 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-stone-700 font-heading mb-1">
                Intervalo entre Boxes
              </h4>
              <p className="text-xs text-stone-400 mb-4">
                Tempo de espera em minutos para a abertura automática
              </p>

              {/* Quick Mobile Preset Chips */}
              <div className="mb-5">
                <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Atalhos Rápidos:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 5, 10, 15, 30, 60].map((presetMin) => (
                    <button
                      key={presetMin}
                      type="button"
                      onClick={() => setMinutosInput(presetMin)}
                      className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center active:scale-95 touch-manipulation ${
                        minutosInput === presetMin
                          ? 'bg-[#2e5334] text-white border-[#2e5334] shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {presetMin} min
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSalvarDelay} className="space-y-5">
                <div>
                  <label className="block text-xs text-stone-500 font-semibold mb-2">
                    Ajuste Fino Manual:
                  </label>
                  <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setMinutosInput(Math.max(1, minutosInput - 1))}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-lg flex items-center justify-center active:scale-90 touch-manipulation"
                      aria-label="Diminuir 1 minuto"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={minutosInput}
                      onChange={(e) => setMinutosInput(parseInt(e.target.value) || 1)}
                      className="w-full text-center bg-transparent py-1 text-2xl font-bold text-stone-800 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-stone-400 shrink-0 pr-1">
                      MIN
                    </span>
                    <button
                      type="button"
                      onClick={() => setMinutosInput(Math.min(180, minutosInput + 1))}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-lg flex items-center justify-center active:scale-90 touch-manipulation"
                      aria-label="Aumentar 1 minuto"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isArmarioOffline}
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl font-semibold text-xs bg-stone-800 hover:bg-stone-900 text-white transition-all shadow-sm flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 touch-manipulation"
                >
                  {salvoSucesso ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Intervalo Salvo!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Intervalo</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
