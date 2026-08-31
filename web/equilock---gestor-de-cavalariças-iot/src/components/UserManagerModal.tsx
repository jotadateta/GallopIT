import React, { useState } from 'react';
import { UserProfile, Machine, UserMachineAccess } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Cpu,
  Key,
  Mail,
  Building2,
  Lock,
  Sliders,
  Calendar,
  X,
  Plus
} from 'lucide-react';

interface UserManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdmin: UserProfile;
  profiles: UserProfile[];
  machines: Machine[];
  accessList: UserMachineAccess[];
  onCreateUser: (newUser: UserProfile, initialAccess: UserMachineAccess[]) => void;
  onUpdateUser: (userId: string, updatedProfile: Partial<UserProfile>) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateAccess: (userId: string, machineId: string, accessData: Partial<UserMachineAccess>) => void;
}

export const UserManagerModal: React.FC<UserManagerModalProps> = ({
  isOpen,
  onClose,
  currentAdmin,
  profiles,
  machines,
  accessList,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onUpdateAccess
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create'>('list');

  // Form State for creating new operator
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [tempPassword, setTempPassword] = useState('123456');
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter machines owned by this client admin
  const adminMachines = machines.filter(
    (m) => m.client_admin_id === currentAdmin.id || currentAdmin.role === 'DEVELOPER'
  );

  // Filter operators belonging to this client admin
  const companyOperators = profiles.filter(
    (p) => p.role === 'OPERATOR' && (p.client_admin_id === currentAdmin.id || currentAdmin.role === 'DEVELOPER')
  );

  if (!isOpen) return null;

  const handleToggleMachineSelection = (machineId: string) => {
    setSelectedMachineIds((prev) =>
      prev.includes(machineId) ? prev.filter((id) => id !== machineId) : [...prev, machineId]
    );
  };

  const handleCreateOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) return;

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    const newUserId = 'user_op_' + Date.now();
    const newProfile: UserProfile = {
      id: newUserId,
      username: cleanUsername,
      email: `${cleanUsername}@gallopit.local`,
      full_name: fullName.trim(),
      role: 'OPERATOR',
      client_admin_id: currentAdmin.id,
      company_name: currentAdmin.company_name || 'Cavalariça',
      created_at: new Date().toISOString()
    };

    // Build initial machine permissions for selected machines (all 4 boxes by default)
    const initialAccess: UserMachineAccess[] = selectedMachineIds.map((machId) => ({
      user_id: newUserId,
      machine_id: machId,
      allowed_boxes: [1, 2, 3, 4],
      can_trigger_sequence: true,
      can_modify_schedule: false
    }));

    onCreateUser(newProfile, initialAccess);

    setFeedback(`Utilizador @${newProfile.username} (${newProfile.full_name}) criado com sucesso!`);
    setFullName('');
    setUsername('');
    setSelectedMachineIds([]);

    setTimeout(() => {
      setFeedback(null);
      setActiveSubTab('list');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white border-t md:border border-stone-200/80 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">

        {/* Mobile Drag Indicator Handle */}
        <div className="w-full pt-3 pb-1 flex justify-center md:hidden">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="p-4 sm:p-6 bg-white border-b border-stone-100 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#2e5334] shrink-0 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base sm:text-xl text-stone-800 font-heading leading-tight truncate">
                Gestão de Utilizadores & Permissões (RBAC)
              </h3>
              <p className="text-xs text-stone-500 font-normal mt-0.5 truncate" title={`${currentAdmin.company_name || 'Cavalariça'} • Controlo de Tratadores e Caixas Permitidas`}>
                {currentAdmin.company_name || 'Cavalariça'} • Controlo de Tratadores e Caixas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors flex items-center justify-center touch-manipulation shrink-0"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 bg-stone-50/50 px-4 sm:px-6 pt-2 space-x-2 text-xs font-semibold overflow-x-auto touch-pan-x scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSubTab('list')}
            className={`min-h-[44px] py-2.5 px-3.5 sm:px-4 rounded-t-xl transition-all flex items-center space-x-2 shrink-0 touch-manipulation ${
              activeSubTab === 'list'
                ? 'bg-white text-stone-800 font-bold border-t border-x border-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-4 h-4 text-[#558b5b]" />
            <span className="whitespace-nowrap">Tratadores ({companyOperators.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('create')}
            className={`min-h-[44px] py-2.5 px-3.5 sm:px-4 rounded-t-xl transition-all flex items-center space-x-2 shrink-0 touch-manipulation ${
              activeSubTab === 'create'
                ? 'bg-white text-stone-800 font-bold border-t border-x border-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-4 h-4 text-[#558b5b]" />
            <span className="whitespace-nowrap">Criar Nova Conta</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs touch-pan-y">

          {feedback && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}

          {/* 1. LIST OPERATORS & PERMISSIONS */}
          {activeSubTab === 'list' && (
            <div className="space-y-4">
              {companyOperators.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-3">
                  <Users className="w-8 h-8 text-stone-400 mx-auto" />
                  <div className="font-bold text-stone-700 text-sm">
                    Nenhum tratador registado nesta conta
                  </div>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Crie contas para os seus tratadores ou veterinários e defina exatamente quais armários e baias cada um pode aceder.
                  </p>
                  <button
                    onClick={() => setActiveSubTab('create')}
                    className="px-4 py-2 bg-[#a3c9a8] hover:bg-[#8fbc8f] text-white font-bold rounded-xl shadow-xs inline-flex items-center space-x-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Adicionar Primeiro Tratador</span>
                  </button>
                </div>
              ) : (
                companyOperators.map((operator) => {
                  const userAccesses = accessList.filter((a) => a.user_id === operator.id);

                  return (
                    <div
                      key={operator.id}
                      className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-white hover:border-[#a3c9a8] transition-all space-y-4 shadow-2xs"
                    >
                      {/* Operator Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-[#e6f4ea] text-[#2e5334] flex items-center justify-center font-bold text-sm shrink-0">
                            {operator.username ? operator.username.charAt(0).toUpperCase() : operator.full_name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-stone-800 text-sm flex flex-wrap items-center gap-1.5">
                              <span className="font-mono bg-stone-100 text-stone-800 px-2 py-0.5 rounded-lg font-bold text-xs">
                                @{operator.username || operator.full_name.toLowerCase().replace(/\s+/g, '_')}
                              </span>
                              <span className="text-stone-600 font-semibold truncate max-w-[180px] sm:max-w-none">• {operator.full_name}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                OPERATOR
                              </span>
                            </div>
                            <div className="text-stone-400 text-xs flex items-center gap-1.5 min-w-0 mt-0.5">
                              <span>Empresa: {operator.company_name || 'Cavalariça'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                          <button
                            onClick={() => onDeleteUser(operator.id)}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center space-x-1 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover</span>
                          </button>
                        </div>
                      </div>

                      {/* Granular Machine Access & Box Checkboxes */}
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-[#558b5b]" />
                          <span>Permissões Granulares por Armário ({adminMachines.length} disponíveis)</span>
                        </div>

                        {adminMachines.length === 0 ? (
                          <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl">
                            A sua conta ainda não possui armários atribuídos pelo Developer.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {adminMachines.map((mach) => {
                              const access = userAccesses.find((a) => a.machine_id === mach.id);
                              const hasAccess = Boolean(access);
                              const allowedBoxes = access?.allowed_boxes || [];

                              const handleToggleMachineAccess = () => {
                                if (hasAccess) {
                                  // Remove access
                                  onUpdateAccess(operator.id, mach.id, { allowed_boxes: [] });
                                } else {
                                  // Grant full access
                                  onUpdateAccess(operator.id, mach.id, {
                                    allowed_boxes: [1, 2, 3, 4],
                                    can_trigger_sequence: true,
                                    can_modify_schedule: false
                                  });
                                }
                              };

                              const handleToggleBox = (boxNum: number) => {
                                let newBoxes: number[];
                                if (allowedBoxes.includes(boxNum)) {
                                  newBoxes = allowedBoxes.filter((b) => b !== boxNum);
                                } else {
                                  newBoxes = [...allowedBoxes, boxNum].sort();
                                }
                                onUpdateAccess(operator.id, mach.id, {
                                  allowed_boxes: newBoxes,
                                  can_trigger_sequence: access?.can_trigger_sequence ?? true,
                                  can_modify_schedule: access?.can_modify_schedule ?? false
                                });
                              };

                              return (
                                <div
                                  key={mach.id}
                                  className={`p-3.5 rounded-2xl border transition-all ${
                                    hasAccess
                                      ? 'bg-stone-50/90 border-[#a3c9a8]'
                                      : 'bg-stone-50/40 border-stone-200 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="font-bold text-stone-800 text-xs truncate" title={mach.name}>
                                      {mach.name}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleToggleMachineAccess}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                                        hasAccess
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                                      }`}
                                    >
                                      {hasAccess ? 'Acesso Permitido' : 'Bloqueado'}
                                    </button>
                                  </div>

                                  {hasAccess && (
                                    <div className="space-y-2 pt-2 border-t border-stone-200/80">
                                      <span className="text-[10px] font-semibold text-stone-500 block">
                                        Baias / Prateleiras Autorizadas:
                                      </span>
                                      <div className="grid grid-cols-4 gap-1">
                                        {[1, 2, 3, 4].map((boxNum) => {
                                          const isBoxAllowed = allowedBoxes.includes(boxNum);
                                          return (
                                            <button
                                              key={boxNum}
                                              type="button"
                                              onClick={() => handleToggleBox(boxNum)}
                                              className={`py-1.5 px-1 rounded-lg font-bold text-xs transition-all text-center ${
                                                isBoxAllowed
                                                  ? 'bg-[#a3c9a8] text-white shadow-2xs'
                                                  : 'bg-white border border-stone-200 text-stone-400 hover:text-stone-700'
                                              }`}
                                            >
                                              Box {boxNum}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. CREATE OPERATOR FORM */}
          {activeSubTab === 'create' && (
            <form onSubmit={handleCreateOperator} className="space-y-4 max-w-xl mx-auto">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-emerald-900 text-xs">
                <strong>Novo Utilizador (OPERATOR):</strong> O funcionário terá credenciais individuais vinculadas à empresa <em>{currentAdmin.company_name || 'Cavalariça'}</em> e só poderá visualizar os armários autorizados abaixo.
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nome Completo do Funcionário / Tratador *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex: João Pedro Silva"
                  className="w-full min-h-[44px] bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-[#a3c9a8] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nome de Utilizador (Username de Login) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-stone-400 font-bold font-mono text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="joao_tratador"
                    className="w-full min-h-[44px] bg-stone-50 border border-stone-200 rounded-xl pl-7 pr-3 py-2 text-stone-800 font-mono text-xs focus:outline-none focus:border-[#a3c9a8] focus:bg-white lowercase"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  O utilizador usará este username para entrar no sistema com a palavra-passe abaixo.
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Palavra-passe
                </label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full min-h-[44px] bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono text-stone-800 focus:outline-none focus:border-[#a3c9a8] focus:bg-white"
                />
              </div>

              {/* Machine Selection Checkbox List */}
              <div className="space-y-2 pt-2">
                <label className="block font-bold text-stone-700">
                  Armários com Acesso Imediato:
                </label>
                {adminMachines.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">
                    Nenhum armário disponível na sua conta.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {adminMachines.map((mach) => {
                      const isSelected = selectedMachineIds.includes(mach.id);
                      return (
                        <div
                          key={mach.id}
                          onClick={() => handleToggleMachineSelection(mach.id)}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-[#e6f4ea] border-[#a3c9a8]'
                              : 'bg-stone-50 border-stone-200'
                          }`}
                        >
                          <div className="font-semibold text-stone-800 text-xs">
                            {mach.name} <span className="font-mono text-stone-500">({mach.serial_number})</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isSelected ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
                          }`}>
                            {isSelected ? 'Autorizado' : 'Não Atribuído'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-[#a3c9a8] hover:bg-[#8fbc8f] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
              >
                <UserPlus className="w-4 h-4" />
                <span>Criar Tratador & Atribuir Permissões</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
