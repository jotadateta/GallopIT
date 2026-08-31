import React, { useState } from 'react';
import { UserProfile, UserRole, SupabaseConfig } from '../types';
import { loginWithEmail, SEED_PROFILES } from '../lib/supabaseClient';
import { Lock, Mail, Key, Shield, User, Building2, Wrench, CheckCircle, AlertCircle, ArrowRight, Sparkles, ChevronRight, UserCheck } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  supabaseConfig: SupabaseConfig;
  onOpenSettings: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  supabaseConfig,
  onOpenSettings
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('ADMIN');
  const [password, setPassword] = useState('ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      setErrorMsg('Por favor, informe o nome de utilizador ou email.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await loginWithEmail(usernameOrEmail, password, supabaseConfig);
      if (result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.error || 'Credenciais inválidas. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de autenticação no servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSelect = (presetUser: UserProfile) => {
    setUsernameOrEmail(presetUser.username || presetUser.email);
    setPassword(presetUser.username === 'ADMIN' ? 'ADMIN' : 'demo1234');
    setErrorMsg(null);
    onLoginSuccess(presetUser);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Container */}
      <div className="max-w-md w-full mx-auto space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 shadow-sm mx-auto flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#558b5b]"
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

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-800 font-heading">
            EquiLock IoT
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xs mx-auto">
            Gestão Inteligente de Cavalariças e Controlo de Acessos RBAC
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">

          {/* Connection Pill */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100 text-xs">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-[#558b5b] animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="font-semibold text-stone-700">
                {isSupabaseConfigured ? 'Supabase Auth Conectado' : 'Modo Demonstração / RBAC Ativo'}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-[11px] font-bold text-[#2e5334] hover:underline"
            >
              Configurar DB
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Nome de Utilizador (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="ADMIN"
                  className="w-full min-h-[46px] bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-[#a3c9a8] focus:bg-white transition-colors uppercase font-mono font-bold tracking-wide"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Palavra-passe
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ADMIN"
                  className="w-full min-h-[46px] bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-[#a3c9a8] focus:bg-white transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[50px] py-3.5 px-4 rounded-2xl bg-[#a3c9a8] hover:bg-[#8fbc8f] active:bg-[#7ea884] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>A autenticar...</span>
              ) : (
                <>
                  <span>Entrar no EquiLock</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Switch Profiles (Presets) */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Acesso Rápido por Utilizador
              </span>
            </div>

            <div className="space-y-2">
              {SEED_PROFILES.map((p) => {
                const isDev = p.role === 'DEVELOPER';
                const isAdmin = p.role === 'CLIENT_ADMIN';
                const isOp = p.role === 'OPERATOR';

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQuickDemoSelect(p)}
                    className="w-full text-left p-3 rounded-2xl border border-stone-200/80 hover:border-[#a3c9a8] hover:bg-stone-50/80 transition-all flex items-center justify-between gap-2 group active:scale-[0.98] touch-manipulation"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isDev
                          ? 'bg-purple-100 text-purple-800'
                          : isAdmin
                          ? 'bg-[#e6f4ea] text-[#2e5334]'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isDev ? <Wrench className="w-4 h-4" /> : isAdmin ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-stone-800 truncate flex items-center gap-1.5">
                          <span className="font-mono bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded font-bold">
                            @{p.username}
                          </span>
                          <span className="text-stone-500 font-normal truncate">• {p.full_name}</span>
                        </div>
                        <div className="text-[11px] text-stone-400 truncate mt-0.5">
                          {p.company_name || 'Gallopit'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase whitespace-nowrap ${
                        isDev
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : isAdmin
                          ? 'bg-emerald-50 text-[#2e5334] border border-[#a3c9a8]'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {p.role}
                      </span>
                      <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-stone-400">
          EquiLock IoT • Controlo Rigoroso de Acessos e Isolamento RLS
        </p>

      </div>
    </div>
  );
};
