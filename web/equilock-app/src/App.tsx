import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Lock,
  Unlock,
  Clock,
  Terminal,
  Activity,
  Zap,
  RefreshCw,
  Sparkles,
  Trash2,
  Copy,
  Cpu,
  Sliders,
  RotateCcw,
  Layers,
  Settings,
  X,
  Play,
  Square,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  SlidersHorizontal,
  Smartphone
} from 'lucide-react';
import { GallopItMqttClient } from './lib/mqttClient';
import { Esp32FullStatePayload } from './types';

// Interface for 4-Box Cabinet State
interface BoxItem {
  id: number;
  nome: string;
  status: 'ARMADA' | 'ABERTA';
  rele_ativo: boolean;
  pulseCountdown: number; // 4s countdown
  agendaHora: string; // "07:30"
  hora: number;
  minuto: number;
  ativo: boolean;
}

// Log Message Item Interface
interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
  type: 'sent' | 'received' | 'sys' | 'err';
}

type TabType = 'boxes' | 'modes' | 'logs' | 'simulator';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('boxes');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // 1. Connection Target Settings
  const [clientId, setClientId] = useState('Emanuel');
  const [machineId, setMachineId] = useState('Maquina1');
  const [tempClientId, setTempClientId] = useState('Emanuel');
  const [tempMachineId, setTempMachineId] = useState('Maquina1');

  // Connection & Latency Status
  const [statusConexao, setStatusConexao] = useState<'connecting' | 'online' | 'offline' | 'disconnected'>('disconnected');
  const [presenceOnline, setPresenceOnline] = useState<boolean>(true);
  const [lastPingLatency, setLastPingLatency] = useState<number | null>(null);

  // 2. 4 Boxes Logical State (Prateleiras 1 a 4)
  const [boxes, setBoxes] = useState<BoxItem[]>([
    { id: 1, nome: 'Baia Principal', status: 'ARMADA', rele_ativo: false, pulseCountdown: 0, agendaHora: '07:00', hora: 7, minuto: 0, ativo: true },
    { id: 2, nome: 'Baia Central', status: 'ARMADA', rele_ativo: false, pulseCountdown: 0, agendaHora: '07:30', hora: 7, minuto: 30, ativo: true },
    { id: 3, nome: 'Baia Desportiva', status: 'ARMADA', rele_ativo: false, pulseCountdown: 0, agendaHora: '08:00', hora: 8, minuto: 0, ativo: true },
    { id: 4, nome: 'Paddock Poente', status: 'ARMADA', rele_ativo: false, pulseCountdown: 0, agendaHora: '08:30', hora: 8, minuto: 30, ativo: true },
  ]);

  // 3. Operating Mode & Sequence Config
  const [modoOperacao, setModoOperacao] = useState<'DELAY' | 'AGENDA'>('DELAY');
  const [intervaloMinutos, setIntervaloMinutos] = useState<number>(5);
  const [sequenceRunning, setSequenceRunning] = useState(false);

  // 4. Telemetry Details
  const [firmware, setFirmware] = useState('1.0.0-ESP32');
  const [wifiRssi, setWifiRssi] = useState(-45);

  // 5. Console Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copiedLogToast, setCopiedLogToast] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'sent' | 'received' | 'err'>('all');

  // MQTT Client Reference
  const mqttClientRef = useRef<GallopItMqttClient | null>(null);

  // Add Log Helper
  const addLog = (text: string, type: 'sent' | 'received' | 'sys' | 'err' = 'sys') => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text,
      type
    };
    setLogs((prev) => [entry, ...prev].slice(0, 150));
  };

  // Initialize and Connect MQTT
  useEffect(() => {
    const client = new GallopItMqttClient({
      brokerHost: 'broker.emqx.io',
      brokerPort: 8084,
      brokerPath: '/mqtt',
      useSSL: true,
      clientId,
      machineId,
      onStatusChange: (status) => setStatusConexao(status),
      onLogMessage: (msg, type) => addLog(msg, type),
      onPresenceChange: (isOnline) => setPresenceOnline(isOnline),
      onPongReceived: (latency) => setLastPingLatency(latency),
      onStateReceived: (state: Esp32FullStatePayload) => {
        if (state.modo_ativo) setModoOperacao(state.modo_ativo);
        if (state.intervalo_minutos !== undefined) setIntervaloMinutos(state.intervalo_minutos);
        if (state.wifi_rssi !== undefined) setWifiRssi(state.wifi_rssi);
        if (state.firmware) setFirmware(state.firmware);

        if (state.boxes && Array.isArray(state.boxes)) {
          setBoxes((prev) =>
            prev.map((box) => {
              const tel = state.boxes.find((b) => b.box === box.id);
              if (!tel) return box;
              const isPulse = tel.rele_ativo || false;
              const h = tel.hora !== undefined && tel.hora >= 0 ? tel.hora : box.hora;
              const m = tel.minuto !== undefined && tel.minuto >= 0 ? tel.minuto : box.minuto;
              const horaFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

              return {
                ...box,
                status: tel.status === 'ABERTA' ? 'ABERTA' : 'ARMADA',
                rele_ativo: isPulse,
                agendaHora: horaFormatted,
                hora: h,
                minuto: m,
                ativo: tel.ativo !== undefined ? tel.ativo : box.ativo
              };
            })
          );
        }
      },
      onEventReceived: (evt) => {
        const str = typeof evt === 'object' ? JSON.stringify(evt) : String(evt);
        addLog(`[EVENTO ESP32]: ${str}`, 'received');
      }
    });

    mqttClientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
    };
  }, []);

  // Handle Client ID or Machine ID Target Changes
  const handleApplyNewTarget = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mqttClientRef.current) return;
    const finalClient = tempClientId.trim() || 'Emanuel';
    const finalMachine = tempMachineId.trim() || 'Maquina1';
    setClientId(finalClient);
    setMachineId(finalMachine);
    setLastPingLatency(null);
    mqttClientRef.current.updateTarget(finalClient, finalMachine);
    setShowSettingsModal(false);
    addLog(`Alvo atualizado para: [${finalClient} / ${finalMachine}]`, 'sys');
  };

  // Trigger 4s Pulse Countdown on UI for specific box
  const startPulseCountdown = (boxId: number) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, rele_ativo: true, pulseCountdown: 4 } : b))
    );

    let count = 4;
    const interval = setInterval(() => {
      count -= 1;
      setBoxes((prev) =>
        prev.map((b) =>
          b.id === boxId ? { ...b, pulseCountdown: count, rele_ativo: count > 0 } : b
        )
      );

      if (count <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  };

  // 1. Abrir Box Individual (`/cmd/open` -> `{"box": N}`)
  const handleAbrirBox = (boxId: number) => {
    if (!mqttClientRef.current) return;
    mqttClientRef.current.openBox(boxId);
    startPulseCountdown(boxId);
    setBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, status: 'ABERTA' } : b))
    );
    addLog(`Solenoide ativado! Abertura enviada para Box 0${boxId} (4s)`, 'sent');
  };

  // 2. Armar Box Individual (`/cmd/arm` -> `{"box": N}`)
  const handleArmarBox = (boxId: number) => {
    if (!mqttClientRef.current) return;
    mqttClientRef.current.armBox(boxId);
    setBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, status: 'ARMADA', rele_ativo: false, pulseCountdown: 0 } : b))
    );
    addLog(`Bloqueio ativado! Box 0${boxId} marcada como ARMADA`, 'sent');
  };

  // 3. Abrir Todas as Boxes (`/cmd/open` -> `{"box": "all"}`)
  const handleAbrirTodas = () => {
    if (!mqttClientRef.current) return;
    mqttClientRef.current.openBox('all');
    [1, 2, 3, 4].forEach((id) => startPulseCountdown(id));
    setBoxes((prev) => prev.map((b) => ({ ...b, status: 'ABERTA' })));
    addLog('COMANDO MASTER: Abertura simultânea enviada para as 4 boxes!', 'sent');
  };

  // 4. Armar Todas as Boxes (`/cmd/arm` -> `{"box": "all"}`)
  const handleArmarTodas = () => {
    if (!mqttClientRef.current) return;
    mqttClientRef.current.armBox('all');
    setBoxes((prev) =>
      prev.map((b) => ({ ...b, status: 'ARMADA', rele_ativo: false, pulseCountdown: 0 }))
    );
    addLog('COMANDO MASTER: Re-arme simultâneo enviado para as 4 boxes!', 'sent');
  };

  // 5. Ping de Diagnóstico (`/cmd/ping` -> `{}`)
  const handleSendPing = () => {
    if (!mqttClientRef.current) return;
    mqttClientRef.current.ping(3500);
    addLog('PING enviado ao microcontrolador ESP32 (Aguardando resposta)...', 'sent');
  };

  // 6. Atualizar Telemetria Completa (`/cmd/status_get` -> `{}`)
  const handleRefreshState = () => {
    if (!mqttClientRef.current) return;
    mqttClientRef.current.requestState();
    addLog('Pedido de estado completo enviado ao ESP32 (status_get)...', 'sent');
  };

  // 7. Alternar Modo de Funcionamento (`/cmd/mode` -> `{"modo": "DELAY"|"AGENDA"}`)
  const handleToggleModo = (newModo: 'DELAY' | 'AGENDA') => {
    if (!mqttClientRef.current) return;
    setModoOperacao(newModo);
    mqttClientRef.current.setMode(newModo, intervaloMinutos);
    addLog(`Modo de funcionamento alterado para: ${newModo}`, 'sent');
  };

  // 8. Iniciar Sequência Temporizada
  const handleStartSequence = () => {
    if (!mqttClientRef.current) return;
    mqttClientRef.current.startSequence();
    setSequenceRunning(true);
    addLog('▶ COMANDO: Iniciar Sequência Temporizada em Cadeia', 'sent');
  };

  // 9. Parar Sequência Temporizada
  const handleStopSequence = () => {
    if (!mqttClientRef.current) return;
    mqttClientRef.current.stopSequence();
    setSequenceRunning(false);
    addLog('⏹ COMANDO: Parar Sequência Temporizada', 'sent');
  };

  // 10. Atualizar Intervalo do Timer
  const handleSaveDelayInterval = (min?: number) => {
    if (!mqttClientRef.current) return;
    const finalVal = min !== undefined ? min : intervaloMinutos;
    setIntervaloMinutos(finalVal);
    mqttClientRef.current.setTimerMin(finalVal);
    addLog(`Intervalo do Timer atualizado para ${finalVal} minutos`, 'sent');
  };

  // 11. Atualizar Agendamento Diário por Box
  const handleUpdateSchedule = (boxId: number, horaStr: string) => {
    if (!mqttClientRef.current) return;
    const [hStr, mStr] = horaStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);

    if (isNaN(h) || isNaN(m)) {
      addLog(`Formato de hora inválido para Box 0${boxId}: ${horaStr}`, 'err');
      return;
    }

    mqttClientRef.current.setSchedule(boxId, h, m, true);
    mqttClientRef.current.setBoxScheduleDirect(boxId, horaStr);
    addLog(`Agendamento de Box 0${boxId} atualizado para as ${horaStr}`, 'sent');
  };

  // Limpar e Copiar Logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogToast(true);
    setTimeout(() => setCopiedLogToast(false), 2500);
  };

  // Simulator Handlers
  const handleSimulatePresence = (statusStr: 'online' | 'offline') => {
    if (!mqttClientRef.current) return;
    const topic = `gallopit/${clientId}/${machineId}/status/presence`;
    mqttClientRef.current.publishRaw(topic, statusStr);
    addLog(`[SIMULADOR ESP32] Presença emitida: ${statusStr.toUpperCase()}`, 'received');
  };

  const handleSimulateFullState = () => {
    if (!mqttClientRef.current) return;
    const mockState: Esp32FullStatePayload = {
      system: 'gallopit',
      client_id: clientId,
      machine_id: machineId,
      mac_address: '88:57:21:78:EF:3C',
      provisioned: true,
      modo_ativo: modoOperacao,
      intervalo_minutos: intervaloMinutos,
      firmware: '1.0.0-ESP32-MVP',
      wifi_rssi: -42,
      boxes: boxes.map((b) => ({
        box: b.id,
        status: b.status,
        rele_ativo: b.rele_ativo,
        hora: b.hora,
        minuto: b.minuto,
        ativo: true
      }))
    };
    const topic = `gallopit/${clientId}/${machineId}/status/state`;
    mqttClientRef.current.publishRaw(topic, JSON.stringify(mockState));
    addLog('[SIMULADOR ESP32] Telemetria completa enviada via status/state', 'received');
  };

  const handleSimulatePong = () => {
    if (!mqttClientRef.current) return;
    const topic = `gallopit/${clientId}/${machineId}/status/event`;
    mqttClientRef.current.publishRaw(topic, JSON.stringify({ event: 'PONG', message: 'ESP32 Hardware Alive' }));
    addLog('[SIMULADOR ESP32] Resposta PONG emitida com sucesso!', 'received');
  };

  // Filtered Logs
  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'all') return true;
    return l.type === logFilter;
  });

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-slate-950 pb-24 md:pb-10">

      {/* ==============================================================================
          1. STICKY TOP APP BAR (MOBILE FIRST & DESKTOP HEADER)
         ============================================================================== */}
      <header className="sticky top-0 z-30 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 shadow-lg px-3.5 sm:px-6 py-2.5 sm:py-3.5 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2.5">
          
          {/* Brand & Target Pill */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 shadow-md shrink-0">
              <Cpu className="w-5 h-5 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight font-heading leading-tight truncate">
                  GallopIT
                </h1>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
                  v1.0
                </span>
              </div>
              
              {/* Target Quick Tag (Clickable to open settings) */}
              <button
                onClick={() => {
                  setTempClientId(clientId);
                  setTempMachineId(machineId);
                  setShowSettingsModal(true);
                }}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer group text-left truncate"
                title="Configurar Alvo (Client ID / Machine ID)"
              >
                <span className="font-mono text-slate-300 font-semibold truncate group-hover:text-emerald-300">
                  {clientId}/{machineId}
                </span>
                <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Status Badges & Quick Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            
            {/* ESP32 Presence Indicator */}
            <div
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs ${
                presenceOnline
                  ? 'bg-slate-900/90 text-emerald-400 border-emerald-500/40'
                  : 'bg-rose-950/80 text-rose-300 border-rose-600/60'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${presenceOnline ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
              <span className="hidden sm:inline font-mono">ESP32:</span>
              <span className="font-bold">{presenceOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            {/* Latency Pill (Visible when calculated) */}
            {lastPingLatency !== null && (
              <span className="hidden xs:inline-block px-2 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-[10px] sm:text-[11px] font-mono text-emerald-300 font-semibold">
                {lastPingLatency}ms
              </span>
            )}

            {/* Quick Ping Button */}
            <button
              onClick={handleSendPing}
              disabled={statusConexao !== 'online'}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95 shadow-md touch-manipulation cursor-pointer"
              title="Testar Latência / Ping"
            >
              <Zap className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Ping</span>
            </button>

            {/* Quick Refresh Button */}
            <button
              onClick={handleRefreshState}
              disabled={statusConexao !== 'online'}
              className="p-2 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 transition-all active:scale-95 cursor-pointer touch-manipulation"
              title="Atualizar Estado do ESP32"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Settings Gear Button */}
            <button
              onClick={() => {
                setTempClientId(clientId);
                setTempMachineId(machineId);
                setShowSettingsModal(true);
              }}
              className="p-2 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95 cursor-pointer touch-manipulation"
              title="Definições e Alvo MQTT"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ==============================================================================
          MAIN CONTAINER WITH TABBED VIEWS (MOBILE APP FEEL)
         ============================================================================== */}
      <main className="max-w-5xl mx-auto w-full px-3.5 sm:px-6 pt-3 sm:pt-6 space-y-4 sm:space-y-6 flex-1">

        {/* TOP SEGMENTED TAB SWITCHER (For Tablets and Desktop, or quick tapping) */}
        <div className="hidden sm:grid grid-cols-4 gap-2 p-1.5 bg-[#162032] border border-slate-800 rounded-2xl shadow-inner">
          <button
            onClick={() => setActiveTab('boxes')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'boxes'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Baias & Controlo</span>
          </button>

          <button
            onClick={() => setActiveTab('modes')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'modes'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Timer & Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Consola ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Simulador ESP32</span>
          </button>
        </div>

        {/* TAB 1: BAIAS & CONTROLO GERAL */}
        {activeTab === 'boxes' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* MASTER ACTIONS (Grandes Botões Táteis) */}
            <section className="bg-[#162032] border border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center space-x-2 font-heading">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Ações Rápidas (Master)</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">4 Baias</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                {/* Abrir Todas */}
                <button
                  onClick={handleAbrirTodas}
                  disabled={statusConexao !== 'online'}
                  className="w-full min-h-[52px] sm:min-h-[56px] py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center sm:space-x-2 space-y-1 sm:space-y-0 transition-all shadow-lg active:scale-95 cursor-pointer touch-manipulation text-center"
                >
                  <Unlock className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  <span>Abrir Todas (4s)</span>
                </button>

                {/* Armar Todas */}
                <button
                  onClick={handleArmarTodas}
                  disabled={statusConexao !== 'online'}
                  className="w-full min-h-[52px] sm:min-h-[56px] py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 text-emerald-400 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center sm:space-x-2 space-y-1 sm:space-y-0 transition-all shadow-md active:scale-95 cursor-pointer touch-manipulation text-center"
                >
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  <span>Armar Todas</span>
                </button>
              </div>
            </section>

            {/* 4 PRATELEIRAS DO ARMÁRIO FÍSICO */}
            <section className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center space-x-2 font-heading">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Armário Físico • 4 Baias</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">Pulso: 4s</span>
              </div>

              <div className="space-y-2.5 sm:space-y-3.5">
                {boxes.map((box) => {
                  const isAberta = box.status === 'ABERTA';
                  const isPulsando = box.pulseCountdown > 0 || box.rele_ativo;

                  return (
                    <div
                      key={box.id}
                      className={`relative rounded-3xl p-3.5 sm:p-5 border transition-all duration-200 shadow-md ${
                        isPulsando
                          ? 'bg-[#1a2336] border-amber-500 shadow-amber-950/30 ring-2 ring-amber-500/20'
                          : isAberta
                          ? 'bg-[#181f2f] border-rose-500/50'
                          : 'bg-[#162032] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* CARD ROW: Info + Status + Big Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Box Identifier & Name */}
                        <div className="flex items-center justify-between sm:justify-start space-x-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center font-mono font-extrabold text-xs sm:text-sm text-emerald-400 shrink-0 shadow-inner">
                              0{box.id}
                            </span>
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm sm:text-base text-white font-heading truncate">
                                Prateleira {box.id}
                              </h3>
                              <p className="text-xs text-slate-400 truncate">
                                {box.nome}
                              </p>
                            </div>
                          </div>

                          {/* Mobile-only status badge on top right */}
                          <div
                            className={`sm:hidden px-2.5 py-1 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5 border shrink-0 ${
                              isAberta
                                ? 'bg-rose-950/90 text-rose-300 border-rose-600/60'
                                : 'bg-emerald-950/90 text-emerald-300 border-emerald-600/60'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isAberta ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`}></span>
                            <span>{isAberta ? 'ABERTA' : 'ARMADA'}</span>
                          </div>
                        </div>

                        {/* Action Bar (Time + Status Desktop + Action Button) */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                          
                          {/* Schedule badge */}
                          <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-mono font-semibold flex items-center space-x-1.5 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{box.agendaHora}</span>
                          </div>

                          {/* Status Badge Desktop */}
                          <div
                            className={`hidden sm:flex px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider items-center space-x-1.5 border shrink-0 ${
                              isAberta
                                ? 'bg-rose-950/90 text-rose-300 border-rose-600/60'
                                : 'bg-emerald-950/90 text-emerald-300 border-emerald-600/60'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isAberta ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`}></span>
                            <span>{isAberta ? 'ABERTA' : 'ARMADA'}</span>
                          </div>

                          {/* Large Tap Action Button */}
                          {isAberta ? (
                            <button
                              onClick={() => handleArmarBox(box.id)}
                              disabled={statusConexao !== 'online' || isPulsando}
                              className="flex-1 sm:flex-none min-h-[46px] sm:min-h-[42px] px-5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-md cursor-pointer touch-manipulation"
                            >
                              <Lock className="w-4 h-4 stroke-[2.5]" />
                              <span>Armar Box</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAbrirBox(box.id)}
                              disabled={statusConexao !== 'online' || isPulsando}
                              className="flex-1 sm:flex-none min-h-[46px] sm:min-h-[42px] px-5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-md cursor-pointer touch-manipulation"
                            >
                              <Unlock className="w-4 h-4 stroke-[2.5]" />
                              <span>Abrir (4s)</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Visual Pulsing Alert Countdown (Active during 4s solenoid fire) */}
                      {isPulsando && (
                        <div className="mt-3 p-2.5 rounded-2xl bg-amber-950/90 border border-amber-500 text-amber-200 flex items-center justify-between text-xs animate-pulse">
                          <div className="flex items-center space-x-2 font-bold">
                            <Activity className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                            <span className="truncate">Solenoide Ativo • A desengatar trinco</span>
                          </div>
                          <span className="font-mono font-extrabold text-xs bg-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-500 shrink-0">
                            00:0{box.pulseCountdown}s
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: TIMER SEQUENCIAL & AGENDAMENTOS */}
        {activeTab === 'modes' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Mode Selector Card */}
            <section className="bg-[#162032] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2 font-heading">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Modo de Operação</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comutação ativa de lógica no microcontrolador
                  </p>
                </div>
              </div>

              {/* Mode Toggle Switch */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
                <button
                  onClick={() => handleToggleModo('DELAY')}
                  className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 touch-manipulation ${
                    modoOperacao === 'DELAY'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Modo DELAY</span>
                </button>

                <button
                  onClick={() => handleToggleModo('AGENDA')}
                  className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 touch-manipulation ${
                    modoOperacao === 'AGENDA'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Modo AGENDA</span>
                </button>
              </div>
            </section>

            {/* DELAY MODE CONTROLS */}
            {modoOperacao === 'DELAY' && (
              <section className="bg-[#162032] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-sm text-slate-200">
                      Sequenciador com Intervalo
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
                    Atual: {intervaloMinutos} min
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Abre a Box 1 de imediato, aguarda o tempo definido e abre sequencialmente as baias seguintes.
                </p>

                {/* Quick Chips for Minutes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Atalhos Rápidos de Tempo
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[5, 10, 15, 30, 60].map((min) => (
                      <button
                        key={min}
                        onClick={() => handleSaveDelayInterval(min)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                          intervaloMinutos === min
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                            : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                        }`}
                      >
                        {min}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Minutes Input */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={intervaloMinutos}
                    onChange={(e) => setIntervaloMinutos(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-28 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleSaveDelayInterval()}
                    disabled={statusConexao !== 'online'}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <span>Guardar Intervalo</span>
                  </button>
                </div>

                {/* Sequencer Start & Stop Controls */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleStartSequence}
                    disabled={statusConexao !== 'online'}
                    className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer touch-manipulation"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar Sequência</span>
                  </button>

                  <button
                    onClick={handleStopSequence}
                    disabled={statusConexao !== 'online'}
                    className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-rose-500/40 text-rose-300 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer touch-manipulation"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Parar Sequência</span>
                  </button>
                </div>
              </section>
            )}

            {/* AGENDA MODE CONTROLS */}
            {modoOperacao === 'AGENDA' && (
              <section className="bg-[#162032] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-sm text-slate-200">
                      Horários Diários Fixos (NTP)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">cmd/schedule</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {boxes.map((box) => (
                    <div
                      key={box.id}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white font-mono">
                          Box 0{box.id} • {box.nome}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            box.status === 'ABERTA' ? 'text-rose-400 bg-rose-950' : 'text-emerald-400 bg-emerald-950'
                          }`}
                        >
                          {box.status}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={box.agendaHora}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBoxes((prev) =>
                              prev.map((b) => (b.id === box.id ? { ...b, agendaHora: val } : b))
                            );
                          }}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-300 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => handleUpdateSchedule(box.id, box.agendaHora)}
                          disabled={statusConexao !== 'online'}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                        >
                          Gravar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 3: CONSOLA & EVENTOS MQTT */}
        {activeTab === 'logs' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <section className="bg-[#162032] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-heading">
                    Consola de Mensagens MQTT
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyLogs}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-emerald-400" />
                    <span>{copiedLogToast ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={handleClearLogs}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Limpar</span>
                  </button>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center space-x-2 pb-1 overflow-x-auto text-[11px]">
                <button
                  onClick={() => setLogFilter('all')}
                  className={`px-2.5 py-1 rounded-lg border font-mono ${
                    logFilter === 'all'
                      ? 'bg-slate-800 text-emerald-400 border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Todos ({logs.length})
                </button>
                <button
                  onClick={() => setLogFilter('sent')}
                  className={`px-2.5 py-1 rounded-lg border font-mono ${
                    logFilter === 'sent'
                      ? 'bg-slate-800 text-emerald-400 border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Enviados
                </button>
                <button
                  onClick={() => setLogFilter('received')}
                  className={`px-2.5 py-1 rounded-lg border font-mono ${
                    logFilter === 'received'
                      ? 'bg-slate-800 text-teal-400 border-teal-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Recebidos
                </button>
                <button
                  onClick={() => setLogFilter('err')}
                  className={`px-2.5 py-1 rounded-lg border font-mono ${
                    logFilter === 'err'
                      ? 'bg-slate-800 text-rose-400 border-rose-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Erros
                </button>
              </div>

              {/* Log Feed */}
              <div className="h-[60vh] sm:h-96 overflow-y-auto bg-slate-950/95 border border-slate-800 rounded-2xl p-3 font-mono text-[11px] space-y-1.5 scrollbar-thin">
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 italic py-10 space-y-1">
                    <span>Sem eventos correspondentes no registo.</span>
                    <span className="text-[10px]">Clica em "Ping" ou envia um comando para gerar tráfego.</span>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2 rounded-xl border flex items-start space-x-2 leading-relaxed ${
                        log.type === 'sent'
                          ? 'bg-slate-900/90 border-slate-800 text-emerald-300'
                          : log.type === 'received'
                          ? 'bg-slate-900/90 border-slate-800 text-teal-300'
                          : log.type === 'err'
                          ? 'bg-rose-950/60 border-rose-900/80 text-rose-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-slate-500 shrink-0 text-[10px]">{log.timestamp}</span>
                      <span className="break-all flex-1">{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* TAB 4: SIMULADOR ESP32 VIRTUAL */}
        {activeTab === 'simulator' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <section className="bg-[#162032] border border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white font-heading">
                    Simulador Virtual de Bancada
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/60 text-emerald-300 font-mono text-[10px]">
                  WSS Mock
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Gera respostas automáticas idênticas às emitidas pelo hardware real da ESP32. Perfeito para validação sem a placa conectada.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  onClick={() => handleSimulatePresence('online')}
                  className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer touch-manipulation"
                >
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Emitir Presença ONLINE</span>
                </button>

                <button
                  onClick={handleSimulateFullState}
                  className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-300 font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer touch-manipulation"
                >
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Emitir Telemetria (State)</span>
                </button>

                <button
                  onClick={handleSimulatePong}
                  className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer touch-manipulation"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Responder PONG ao Ping</span>
                </button>
              </div>
            </section>
          </div>
        )}

      </main>

      {/* ==============================================================================
          BOTTOM MOBILE NAVIGATION BAR (APP NATIVE NAVIGATION)
         ============================================================================== */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] px-2 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          
          <button
            onClick={() => setActiveTab('boxes')}
            className={`min-h-[50px] py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all select-none touch-manipulation cursor-pointer relative ${
              activeTab === 'boxes'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeTab === 'boxes' && (
              <span className="absolute top-1 w-6 h-1 bg-emerald-400 rounded-full animate-in fade-in duration-200"></span>
            )}
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-none">Baias</span>
          </button>

          <button
            onClick={() => setActiveTab('modes')}
            className={`min-h-[50px] py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all select-none touch-manipulation cursor-pointer relative ${
              activeTab === 'modes'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeTab === 'modes' && (
              <span className="absolute top-1 w-6 h-1 bg-emerald-400 rounded-full animate-in fade-in duration-200"></span>
            )}
            <Clock className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-none">Timer</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`min-h-[50px] py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all select-none touch-manipulation cursor-pointer relative ${
              activeTab === 'logs'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeTab === 'logs' && (
              <span className="absolute top-1 w-6 h-1 bg-emerald-400 rounded-full animate-in fade-in duration-200"></span>
            )}
            <Terminal className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-none">Consola</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`min-h-[50px] py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all select-none touch-manipulation cursor-pointer relative ${
              activeTab === 'simulator'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeTab === 'simulator' && (
              <span className="absolute top-1 w-6 h-1 bg-emerald-400 rounded-full animate-in fade-in duration-200"></span>
            )}
            <Cpu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-none">Simulador</span>
          </button>
        </div>
      </nav>

      {/* ==============================================================================
          SETTINGS MODAL / DRAWER (CLIENT ID & MACHINE ID CONFIG)
         ============================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-md bg-[#162032] border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base text-white font-heading">
                  Definições do Alvo MQTT
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyNewTarget} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Client ID (Cliente / Quinta)
                </label>
                <input
                  type="text"
                  value={tempClientId}
                  onChange={(e) => setTempClientId(e.target.value)}
                  placeholder="Emanuel"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Machine ID (Armário / Caixa)
                </label>
                <input
                  type="text"
                  value={tempMachineId}
                  onChange={(e) => setTempMachineId(e.target.value)}
                  placeholder="Maquina1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Active Base Topic Preview */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Tópico Ativo:</span>
                <span className="text-emerald-300 break-all">
                  gallopit/{tempClientId || '{client}'}/{tempMachineId || '{machine}'}/status/#
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md cursor-pointer flex items-center justify-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Aplicar e Ligar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
