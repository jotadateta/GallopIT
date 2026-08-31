import React, { useState } from 'react';
import { Armario, BaiaState, UserRole, OperatingMode } from '../types';
import {
  Lock,
  Unlock,
  Loader2,
  ShieldAlert,
  Edit2,
  Check,
  X,
  Zap,
  Plus,
  Trash2,
  Archive,
  Tag,
  Radio,
  Wifi,
  Cpu,
  Clock,
  Sliders,
  ShieldCheck,
  RotateCw
} from 'lucide-react';

interface BoxGridProps {
  armarios: Armario[];
  armarioAtivoId: string;
  topicPrefix: string;
  statusArmario: 'online' | 'offline';
  userRole?: UserRole;
  allowedBoxIds?: number[];
  modoAtual: OperatingMode;
  onSelectArmario: (id: string) => void;
  onAddArmario?: () => void;
  onUpdateNomeArmario: (id: string, novoNome: string) => void;
  onUpdateTopicoArmario: (id: string, novoTopico: string) => void;
  onDeleteArmario?: (id: string) => void;
  onAbrirBaia: (baiaId: number) => void;
  onArmarBaia: (baiaId: number) => void;
  onAbrirTodas: () => void;
  onArmarTodas: () => void;
  onToggleModo?: (modo: OperatingMode) => void;
  onPingArmario?: () => void;
  onUpdateNomeBaia?: (baiaId: number, novoNome: string) => void;
}

export const BoxGrid: React.FC<BoxGridProps> = ({
  armarios,
  armarioAtivoId,
  topicPrefix,
  statusArmario,
  userRole = 'OPERATOR',
  allowedBoxIds = [1, 2, 3, 4],
  modoAtual,
  onSelectArmario,
  onAddArmario,
  onUpdateNomeArmario,
  onUpdateTopicoArmario,
  onDeleteArmario,
  onAbrirBaia,
  onArmarBaia,
  onAbrirTodas,
  onArmarTodas,
  onToggleModo,
  onPingArmario,
  onUpdateNomeBaia
}) => {
  const isArmarioOffline = statusArmario === 'offline';
  const activeArmario = armarios.find(a => a.id === armarioAtivoId) || armarios[0];

  const isOperator = userRole === 'OPERATOR';
  const canManageCabinets = userRole === 'DEVELOPER' || userRole === 'CLIENT_ADMIN';

  // Inline editing for Cabinet Name
  const [isEditingArmarioNome, setIsEditingArmarioNome] = useState(false);
  const [tempArmarioNome, setTempArmarioNome] = useState('');

  // Inline editing for Shelf Name
  const [editingBaiaId, setEditingBaiaId] = useState<number | null>(null);
  const [tempBaiaNome, setTempBaiaNome] = useState('');

  // Ping button animation state
  const [pinging, setPinging] = useState(false);

  const handleStartEditArmario = () => {
    if (!activeArmario || !canManageCabinets) return;
    setTempArmarioNome(activeArmario.nome);
    setIsEditingArmarioNome(true);
  };

  const handleSaveEditArmario = () => {
    if (activeArmario && tempArmarioNome.trim()) {
      onUpdateNomeArmario(activeArmario.id, tempArmarioNome.trim());
    }
    setIsEditingArmarioNome(false);
  };

  const handleStartEditBaia = (baia: BaiaState) => {
    if (!canManageCabinets) return;
    setEditingBaiaId(baia.id);
    setTempBaiaNome(baia.nome);
  };

  const handleSaveEditBaia = (baiaId: number) => {
    if (tempBaiaNome.trim() && onUpdateNomeBaia) {
      onUpdateNomeBaia(baiaId, tempBaiaNome.trim());
    }
    setEditingBaiaId(null);
  };

  const handlePing = () => {
    setPinging(true);
    if (onPingArmario) onPingArmario();
    setTimeout(() => setPinging(false), 1200);
  };

  if (!activeArmario) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 shadow-sm">
        <Cpu className="w-12 h-12 mx-auto text-stone-300 mb-3" />
        <h3 className="text-base font-bold text-stone-700">Nenhum equipamento disponível</h3>
        <p className="text-stone-500 text-xs mt-1">Nenhum armário foi associado à sua conta de utilizador.</p>
      </div>
    );
  }

  const baias = activeArmario.baias;
  const clientId = activeArmario.client_id || 'cliente_demo';
  const machineId = activeArmario.topicoMqtt || activeArmario.id;

  return (
    <div className="space-y-6">

      {/* Multi-Cabinet Selector Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-3xl border border-stone-200/80 shadow-xs">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x">
          <div className="flex items-center space-x-1.5 shrink-0 pr-2 border-r border-stone-200 text-xs font-bold text-stone-500 font-heading">
            <Archive className="w-4 h-4 text-[#558b5b]" />
            <span className="hidden md:inline">Máquinas:</span>
          </div>

          {armarios.map((arm) => {
            const isSelected = arm.id === activeArmario.id;
            return (
              <button
                key={arm.id}
                onClick={() => onSelectArmario(arm.id)}
                className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 touch-manipulation active:scale-95 ${
                  isSelected
                    ? 'bg-[#a3c9a8] text-white shadow-sm border border-[#8fbc8f]'
                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <span>{arm.nome}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'}`}>
                  {arm.baias.length} Boxes
                </span>
              </button>
            );
          })}
        </div>

        {/* Add Machine Button for Admins */}
        {canManageCabinets && onAddArmario && (
          <button
            onClick={onAddArmario}
            className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shrink-0 active:scale-95 touch-manipulation"
          >
            <Plus className="w-4 h-4 text-[#558b5b]" />
            <span>Novo Armário</span>
          </button>
        )}
      </div>

      {/* Main Cabinet Unit Frame */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden">
        
        {/* Cabinet Header Display */}
        <div className="bg-stone-900 text-white p-4 sm:p-6 border-b border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-stone-800 text-[#a3c9a8] px-2.5 py-0.5 rounded-full border border-stone-700 whitespace-nowrap shrink-0">
                ESP32 IoT v2.2
              </span>
              
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                isArmarioOffline ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-[#1b3d22] text-[#a3c9a8] border border-[#2e5334]'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isArmarioOffline ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`}></span>
                {isArmarioOffline ? 'Status: OFFLINE' : 'Status: ONLINE'}
              </span>

              {/* Wi-Fi RSSI Signal Indicator */}
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                <Wifi className="w-3 h-3 text-[#a3c9a8]" />
                <span>{activeArmario.wifi_rssi ? `${activeArmario.wifi_rssi} dBm` : '-45 dBm'}</span>
              </span>

              {/* Firmware Version */}
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded-full border border-stone-700">
                <Cpu className="w-3 h-3" />
                <span>{activeArmario.firmware || '2.2.0-ESP32'}</span>
              </span>
            </div>

            {/* Editable Cabinet Title */}
            {isEditingArmarioNome && canManageCabinets ? (
              <div className="flex items-center space-x-2 my-1 max-w-md">
                <input
                  type="text"
                  value={tempArmarioNome}
                  onChange={(e) => setTempArmarioNome(e.target.value)}
                  className="text-sm sm:text-base font-bold bg-stone-950 text-white border-b-2 border-[#a3c9a8] focus:outline-none px-2 py-1 rounded w-full min-w-0"
                  autoFocus
                />
                <button
                  onClick={handleSaveEditArmario}
                  className="p-1.5 rounded bg-[#a3c9a8] text-stone-900 hover:bg-[#8fbc8f] shrink-0"
                  title="Guardar nome"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingArmarioNome(false)}
                  className="p-1.5 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 shrink-0"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 group min-w-0">
                <h3 className="text-lg sm:text-xl font-bold font-heading tracking-wide text-stone-100 truncate" title={activeArmario.nome}>
                  {activeArmario.nome}
                </h3>
                {canManageCabinets && (
                  <button
                    onClick={handleStartEditArmario}
                    className="p-1 text-stone-400 hover:text-white transition-colors shrink-0"
                    title="Editar nome"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* MQTT Topic v2.2 Display */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-stone-300">
              <span className="flex items-center gap-1 shrink-0 text-stone-400">
                <Tag className="w-3 h-3 text-[#a3c9a8]" />
                <span>Base MQTT:</span>
              </span>
              <code className="bg-stone-950 text-[#a3c9a8] px-2 py-0.5 rounded border border-stone-800 break-all max-w-full">
                gallopit/{clientId}/{machineId}/[cmd|status]/...
              </code>
            </div>
          </div>

          {/* Right Action Tools: Ping & Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Ping Button */}
            <button
              onClick={handlePing}
              disabled={pinging}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95"
              title="Testar Conexão MQTT (cmd/ping)"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#a3c9a8] ${pinging ? 'animate-spin' : ''}`} />
              <span>{pinging ? 'A enviar Ping...' : 'Ping / PONG'}</span>
              {activeArmario.last_ping_latency_ms && (
                <span className="text-[10px] text-emerald-400 font-mono">({activeArmario.last_ping_latency_ms}ms)</span>
              )}
            </button>

            {/* Mode Switcher for Client Admin & Developer */}
            {canManageCabinets && onToggleModo && (
              <div className="inline-flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs font-bold">
                <button
                  onClick={() => onToggleModo('DELAY')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    modoAtual === 'DELAY' ? 'bg-[#a3c9a8] text-stone-900 shadow-xs' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Modo DELAY
                </button>
                <button
                  onClick={() => onToggleModo('AGENDA')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    modoAtual === 'AGENDA' ? 'bg-[#a3c9a8] text-stone-900 shadow-xs' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Modo AGENDA
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Master Actions Bar: Abrir Todas / Armar Todas */}
        <div className="bg-stone-100/90 border-b border-stone-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-stone-600 font-medium">
            <Sliders className="w-4 h-4 text-[#558b5b]" />
            <span>Ações Rápidas Master (Todas as Boxes):</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={onArmarTodas}
              disabled={isArmarioOffline}
              className="flex-1 sm:flex-none min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 active:scale-95 disabled:opacity-50"
              title="Armar todas as 4 boxes"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Armar Todas</span>
            </button>

            <button
              onClick={onAbrirTodas}
              disabled={isArmarioOffline}
              className="flex-1 sm:flex-none min-h-[42px] px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 active:scale-95 disabled:opacity-50"
              title="Abrir todas as 4 boxes"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Todas</span>
            </button>
          </div>
        </div>

        {/* Offline Warning Banner */}
        {isArmarioOffline && (
          <div className="p-3.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-start sm:items-center justify-between px-4 sm:px-6 gap-2">
            <div className="flex items-start sm:items-center space-x-2 min-w-0 flex-1">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <span className="break-words">O ESP32 físico está offline. Os comandos serão transmitidos e retidos pelo Broker EMQX.</span>
            </div>
          </div>
        )}

        {/* Vertical Stack of 4 Shelves / Boxes */}
        <div className="p-4 sm:p-6 bg-stone-50/50 space-y-4">
          
          {baias.map((baia, index) => {
            const isPulsando = baia.pulsando || baia.rele_ativo;
            const isAberta = baia.status === 'ABERTA' || baia.trancaAberta || isPulsando;
            const isEditingBaia = editingBaiaId === baia.id;
            
            // Check Granular RBAC Box Access for Operators
            const isBoxPermitted = !isOperator || allowedBoxIds.includes(baia.id);

            return (
              <div key={baia.id} className="relative">
                {/* Individual Shelf Unit Container */}
                <div className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  !isBoxPermitted
                    ? 'border-stone-200 bg-stone-100/60 opacity-60'
                    : isPulsando
                    ? 'border-emerald-400 ring-2 ring-emerald-200 bg-emerald-50/40'
                    : isAberta
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-stone-200/90 hover:border-stone-300'
                }`}>
                  
                  {/* Shelf Door / Lock Visual Box */}
                  <div className="flex items-start sm:items-center space-x-4 flex-1">
                    
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-all ${
                      !isBoxPermitted
                        ? 'bg-stone-200 text-stone-400 border-stone-300'
                        : isPulsando
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse scale-105'
                        : isAberta
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {!isBoxPermitted ? (
                        <Lock className="w-6 h-6 text-stone-400" />
                      ) : isPulsando ? (
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                      ) : isAberta ? (
                        <Unlock className="w-6 h-6 text-rose-600" />
                      ) : (
                        <Lock className="w-6 h-6 text-emerald-700" />
                      )}
                      <span className="text-[10px] font-mono font-semibold mt-1">
                        SOL-0{baia.id}
                      </span>
                    </div>

                    {/* Shelf Title & Status Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60">
                          Box 0{index + 1}
                        </span>

                        {!isBoxPermitted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Acesso Não Autorizado
                          </span>
                        ) : isPulsando ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                            <Zap className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Solenoide Disparado ({baia.tempoRestantePulse || 4}s)</span>
                          </span>
                        ) : isAberta ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>ESTADO: ABERTA (Alimentada)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            <span>ESTADO: ARMADA (Pronta)</span>
                          </span>
                        )}

                        {baia.agendaHora && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>{baia.agendaHora}</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Editable Shelf Name */}
                      <div className="mt-1 flex items-center space-x-2 min-w-0">
                        {isEditingBaia && canManageCabinets ? (
                          <div className="flex items-center space-x-2 my-1 max-w-sm w-full">
                            <input
                              type="text"
                              value={tempBaiaNome}
                              onChange={(e) => setTempBaiaNome(e.target.value)}
                              className="text-sm font-semibold text-stone-800 border-b-2 border-[#a3c9a8] focus:outline-none px-1 py-0.5 bg-stone-50 w-full min-w-0"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEditBaia(baia.id)}
                              className="p-1.5 rounded bg-[#e6f4ea] text-[#2e5334] hover:bg-[#d1e6d3] shrink-0"
                              title="Guardar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingBaiaId(null)}
                              className="p-1.5 rounded bg-stone-100 text-stone-500 hover:bg-stone-200 shrink-0"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 group min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-stone-800 font-heading tracking-tight truncate" title={baia.nome}>
                              {baia.nome}
                            </h3>
                            {canManageCabinets && onUpdateNomeBaia && (
                              <button
                                onClick={() => handleStartEditBaia(baia)}
                                className="opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 text-stone-400 hover:text-stone-700 active:scale-90 rounded-lg hover:bg-stone-100 touch-manipulation shrink-0"
                                title="Editar nome da box"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-stone-500 break-words mt-0.5">
                        {baia.ultimaAbertura 
                          ? `Último evento: ${new Date(baia.ultimaAbertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                          : 'Pronta para operação'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: Alterna entre "Abrir Box" e "Armar Box" conforme status lógico v2.2 */}
                  <div className="shrink-0 w-full md:w-auto">
                    {!isBoxPermitted ? (
                      <button
                        disabled
                        className="w-full md:w-52 min-h-[50px] py-3.5 px-5 rounded-2xl font-bold text-sm bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300 flex items-center justify-center space-x-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Bloqueado (RBAC)</span>
                      </button>
                    ) : isPulsando ? (
                      <button
                        disabled
                        className="w-full md:w-52 min-h-[50px] py-3.5 px-5 rounded-2xl font-bold text-sm bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed flex items-center justify-center space-x-2 shadow-xs"
                      >
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                        <span>Aguarde ({baia.tempoRestantePulse || 4}s)</span>
                      </button>
                    ) : isAberta ? (
                      /* Box está ABERTA -> Botão "Armar Box" (cmd/arm) */
                      <button
                        disabled={isArmarioOffline}
                        onClick={() => onArmarBaia(baia.id)}
                        className={`w-full md:w-52 min-h-[50px] py-3.5 px-5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2.5 active:scale-[0.97] touch-manipulation shadow-xs ${
                          isArmarioOffline
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white active:bg-emerald-800'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Armar Box (cmd/arm)</span>
                      </button>
                    ) : (
                      /* Box está ARMADA -> Botão "Abrir Box" (cmd/open) */
                      <button
                        disabled={isArmarioOffline}
                        onClick={() => onAbrirBaia(baia.id)}
                        className={`w-full md:w-52 min-h-[50px] py-3.5 px-5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2.5 active:scale-[0.97] touch-manipulation shadow-xs ${
                          isArmarioOffline
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-[#a3c9a8] hover:bg-[#8fbc8f] text-white active:bg-[#7ea884]'
                        }`}
                      >
                        <Unlock className="w-4 h-4" />
                        <span>Abrir Box (4s Solenoide)</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
};
