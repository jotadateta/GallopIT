import React, { useState } from 'react';
import { Cpu, Power, Bell, X, Terminal, Radio, Sparkles, Send, Activity } from 'lucide-react';

interface VirtualSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  statusArmario: 'online' | 'offline';
  clientId: string;
  machineId: string;
  onToggleStatusArmario: (novoStatus: 'online' | 'offline') => void;
  onSendMockNotification: (msg: string) => void;
  onEmitDiscoveryAnnouncement: () => void;
  onEmitMockFullState: () => void;
  mensagensRecebidas: { topic: string; payload: string; time: string }[];
}

export const VirtualSimulator: React.FC<VirtualSimulatorProps> = ({
  isOpen,
  onClose,
  statusArmario,
  clientId,
  machineId,
  onToggleStatusArmario,
  onSendMockNotification,
  onEmitDiscoveryAnnouncement,
  onEmitMockFullState,
  mensagensRecebidas
}) => {
  const [customNotifyText, setCustomNotifyText] = useState('Box 1 Aberta com Sucesso via Solenoide');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-end md:items-stretch md:justify-end p-0 transition-all animate-in fade-in duration-200">
      <div className="w-full md:max-w-md bg-white border-t md:border-l border-stone-200/80 rounded-t-3xl md:rounded-none max-h-[92vh] md:max-h-full h-auto md:h-full p-5 sm:p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom-6 md:slide-in-from-right-6 duration-200 touch-pan-y">

        {/* Mobile Pull Handle */}
        <div className="w-full pb-2 flex justify-center md:hidden">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
        </div>

        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                <Cpu className="w-5 h-5 text-[#558b5b]" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-stone-800 font-heading">
                  Simulador ESP32 v2.2
                </h3>
                <p className="text-xs text-stone-500 font-normal">
                  Emulação WSS • gallopit/{clientId}/{machineId}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors flex items-center justify-center touch-manipulation"
              aria-label="Fechar Simulador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1. Discovery Announcement Trigger */}
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-950 font-heading flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-purple-700 animate-pulse" />
                <span>Simular Anúncio de Auto-Descoberta</span>
              </span>
            </div>
            <p className="text-[11px] text-purple-800">
              Emite um broadcast MQTT em <code className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-purple-200">gallopit/discovery/announcement</code> simulando um novo ESP32 ligado na cavalariça.
            </p>
            <button
              onClick={onEmitDiscoveryAnnouncement}
              className="w-full min-h-[40px] py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Emitir gallopit/discovery/announcement</span>
            </button>
          </div>

          {/* 2. Cabinet LWT Status Toggle */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-700 font-heading">
                Presença LWT (Online / Offline)
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                statusArmario === 'online' ? 'bg-[#e6f4ea] text-[#2e5334]' : 'bg-rose-100 text-rose-800'
              }`}>
                {statusArmario}
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              Publica em <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border">gallopit/{clientId}/{machineId}/status/presence</code>
            </p>

            <button
              onClick={() => onToggleStatusArmario(statusArmario === 'online' ? 'offline' : 'online')}
              className={`w-full min-h-[42px] py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 touch-manipulation ${
                statusArmario === 'online'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>Alternar para {statusArmario === 'online' ? 'OFFLINE' : 'ONLINE'}</span>
            </button>
          </div>

          {/* 3. Emit Full State Payload */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
            <span className="text-xs font-bold text-stone-700 font-heading block">
              Telemetria Completa de Estado (4 Boxes)
            </span>
            <p className="text-xs text-stone-500">
              Envia o JSON com telemetria das 4 boxes, RSSI Wi-Fi e modo ativo para <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border">gallopit/{clientId}/{machineId}/status/state</code>.
            </p>
            <button
              onClick={onEmitMockFullState}
              className="w-full min-h-[40px] py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-xs"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Publicar Telemetria status/state</span>
            </button>
          </div>

          {/* 4. Live Message Log Console */}
          <div className="p-4 rounded-2xl bg-stone-900 text-stone-200 font-mono text-[11px] space-y-2">
            <div className="flex items-center space-x-2 text-xs text-stone-300 font-heading font-bold">
              <Terminal className="w-4 h-4 text-[#a3c9a8]" />
              <span>Console de Mensagens MQTT em Tempo Real</span>
            </div>
            <div className="h-44 overflow-y-auto space-y-1.5 pr-1 touch-pan-y text-[10px]">
              {mensagensRecebidas.length === 0 ? (
                <div className="text-stone-500 italic text-center py-10">
                  Nenhum tráfego MQTT registado nesta sessão.
                </div>
              ) : (
                mensagensRecebidas.map((msg, i) => (
                  <div key={i} className="p-2 rounded-xl bg-stone-950 border border-stone-800">
                    <div className="flex items-start justify-between text-[10px] gap-2">
                      <span className="text-[#a3c9a8] font-bold break-all flex-1">{msg.topic}</span>
                      <span className="shrink-0 text-stone-500 font-mono">{msg.time}</span>
                    </div>
                    <div className="text-stone-300 break-all mt-1 leading-relaxed">{msg.payload}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
