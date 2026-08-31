import React, { useState } from 'react';
import { MqttConfig, SupabaseConfig, OperatingMode, Armario } from '../types';
import { SingleFileHtmlExporter } from './SingleFileHtmlExporter';
import { Settings, X, Save, Shield, Radio, Database, RotateCcw, Check, Code, Layers, Tag, Info, Download } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mqttConfig: MqttConfig;
  supabaseConfig: SupabaseConfig;
  modoAtual: OperatingMode;
  armarios?: Armario[];
  onSaveMqttConfig: (cfg: MqttConfig) => void;
  onSaveSupabaseConfig: (cfg: SupabaseConfig) => void;
  onChangeModoOperacao: (modo: OperatingMode) => void;
  onUpdateTopicoArmario?: (id: string, novoTopico: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  mqttConfig,
  supabaseConfig,
  modoAtual,
  armarios = [],
  onSaveMqttConfig,
  onSaveSupabaseConfig,
  onChangeModoOperacao,
  onUpdateTopicoArmario
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'mqtt' | 'supabase' | 'export'>('geral');

  // Form states
  const [mqttForm, setMqttForm] = useState<MqttConfig>({ ...mqttConfig });
  const [supaForm, setSupaForm] = useState<SupabaseConfig>({ ...supabaseConfig });
  const [salvoFeedback, setSalvoFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMqttConfig(mqttForm);
    onSaveSupabaseConfig(supaForm);
    setSalvoFeedback(true);
    setTimeout(() => {
      setSalvoFeedback(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    const defaultMqtt: MqttConfig = {
      brokerUrl: 'wss://test.mosquitto.org:8081/mqtt',
      username: '',
      password: '',
      clientId: 'gallopit_web_' + Math.random().toString(16).substring(2, 8),
      topicPrefix: 'gallopit/cliente_1'
    };
    const defaultSupa: SupabaseConfig = {
      url: '',
      anonKey: ''
    };
    setMqttForm(defaultMqtt);
    setSupaForm(defaultSupa);
    onSaveMqttConfig(defaultMqtt);
    onSaveSupabaseConfig(defaultSupa);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border-t md:border border-stone-200/80 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">

        {/* Mobile Pull Handle */}
        <div className="w-full pt-3 pb-1 flex justify-center md:hidden">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-white border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 shrink-0">
              <Settings className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-stone-800 font-heading">
                Configurações
              </h3>
              <p className="text-xs text-stone-500 font-normal">
                Modo, MQTT, Supabase e exportação
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors flex items-center justify-center touch-manipulation"
            aria-label="Fechar Configurações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs - Touch Pan X */}
        <div className="flex border-b border-stone-100 bg-stone-50/50 px-4 sm:px-6 pt-2 space-x-2 text-xs font-semibold overflow-x-auto touch-pan-x scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`min-h-[44px] py-2.5 px-3.5 rounded-t-xl transition-all flex items-center space-x-2 shrink-0 touch-manipulation ${
              activeTab === 'geral'
                ? 'bg-white text-stone-800 font-bold border-t border-x border-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Shield className="w-4 h-4 text-[#558b5b]" />
            <span>Operação</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mqtt')}
            className={`min-h-[44px] py-2.5 px-3.5 rounded-t-xl transition-all flex items-center space-x-2 shrink-0 touch-manipulation ${
              activeTab === 'mqtt'
                ? 'bg-white text-stone-800 font-bold border-t border-x border-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Radio className="w-4 h-4 text-[#558b5b]" />
            <span>Broker MQTT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`min-h-[44px] py-2.5 px-3.5 rounded-t-xl transition-all flex items-center space-x-2 shrink-0 touch-manipulation ${
              activeTab === 'supabase'
                ? 'bg-white text-stone-800 font-bold border-t border-x border-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Database className="w-4 h-4 text-[#558b5b]" />
            <span>Supabase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`min-h-[44px] py-2.5 px-3.5 rounded-t-xl transition-all flex items-center space-x-2 shrink-0 touch-manipulation ${
              activeTab === 'export'
                ? 'bg-white text-stone-800 font-bold border-t border-x border-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Download className="w-4 h-4 text-[#558b5b]" />
            <span>Exportar</span>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSaveAll} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs touch-pan-y">

          {/* TAB 1: GERAL (MODO) */}
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <div>
                <label className="block font-bold text-sm text-stone-800 font-heading mb-1">
                  Seletor Global de Modo de Operação
                </label>
                <p className="text-stone-500 mb-4">
                  Escolha se o controlador atua em sequência encadeada (Delay) ou por horário fixo (Agenda).
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => onChangeModoOperacao('DELAY')}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      modoAtual === 'DELAY'
                        ? 'bg-[#e6f4ea] border-[#a3c9a8] text-[#2e5334] shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1 font-heading">Modo DELAY</div>
                    <div className="text-xs opacity-80 font-normal">Sequência encadeada de abertura por intervalos.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeModoOperacao('AGENDA')}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      modoAtual === 'AGENDA'
                        ? 'bg-[#e6f4ea] border-[#a3c9a8] text-[#2e5334] shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1 font-heading">Modo AGENDA</div>
                    <div className="text-xs opacity-80 font-normal">Abertura programada por relógio interno (HH:mm).</div>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-800 font-heading">Persistência Local</div>
                  <div className="text-stone-500 text-xs">Parâmetros e credenciais salvos no navegador.</div>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MQTT & CUSTOMER TOPICS */}
          {activeTab === 'mqtt' && (
            <div className="space-y-6">

              {/* Informative Banner about Shared Broker */}
              <div className="p-4 rounded-2xl bg-[#e6f4ea]/60 border border-[#d1e6d3] text-[#2e5334] space-y-1">
                <div className="flex items-center space-x-2 font-bold font-heading text-sm">
                  <Info className="w-4 h-4 text-[#558b5b]" />
                  <span>Isolamento Multicliente no Broker Compartilhado</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Para utilizar o mesmo broker MQTT (ex: <code className="bg-white px-1 py-0.5 rounded border text-[#2e5334]">test.mosquitto.org</code>) para múltiplos clientes sem interferência, configure o <strong>Tópico Base do Cliente</strong> e o <strong>Tópico Específico de cada Armário</strong>.
                </p>
              </div>

              {/* Broker URL */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  URL do Broker MQTT (WebSockets WSS para Navegador)
                </label>
                <input
                  type="text"
                  value={mqttForm.brokerUrl}
                  onChange={(e) => setMqttForm({ ...mqttForm, brokerUrl: e.target.value })}
                  placeholder="wss://test.mosquitto.org:8081/mqtt"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 font-mono text-xs focus:outline-none focus:border-[#a3c9a8]"
                />
                <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                  💡 <strong>Nota sobre <code className="font-mono text-stone-700">mqtt://test.mosquitto.org:1883</code>:</strong> Os microcontroladores ESP32 ligam-se via protocolo TCP (porta 1883). Na Web, os navegadores exigem WebSockets (<code className="font-mono text-stone-700">wss://test.mosquitto.org:8081/mqtt</code>). A aplicação trata automaticamente a conversão caso digite <code className="font-mono text-stone-700">mqtt://...</code>.
                </p>
              </div>

              {/* Client Base Topic / Prefix */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Identificador / Tópico Base do Cliente (Tenant ID)
                </label>
                <input
                  type="text"
                  value={mqttForm.topicPrefix}
                  onChange={(e) => setMqttForm({ ...mqttForm, topicPrefix: e.target.value })}
                  placeholder="ex: gallopit/quinta_santo_antonio"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-stone-800 text-xs focus:outline-none focus:border-[#a3c9a8]"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Define o prefixo único do cliente no broker. Exemplo: <code className="font-mono text-stone-600">gallopit/cliente_123</code>
                </p>
              </div>

              {/* Per-Cabinet Topics Table */}
              <div className="pt-2 border-t border-stone-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                  <span className="font-bold text-sm text-stone-800 font-heading flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#558b5b]" />
                    <span>Tópicos dos Armários do Cliente ({armarios.length})</span>
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono break-all">
                    Estrutura: {mqttForm.topicPrefix || 'gallopit/cliente'}/[Tópico_Armário]
                  </span>
                </div>

                <div className="space-y-3">
                  {armarios.map((armario) => {
                    const currentTopic = armario.topicoMqtt || armario.id;
                    const fullTopicPreview = `${mqttForm.topicPrefix || 'gallopit/cliente'}/${currentTopic}`;

                    return (
                      <div key={armario.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="font-bold text-stone-800 text-xs flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full bg-[#a3c9a8] shrink-0"></span>
                            <span className="truncate">{armario.nome}</span>
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono break-all">
                            Comando: <code className="text-[#2e5334] font-semibold">{fullTopicPreview}/comando/manutencao</code>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
                          <span className="text-[11px] text-stone-400 font-mono shrink-0">Subtópico:</span>
                          <input
                            type="text"
                            value={currentTopic}
                            onChange={(e) => {
                              const cleanVal = e.target.value.toLowerCase().replace(/\s+/g, '_');
                              if (onUpdateTopicoArmario) {
                                onUpdateTopicoArmario(armario.id, cleanVal);
                              }
                            }}
                            className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-stone-800 flex-1 sm:flex-initial sm:w-36 focus:outline-none focus:border-[#a3c9a8]"
                            placeholder="ex: armario1"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    MQTT Username (Opcional)
                  </label>
                  <input
                    type="text"
                    value={mqttForm.username || ''}
                    onChange={(e) => setMqttForm({ ...mqttForm, username: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 focus:outline-none focus:border-[#a3c9a8]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    MQTT Password (Opcional)
                  </label>
                  <input
                    type="password"
                    value={mqttForm.password || ''}
                    onChange={(e) => setMqttForm({ ...mqttForm, password: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 focus:outline-none focus:border-[#a3c9a8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Client ID da Aplicação Web
                </label>
                <input
                  type="text"
                  value={mqttForm.clientId}
                  onChange={(e) => setMqttForm({ ...mqttForm, clientId: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-stone-600 focus:outline-none focus:border-[#a3c9a8] break-all"
                />
              </div>

            </div>
          )}

          {/* TAB 3: SUPABASE */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  URL do Projeto Supabase
                </label>
                <input
                  type="text"
                  value={supaForm.url}
                  onChange={(e) => setSupaForm({ ...supaForm, url: e.target.value })}
                  placeholder="https://sua-id.supabase.co"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 focus:outline-none focus:border-[#a3c9a8]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Chave API Pública (Anon Key)
                </label>
                <textarea
                  rows={3}
                  value={supaForm.anonKey}
                  onChange={(e) => setSupaForm({ ...supaForm, anonKey: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-xs text-stone-600 focus:outline-none focus:border-[#a3c9a8]"
                />
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT SINGLE FILE */}
          {activeTab === 'export' && (
            <SingleFileHtmlExporter
              mqttConfig={mqttForm}
              supabaseConfig={supaForm}
              modoAtual={modoAtual}
            />
          )}

          {/* Footer Save Button */}
          {activeTab !== 'export' && (
            <div className="pt-4 border-t border-stone-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#a3c9a8] hover:bg-[#8fbc8f] text-white font-medium shadow-sm flex items-center space-x-2 active:scale-95 transition-all"
              >
                {salvoFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Salvo com Sucesso</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Configurações</span>
                  </>
                )}
              </button>
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
