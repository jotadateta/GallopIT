import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  Power,
  Lock,
  Unlock,
  Radio,
  Clock,
  Terminal,
  Activity,
  Zap,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Copy,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  Save,
  Sliders,
  RotateCcw,
  Download,
  Info,
  Layers,
  ChevronDown,
  ChevronUp
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

export default function App() {
  // 1. Connection Target Settings
  const [clientId, setClientId] = useState('haras_quinta_do_sol');
  const [machineId, setMachineId] = useState('box_principal_01');

  // Connection & Latency Status
  const [statusConexao, setStatusConexao] = useState<'connecting' | 'online' | 'offline' | 'disconnected'>('disconnected');
  const [presenceOnline, setPresenceOnline] = useState<boolean>(true);
  const [lastPingLatency, setLastPingLatency] = useState<number | null>(null);

  // 2. 4 Boxes Logical State (Prateleiras 1 a 4)
  const [boxes, setBoxes] = useState<BoxItem[]>([
    { id: 1, nome: 'Cavalariça Principal', status: 'ARMADA', rele_ativo: false, pulseCountdown: 0, agendaHora: '07:00', hora: 7, minuto: 0, ativo: true },
    { id: 2, nome: 'Cavalariça Central', status: 'ARMADA', rele_ativo: false, pulseCountdown: 0, agendaHora: '07:30', hora: 7, minuto: 30, ativo: true },
    { id: 3, nome: 'Baia Desportiva', status: 'ARMADA', rele_ativo: false, pulseCountdown: 0, agendaHora: '08:00', hora: 8, minuto: 0, ativo: true },
    { id: 4, nome: 'Paddock Poente', status: 'ARMADA', rele_ativo: false, pulseCountdown: 0, agendaHora: '08:30', hora: 8, minuto: 30, ativo: true },
  ]);

  // 3. Operating Mode & Sequence Config
  const [modoOperacao, setModoOperacao] = useState<'DELAY' | 'AGENDA'>('DELAY');
  const [intervaloMinutos, setIntervaloMinutos] = useState<number>(5);

  // 4. Telemetry Details
  const [firmware, setFirmware] = useState('2.2.0-ESP32');
  const [wifiRssi, setWifiRssi] = useState(-45);

  // 5. Console Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copiedLogToast, setCopiedLogToast] = useState(false);

  // 6. Simulator Drawer/Modal Toggle
  const [showSimulator, setShowSimulator] = useState(false);

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
    setLogs((prev) => [entry, ...prev].slice(0, 100));
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
    setLastPingLatency(null);
    mqttClientRef.current.updateTarget(clientId, machineId);
  };

  // ==============================================================================
  // COMMAND ACTION HANDLERS
  // ==============================================================================

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

    addLog(`Solenoide acionado! Abertura enviada para Box 0${boxId}`, 'sent');
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

    setBoxes((prev) =>
      prev.map((b) => ({ ...b, status: 'ABERTA' }))
    );

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
    mqttClientRef.current.ping();
    addLog('PING enviado ao microcontrolador ESP32...', 'sent');
  };

  // 6. Pedir Estado Atual (`/cmd/status_get` -> `{}`)
  const handleRefreshState = () => {
    if (!mqttClientRef.current) return;
    mqttClientRef.current.requestState();
    addLog('Solicitação de estado atual (cmd/status_get) transmitida', 'sent');
  };

  // 7. Alternar Modo de Operação (`/cmd/mode` -> `{"modo": "DELAY"|"AGENDA", "intervalo_minutos": X}`)
  const handleToggleModo = (novoModo: 'DELAY' | 'AGENDA') => {
    setModoOperacao(novoModo);
    if (mqttClientRef.current) {
      mqttClientRef.current.setMode(novoModo, intervaloMinutos);
    }
    addLog(`Modo de Operação alterado para: ${novoModo} (Intervalo: ${intervaloMinutos}m)`, 'sent');
  };

  // 8. Salvar Intervalo Sequencial Delay
  const handleSaveDelayInterval = () => {
    if (mqttClientRef.current) {
      mqttClientRef.current.setMode('DELAY', intervaloMinutos);
    }
    addLog(`Novo intervalo de sequência guardado: ${intervaloMinutos} minutos`, 'sent');
  };

  // 9. Agendar Box Individual (`/cmd/schedule` -> `{"box": N, "hora": H, "minuto": M, "ativo": true}`)
  const handleUpdateSchedule = (boxId: number, novaHoraStr: string) => {
    const [hStr, mStr] = novaHoraStr.split(':');
    const h = parseInt(hStr, 10) || 7;
    const m = parseInt(mStr, 10) || 0;

    setBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, agendaHora: novaHoraStr, hora: h, minuto: m } : b))
    );

    if (mqttClientRef.current) {
      mqttClientRef.current.setSchedule(boxId, h, m, true);
    }

    addLog(`Agendamento da Box 0${boxId} atualizado para ${novaHoraStr}`, 'sent');
  };

  // Clear Logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Copy Logs to Clipboard
  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogToast(true);
    setTimeout(() => setCopiedLogToast(false), 2500);
  };

  // Simulator Hardware Emulation Handlers
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
      firmware: '2.2.0-ESP32-MVP',
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

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-slate-950 pb-10">
      
      {/* APP CONTAINER */}
      <div className="max-w-6xl mx-auto w-full px-3.5 sm:px-6 pt-4 sm:pt-6 space-y-5 sm:space-y-6">

        {/* ==============================================================================
            HEADER DE STATUS E CONFIGURAÇÃO DE ALVO (CLIENT ID / MACHINE ID)
           ============================================================================== */}
        <header className="bg-[#1e293b] border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-700/60">
            
            {/* Title & Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 shadow-md shrink-0">
                <Cpu className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-extrabold text-lg sm:text-xl text-white tracking-tight font-heading">
                    GallopIT <span className="text-emerald-400 font-mono text-sm font-semibold">v2.2 MVP</span>
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300 border border-slate-600">
                    Cavalariças IoT
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Validação de Controlo em Tempo Real • WSS broker.emqx.io:8084
                </p>
              </div>
            </div>

            {/* Connection Status Badge & Ping */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              
              {/* MQTT WebSocket Status */}
              <div
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all ${
                  statusConexao === 'online'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 shadow-xs'
                    : statusConexao === 'connecting'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600/60 animate-pulse'
                    : 'bg-rose-950/80 text-rose-300 border-rose-600/60'
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  {statusConexao === 'online' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      statusConexao === 'online'
                        ? 'bg-emerald-400'
                        : statusConexao === 'connecting'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                  ></span>
                </span>
                <span>
                  {statusConexao === 'online'
                    ? '🟢 WSS CONETADO'
                    : statusConexao === 'connecting'
                    ? '🟡 A LIGAR...'
                    : '🔴 DESCONETADO'}
                </span>
              </div>

              {/* Hardware LWT Presence */}
              <div
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 ${
                  presenceOnline
                    ? 'bg-slate-800 text-emerald-400 border-slate-700'
                    : 'bg-slate-800 text-rose-400 border-slate-700'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${presenceOnline ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
                <span>ESP32: {presenceOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>

              {/* Latency if available */}
              {lastPingLatency !== null && (
                <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-mono text-emerald-300 font-semibold">
                  {lastPingLatency}ms
                </span>
              )}

              {/* Ping Button */}
              <button
                onClick={handleSendPing}
                disabled={statusConexao !== 'online'}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95 shadow-md touch-manipulation cursor-pointer"
                title="Enviar Ping ao Equipamento via MQTT"
              >
                <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Ping</span>
              </button>

              {/* Refresh State Button */}
              <button
                onClick={handleRefreshState}
                disabled={statusConexao !== 'online'}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
                title="Atualizar Estado (status_get)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form to change Client ID and Machine ID */}
          <form onSubmit={handleApplyNewTarget} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
            <div className="sm:col-span-5 space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Client ID (Sub-Tópico)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="haras_quinta_do_sol"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="sm:col-span-5 space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Machine ID (Equipamento)
              </label>
              <input
                type="text"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                placeholder="box_principal_01"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 cursor-pointer min-h-[38px]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aplicar</span>
              </button>
            </div>

            <div className="sm:col-span-12 text-[11px] text-slate-400 font-mono flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-slate-500 font-sans font-semibold">Tópico Base Ativo:</span>
              <code className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-emerald-300">
                gallopit/{clientId}/{machineId}/status/#
              </code>
            </div>
          </form>
        </header>

        {/* ==============================================================================
            2. AÇÕES RÁPIDAS (MASTER CONTROLS)
           ============================================================================== */}
        <section className="bg-[#1e293b] border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center space-x-2 font-heading">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Ações Rápidas (Master Controls)</span>
            </h2>
            <span className="text-[11px] text-slate-400">Atuação Global nas 4 Boxes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Abrir Todas as Boxes */}
            <button
              onClick={handleAbrirTodas}
              disabled={statusConexao !== 'online'}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-95 cursor-pointer touch-manipulation"
            >
              <Unlock className="w-4 h-4 stroke-[2.5]" />
              <span>Abrir Todas as Boxes (Master Open)</span>
            </button>

            {/* Armar Todas as Boxes */}
            <button
              onClick={handleArmarTodas}
              disabled={statusConexao !== 'online'}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 disabled:opacity-40 text-emerald-400 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer touch-manipulation"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>Armar Todas as Boxes (Master Arm)</span>
            </button>
          </div>
        </section>

        {/* ==============================================================================
            3. PAINEL VISUAL DO ARMÁRIO (LAYOUT VERTICAL COM 4 PRATELEIRAS EMPILHADAS)
           ============================================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center space-x-2 font-heading">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Painel Visual do Armário (Layout Vertical)</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Pulso Solenoide: 4s
            </span>
          </div>

          {/* Contentor Vertical Central Estilizado (Armário Físico) */}
          <div className="bg-[#1e293b] border-2 border-slate-700/90 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
            {/* Top Cabinet Metallic Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse"></div>
                <span className="text-xs font-extrabold text-slate-200 uppercase tracking-widest font-mono">
                  Armário Físico • 4 Prateleiras Horizontais Empilhadas
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono font-bold bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                ESP32 IoT
              </span>
            </div>

            {/* 4 Secções Horizontais Empilhadas (Prateleiras 1 a 4, de cima para baixo) */}
            <div className="flex flex-col space-y-3 sm:space-y-3.5">
              {boxes.map((box) => {
                const isAberta = box.status === 'ABERTA';
                const isPulsando = box.pulseCountdown > 0 || box.rele_ativo;

                return (
                  <div
                    key={box.id}
                    className={`relative rounded-2xl p-4 border transition-all duration-200 shadow-md ${
                      isPulsando
                        ? 'bg-slate-900/90 border-amber-500/80 shadow-amber-950/20'
                        : isAberta
                        ? 'bg-slate-900/80 border-rose-500/60'
                        : 'bg-slate-900/80 border-slate-700 hover:border-emerald-500/50'
                    }`}
                  >
                    {/* Linha da Prateleira com Elementos Alinhados */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Número e Nome da Prateleira */}
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-emerald-400 shrink-0">
                          0{box.id}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-white font-heading truncate">
                            Prateleira {box.id} <span className="text-slate-400 text-xs font-normal">({box.nome})</span>
                          </h3>
                        </div>
                      </div>

                      {/* Grupo Alinhado: Indicador de Estado, Agendamento Compacto e Botão */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0">
                        
                        {/* Indicador de Estado Visual (🔴 ABERTA ou 🟢 ARMADA) */}
                        <div
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5 border shadow-xs ${
                            isAberta
                              ? 'bg-rose-950/90 text-rose-300 border-rose-600/60'
                              : 'bg-emerald-950/90 text-emerald-300 border-emerald-600/60'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isAberta ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`}></span>
                          <span>{isAberta ? '🔴 ABERTA' : '🟢 ARMADA'}</span>
                        </div>

                        {/* Informações de Agendamento Compacto (ex: ⏰ 07:30) */}
                        <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-mono font-semibold flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>⏰ {box.agendaHora}</span>
                        </div>

                        {/* Botão de Ação Integrado na Linha da Prateleira */}
                        {isAberta ? (
                          <button
                            onClick={() => handleArmarBox(box.id)}
                            disabled={statusConexao !== 'online' || isPulsando}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 font-extrabold text-xs sm:text-sm flex items-center space-x-1.5 transition-all active:scale-95 shadow-md cursor-pointer touch-manipulation min-w-[90px] justify-center"
                          >
                            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Armar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAbrirBox(box.id)}
                            disabled={statusConexao !== 'online' || isPulsando}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 font-extrabold text-xs sm:text-sm flex items-center space-x-1.5 transition-all active:scale-95 shadow-md cursor-pointer touch-manipulation min-w-[90px] justify-center"
                          >
                            <Unlock className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Abrir</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Contagem Decrescente Visual se a prateleira estiver atuando (rele_ativo = true) */}
                    {isPulsando && (
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-950/90 border border-amber-500/80 text-amber-200 flex items-center justify-between text-xs animate-pulse">
                        <div className="flex items-center space-x-2 font-bold">
                          <Activity className="w-4 h-4 text-amber-400 animate-spin" />
                          <span>Atuação em curso • Abertura de Prateleira {box.id}</span>
                        </div>
                        <span className="font-mono font-extrabold text-xs bg-amber-900/90 px-2.5 py-0.5 rounded-lg border border-amber-500 shrink-0">
                          ⏳ 00:0{box.pulseCountdown}s
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==============================================================================
            4. PAINEL DE CONFIGURAÇÃO BÁSICA (MODO + DELAY + AGENDA)
           ============================================================================== */}
        <section className="bg-[#1e293b] border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2 font-heading">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Painel de Configuração Básica</span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecione o modo de funcionamento do microcontrolador
              </p>
            </div>

            {/* Toggle Mode Switch */}
            <div className="inline-flex p-1 bg-slate-900 rounded-2xl border border-slate-700 self-start sm:self-auto">
              <button
                onClick={() => handleToggleModo('DELAY')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modoOperacao === 'DELAY'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Modo DELAY (Sequencial)
              </button>
              <button
                onClick={() => handleToggleModo('AGENDA')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modoOperacao === 'AGENDA'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Modo AGENDA (Horários)
              </button>
            </div>
          </div>

          {/* DELAY MODE CONFIGURATION */}
          {modoOperacao === 'DELAY' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-700/80 space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-200">
                  Configuração de Sequência (Delay entre Boxes)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Ao disparar a sequência no modo DELAY, o sistema abre cada box sequencialmente após o intervalo programado.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <div className="flex items-center space-x-2 flex-1">
                  <label className="text-xs text-slate-300 font-semibold whitespace-nowrap">
                    Intervalo (minutos):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={intervaloMinutos}
                    onChange={(e) => setIntervaloMinutos(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-24 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleSaveDelayInterval}
                  disabled={statusConexao !== 'online'}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Guardar Intervalo</span>
                </button>
              </div>
            </div>
          )}

          {/* AGENDA MODE CONFIGURATION */}
          {modoOperacao === 'AGENDA' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs sm:text-sm text-slate-200 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Horários de Agendamento Diário (HH:MM)</span>
                </h3>
                <span className="text-[11px] text-slate-400">Sincronizado via cmd/schedule</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {boxes.map((box) => (
                  <div
                    key={box.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-200">
                        Box 0{box.id}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {box.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Hora da Abertura
                      </label>
                      <input
                        type="time"
                        value={box.agendaHora}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBoxes((prev) =>
                            prev.map((b) => (b.id === box.id ? { ...b, agendaHora: val } : b))
                          );
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-300 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      onClick={() => handleUpdateSchedule(box.id, box.agendaHora)}
                      disabled={statusConexao !== 'online'}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-emerald-400 font-bold text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Atualizar</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ==============================================================================
            5. CONSOLA DE EVENTOS SIMPLIFICADA (LOGS EM TEMPO REAL)
           ============================================================================== */}
        <section className="bg-[#1e293b] border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-heading">
                Consola de Eventos & Logs MQTT
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyLogs}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                title="Copiar Logs"
              >
                <Copy className="w-3 h-3 text-emerald-400" />
                <span>{copiedLogToast ? 'Copiado!' : 'Copiar'}</span>
              </button>

              <button
                onClick={handleClearLogs}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                title="Limpar Histórico"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Limpar</span>
              </button>
            </div>
          </div>

          <div className="h-48 overflow-y-auto bg-slate-950/90 border border-slate-800 rounded-2xl p-3 font-mono text-[11px] space-y-1.5 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic py-10 space-y-1">
                <span>Nenhum evento gravado no log nesta sessão.</span>
                <span className="text-[10px]">Envie um comando ou clique em "Ping" para testar o tráfego.</span>
              </div>
            ) : (
              logs.map((log) => (
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
                  <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                  <span className="break-all flex-1">{log.text}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ==============================================================================
            6. FERRAMENTAS ADICIONAIS: SIMULADOR ESP32 + EXPORTAÇÃO HTML
           ============================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>{showSimulator ? 'Ocultar Simulador ESP32' : 'Abrir Simulador ESP32 (Modo Teste)'}</span>
            {showSimulator ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="text-[11px] text-slate-500 font-mono">
            GallopIT v2.2 • Single Page Application • EMQX Public Broker
          </div>
        </div>

        {/* EXPANDABLE HARDWARE SIMULATOR PANEL */}
        {showSimulator && (
          <div className="bg-[#1e293b] border border-emerald-500/50 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white font-heading">
                  Emulador Virtual ESP32 Hardware v2.2
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/60 text-emerald-300 font-mono text-[10px]">
                Simulação Local WSS
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Caso não tenha uma placa física ESP32 conectada neste momento, utilize estes botões para emitir eventos de hardware simulados diretamente no broker MQTT público.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                onClick={() => handleSimulatePresence('online')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simular Presença ONLINE</span>
              </button>

              <button
                onClick={handleSimulateFullState}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-teal-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>Emitir Telemetria status/state</span>
              </button>

              <button
                onClick={handleSimulatePong}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Responder PONG ao Ping</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
