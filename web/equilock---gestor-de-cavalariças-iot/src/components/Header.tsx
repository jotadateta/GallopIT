import React, { useState } from 'react';
import { ConnectionStatus, OperatingMode, UserProfile } from '../types';
import {
  Settings,
  RefreshCw,
  Radio,
  Shield,
  KeyRound,
  Cpu,
  Menu,
  X,
  Sliders,
  Calendar,
  History,
  LayoutGrid,
  Building2,
  UserCheck,
  LogOut,
  Users,
  Wrench,
  User
} from 'lucide-react';

export type AppTab = 'manual' | 'sequence' | 'schedule' | 'history' | 'developer' | 'users';

interface HeaderProps {
  statusConexao: ConnectionStatus;
  statusArmario: 'online' | 'offline';
  modoAtual: OperatingMode;
  activeTab: AppTab;
  activeUser: UserProfile | null;
  onSelectTab: (tab: AppTab) => void;
  onOpenSettings: () => void;
  onOpenSimulator: () => void;
  onOpenUserManager: () => void;
  onLogout: () => void;
  onReconnectMQTT: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  statusConexao,
  statusArmario,
  modoAtual,
  activeTab,
  activeUser,
  onSelectTab,
  onOpenSettings,
  onOpenSimulator,
  onOpenUserManager,
  onLogout,
  onReconnectMQTT
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isOnline = statusConexao === 'online' && statusArmario === 'online';

  const isDev = activeUser?.role === 'DEVELOPER';
  const isAdmin = activeUser?.role === 'CLIENT_ADMIN';
  const isOp = activeUser?.role === 'OPERATOR';

  // Build tabs dynamically based on RBAC Role
  const menuItems: { id: AppTab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: 'manual', label: 'Controlo Manual', icon: <LayoutGrid className="w-4 h-4" />, show: true },
    { id: 'sequence', label: 'Sequência Diária', icon: <Sliders className="w-4 h-4" />, show: true },
    { id: 'schedule', label: 'Agendamento', icon: <Calendar className="w-4 h-4" />, show: !isOp || true },
    { id: 'history', label: 'Histórico & Auditoria', icon: <History className="w-4 h-4" />, show: true },
    { id: 'developer', label: 'Painel Developer (Hardware)', icon: <Wrench className="w-4 h-4" />, show: isDev },
  ];

  const visibleMenuItems = menuItems.filter((i) => i.show);

  const handleTabClick = (tab: AppTab) => {
    onSelectTab(tab);
    setMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-stone-200/80 shadow-[0_2px_20px_rgba(0,0,0,0.02)] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">

          {/* Left Brand Identity & Status Badge */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center border border-stone-200/80 shadow-2xs">
              <svg
                className="w-5 h-5 text-[#558b5b]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 4C7 4 4 7 4 13C4 18 7.5 21 12 21C16.5 21 20 18 20 13C20 7 17 4 17 4" />
                <circle cx="6" cy="10" r="0.8" fill="currentColor" />
                <circle cx="7" cy="14" r="0.8" fill="currentColor" />
                <circle cx="18" cy="10" r="0.8" fill="currentColor" />
                <circle cx="17" cy="14" r="0.8" fill="currentColor" />
              </svg>
            </div>

            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-800 font-heading">
                  EquiLock IoT
                </h1>
                
                {/* Minimalist Status Badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#2e5334]">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#558b5b]' : 'bg-amber-500'}`}></span>
                  <span className="hidden sm:inline">{isOnline ? 'Sistema Online' : 'MQTT Off'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-stone-50 p-1 rounded-2xl border border-stone-200/80">
            {visibleMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              const isDevTab = item.id === 'developer';

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? isDevTab
                        ? 'bg-purple-800 text-white shadow-xs'
                        : 'bg-white text-stone-800 shadow-xs border border-stone-200'
                      : isDevTab
                      ? 'text-purple-700 hover:bg-purple-50'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar & User Profile Indicator */}
          <div className="flex items-center space-x-2">

            {/* Client Admin: User Management Button */}
            {(isAdmin || isDev) && (
              <button
                type="button"
                onClick={onOpenUserManager}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-[#a3c9a8] text-[#2e5334] text-xs font-bold transition-all active:scale-95"
                title="Gerir Utilizadores e Permissões"
              >
                <Users className="w-4 h-4 text-[#558b5b]" />
                <span>Tratadores</span>
              </button>
            )}

            {/* Active User Pill with Role Indicator */}
            {activeUser && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs min-w-0">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isDev
                    ? 'bg-purple-100 text-purple-800'
                    : isAdmin
                    ? 'bg-[#e6f4ea] text-[#2e5334]'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isDev ? <Wrench className="w-3.5 h-3.5" /> : isAdmin ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                <div className="text-left min-w-0">
                  <div className="font-bold text-stone-800 leading-tight max-w-[150px] truncate flex items-center gap-1" title={activeUser.full_name}>
                    {activeUser.username && (
                      <span className="font-mono text-stone-900 text-xs font-extrabold">@{activeUser.username}</span>
                    )}
                    <span className="text-stone-500 font-normal text-[11px] truncate">({activeUser.full_name.split(' ')[0]})</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded whitespace-nowrap ${
                      isDev
                        ? 'bg-purple-200/70 text-purple-900'
                        : isAdmin
                        ? 'bg-emerald-200/70 text-emerald-950'
                        : 'bg-blue-200/70 text-blue-900'
                    }`}>
                      {activeUser.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Simulator Toggle Button */}
            <button
              onClick={onOpenSimulator}
              className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors hidden sm:flex items-center space-x-1.5 text-xs font-semibold"
              title="Simulador de Hardware ESP32"
            >
              <Cpu className="w-4 h-4 text-[#558b5b]" />
              <span className="hidden xl:inline">Simulador</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              title="Configurações MQTT / Supabase"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-rose-600 hover:bg-rose-50 transition-colors"
              title="Terminar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-stone-700 lg:hidden flex items-center justify-center"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-stone-100 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {/* User Details in Mobile */}
            {activeUser && (
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isDev ? 'bg-purple-100 text-purple-800' : isAdmin ? 'bg-[#e6f4ea] text-[#2e5334]' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {activeUser.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-stone-800 text-xs truncate" title={activeUser.full_name}>
                      {activeUser.full_name}
                    </div>
                    <div className="text-[11px] text-stone-500 truncate" title={activeUser.company_name || activeUser.email}>
                      {activeUser.company_name || activeUser.email}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-stone-200 text-stone-800 shrink-0 whitespace-nowrap">
                  {activeUser.role}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {visibleMenuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`min-h-[44px] p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                      isActive
                        ? 'bg-[#a3c9a8] text-white shadow-xs'
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Client Admin Extra Action in Mobile */}
            {(isAdmin || isDev) && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenUserManager();
                }}
                className="w-full min-h-[44px] p-2.5 rounded-xl bg-emerald-50 text-[#2e5334] font-bold text-xs border border-[#a3c9a8] flex items-center justify-center space-x-2"
              >
                <Users className="w-4 h-4 text-[#558b5b] shrink-0" />
                <span className="truncate">Gestão de Tratadores e Permissões</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSimulator();
                }}
                className="min-h-[44px] p-2.5 rounded-xl bg-stone-50 text-stone-700 font-semibold text-xs border border-stone-200/80 flex items-center justify-center space-x-2"
              >
                <Cpu className="w-4 h-4 text-[#558b5b] shrink-0" />
                <span className="truncate">Simulador ESP32</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="min-h-[44px] p-2.5 rounded-xl bg-rose-50 text-rose-700 font-semibold text-xs border border-rose-200 flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="truncate">Terminar Sessão</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
