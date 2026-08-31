import React, { useState } from 'react';
import { ClientAccount } from '../types';
import { UserCheck, Shield, Key, X, Building2, Mail, CheckCircle2, ArrowRight, UserPlus, LogOut } from 'lucide-react';

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClient: ClientAccount;
  onLoginClient?: (account: ClientAccount) => void;
  onSelectClient?: (account: ClientAccount) => void;
  onLogoutClient?: () => void;
  onLogout?: () => void;
}

const PRESET_CLIENTS: ClientAccount[] = [
  {
    id: 'cliente_quinta_santo_antonio',
    nomeCliente: 'Quinta Santo António',
    email: 'quinta.santo.antonio@gallopit.com',
    topicPrefix: 'gallopit/quinta_santo_antonio',
    dataCriacao: new Date().toISOString()
  },
  {
    id: 'cliente_hipico_porto',
    nomeCliente: 'Centro Hípico do Porto',
    email: 'gestao@hipicoporto.pt',
    topicPrefix: 'gallopit/hipico_porto',
    dataCriacao: new Date().toISOString()
  },
  {
    id: 'cliente_cavalarica_real',
    nomeCliente: 'Cavalariça Real',
    email: 'admin@cavalaricareal.com',
    topicPrefix: 'gallopit/cavalarica_real',
    dataCriacao: new Date().toISOString()
  }
];

export const ClientAuthModal: React.FC<ClientAuthModalProps> = ({
  isOpen,
  onClose,
  currentClient,
  onLoginClient,
  onSelectClient,
  onLogoutClient,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'presets' | 'cadastro'>('presets');

  const handleAccountSelection = (account: ClientAccount) => {
    if (onLoginClient) onLoginClient(account);
    else if (onSelectClient) onSelectClient(account);
  };

  const handleAccountLogout = () => {
    if (onLogoutClient) onLogoutClient();
    else if (onLogout) onLogout();
  };

  // Custom Form State
  const [nomeCliente, setNomeCliente] = useState('');
  const [email, setEmail] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCliente.trim() || !email.trim()) return;

    const cleanId = 'cliente_' + nomeCliente.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const topicPrefix = 'gallopit/' + nomeCliente.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const newAccount: ClientAccount = {
      id: cleanId,
      nomeCliente: nomeCliente.trim(),
      email: email.trim(),
      topicPrefix,
      dataCriacao: new Date().toISOString()
    };

    handleAccountSelection(newAccount);
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      onClose();
    }, 1000);
  };

  const handleSelectPreset = (preset: ClientAccount) => {
    handleAccountSelection(preset);
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border-t md:border border-stone-200/80 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">

        {/* Mobile Drag/Pull Indicator Handle */}
        <div className="w-full pt-3 pb-1 flex justify-center md:hidden">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-white border-b border-stone-100 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 shrink-0">
              <Building2 className="w-5 h-5 text-[#558b5b]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base sm:text-xl text-stone-800 font-heading truncate">
                Identificação de Cliente (Conta)
              </h3>
              <p className="text-xs text-stone-500 truncate">
                Registo e rastreio de auditoria no Supabase por cliente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors flex items-center justify-center touch-manipulation shrink-0"
            aria-label="Fechar Janela de Cliente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Account Info Card */}
        <div className="p-4 sm:p-5 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Conta Ativa no Momento</span>
            <div className="font-bold text-stone-800 text-sm font-heading flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a3c9a8] inline-block animate-pulse shrink-0"></span>
              <span className="truncate">{currentClient.nomeCliente}</span>
            </div>
            <div className="text-xs text-stone-500 font-mono flex items-center gap-1 min-w-0">
              <Mail className="w-3 h-3 text-stone-400 shrink-0" />
              <span className="truncate">{currentClient.email}</span>
            </div>
          </div>

          {(onLogoutClient || onLogout) && (
            <button
              onClick={() => {
                handleAccountLogout();
                onClose();
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center gap-1.5 shrink-0 active:scale-95 touch-manipulation"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair da Conta</span>
              <span className="sm:hidden">Sair</span>
            </button>
          )}
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-stone-100 bg-white px-4 sm:px-6 pt-2 space-x-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`min-h-[44px] py-2.5 px-4 rounded-t-xl transition-all flex items-center space-x-2 touch-manipulation ${
              activeTab === 'presets'
                ? 'bg-stone-50 text-stone-800 font-bold border-t border-x border-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#558b5b]" />
            <span>Contas Demo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cadastro')}
            className={`min-h-[44px] py-2.5 px-4 rounded-t-xl transition-all flex items-center space-x-2 touch-manipulation ${
              activeTab === 'cadastro'
                ? 'bg-stone-50 text-stone-800 font-bold border-t border-x border-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-4 h-4 text-[#558b5b]" />
            <span>Nova Conta</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 bg-stone-50/30 overflow-y-auto max-h-[60vh] space-y-3 touch-pan-y">

          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">
                Selecione um perfil de cliente cadastrado para isolar tópicos MQTT e registar o histórico de acessos no Supabase:
              </p>

              {PRESET_CLIENTS.map((preset) => {
                const isSelected = currentClient.id === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`min-h-[54px] p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 active:scale-[0.98] touch-manipulation ${
                      isSelected
                        ? 'bg-[#e6f4ea] border-[#a3c9a8] shadow-sm'
                        : 'bg-white border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/80'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="font-bold text-stone-800 text-sm font-heading flex flex-wrap items-center gap-2">
                        <span className="truncate max-w-[200px] sm:max-w-none">{preset.nomeCliente}</span>
                        {isSelected && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#558b5b] text-white whitespace-nowrap">
                            Ativa
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 font-mono truncate">
                        {preset.email}
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono break-all">
                        Tópico Base: <code className="text-[#2e5334] font-semibold">{preset.topicPrefix}</code>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-[#558b5b]" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-stone-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'cadastro' && (
            <form onSubmit={handleCustomLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1.5">
                  Nome da Quinta / Centro Hípico / Cliente
                </label>
                <input
                  type="text"
                  required
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  placeholder="ex: Haras Monte Verde"
                  className="w-full min-h-[44px] bg-white border border-stone-200 rounded-xl p-3 text-stone-800 font-medium focus:outline-none focus:border-[#a3c9a8] touch-manipulation"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1.5">
                  Email de Acesso / Responsável
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: contato@harasmonteverde.pt"
                  className="w-full min-h-[44px] bg-white border border-stone-200 rounded-xl p-3 text-stone-800 focus:outline-none focus:border-[#a3c9a8] touch-manipulation"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-100 text-stone-600 text-[11px] leading-relaxed">
                ℹ️ Ao registar, o sistema gera automaticamente o identificador de tópicos MQTT <code className="font-mono text-stone-800 bg-white px-1 py-0.5 rounded border">gallopit/nome_cliente</code> e vincula todos os acionamentos de tranca e relatórios de auditoria ao Supabase.
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#a3c9a8] hover:bg-[#8fbc8f] text-white font-bold text-sm shadow-sm flex items-center justify-center space-x-2 active:scale-98 transition-all touch-manipulation"
              >
                {feedbackSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Identificado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Entrar como este Cliente</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
