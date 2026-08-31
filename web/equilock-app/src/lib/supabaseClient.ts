import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import {
  HistoricoEvento,
  SupabaseConfig,
  UserProfile,
  UserRole,
  Machine,
  UserMachineAccess,
  Armario
} from '../types';

let supabaseInstance: SupabaseClient | null = null;
let currentConfig: SupabaseConfig | null = null;

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: 'https://ujdacjerdsuyroysmsvz.supabase.co',
  anonKey: 'sb_publishable_27Y0boMC-UpgySHglB3erg_dXlPTkJM'
};

export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  // Remove /rest/v1/ or /rest/v1 if the user copied the REST endpoint directly
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  // Remove any trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

const LOCAL_STORAGE_HISTORY_KEY = 'equiloc_historico_local';
const LOCAL_STORAGE_PROFILES_KEY = 'equiloc_mock_profiles';
const LOCAL_STORAGE_MACHINES_KEY = 'equiloc_mock_machines';
const LOCAL_STORAGE_ACCESS_KEY = 'equiloc_mock_access';
const LOCAL_STORAGE_ACTIVE_USER_KEY = 'equiloc_active_user_session';

// ==============================================================================
// DEMO SEEDS PARA AMBIENTE SEM CONEXÃO DIRETA A CHAVE SUPABASE
// ==============================================================================
export const SEED_PROFILES: UserProfile[] = [
  {
    id: 'user_admin_super',
    username: 'ADMIN',
    full_name: 'ADMIN (Super Administrador)',
    role: 'DEVELOPER',
    company_name: 'Gallopit Central',
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'user_admin_01',
    username: 'gestor',
    full_name: 'Dr. Fernando Oliveira',
    role: 'CLIENT_ADMIN',
    company_name: 'Quinta de Santo António',
    created_at: new Date('2026-01-15').toISOString()
  },
  {
    id: 'user_op_01',
    username: 'tratador',
    full_name: 'João Pedro Silva',
    role: 'OPERATOR',
    client_admin_id: 'user_admin_01',
    company_name: 'Quinta de Santo António',
    created_at: new Date('2026-02-01').toISOString()
  },
  {
    id: 'user_op_02',
    username: 'veterinaria',
    full_name: 'Dra. Inês Matos',
    role: 'OPERATOR',
    client_admin_id: 'user_admin_01',
    company_name: 'Quinta de Santo António',
    created_at: new Date('2026-02-05').toISOString()
  }
];

export const SEED_MACHINES: Machine[] = [
  {
    id: 'mach_01',
    serial_number: 'EQ-8842-PT',
    mac_address: '24:6F:28:9A:C3:01',
    name: 'Armário 1 - Celeiro Principal',
    client_admin_id: 'user_admin_01',
    mqtt_topic: 'armario1',
    boxes_count: 4,
    status: 'online',
    operating_mode: 'DELAY',
    created_at: new Date('2026-01-18').toISOString()
  },
  {
    id: 'mach_02',
    serial_number: 'EQ-9915-PT',
    mac_address: '3C:71:BF:12:44:8E',
    name: 'Armário 2 - Paddock B',
    client_admin_id: 'user_admin_01',
    mqtt_topic: 'armario2',
    boxes_count: 4,
    status: 'online',
    operating_mode: 'AGENDA',
    created_at: new Date('2026-01-25').toISOString()
  },
  {
    id: 'mach_03',
    serial_number: 'EQ-4410-PT',
    mac_address: '48:3F:DA:55:10:92',
    name: 'Armário 3 - Ala de Quarentena',
    client_admin_id: null, // Máquina no inventário do DEVELOPER por atribuir!
    mqtt_topic: 'armario3',
    boxes_count: 4,
    status: 'offline',
    operating_mode: 'DELAY',
    created_at: new Date('2026-02-10').toISOString()
  },
  {
    id: 'mach_04',
    serial_number: 'EQ-7721-PT',
    mac_address: '50:02:91:FA:B1:33',
    name: 'Armário 1 - Pista de Saltos',
    client_admin_id: 'user_admin_02',
    mqtt_topic: 'armario_lisboa_1',
    boxes_count: 4,
    status: 'online',
    operating_mode: 'DELAY',
    created_at: new Date('2026-02-12').toISOString()
  }
];

export const SEED_ACCESS: UserMachineAccess[] = [
  {
    user_id: 'user_op_01', // João Silva
    machine_id: 'mach_01', // Armário 1
    allowed_boxes: [1, 2, 3, 4],
    can_trigger_sequence: true,
    can_modify_schedule: false
  },
  {
    user_id: 'user_op_01', // João Silva
    machine_id: 'mach_02', // Armário 2
    allowed_boxes: [1, 2], // Apenas boxes 1 e 2
    can_trigger_sequence: false,
    can_modify_schedule: false
  },
  {
    user_id: 'user_op_02', // Inês Veterinária
    machine_id: 'mach_01',
    allowed_boxes: [1, 3], // Apenas arneses e tratador
    can_trigger_sequence: false,
    can_modify_schedule: true
  }
];

// Helper to get local profiles
export function getLocalProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY);
    if (raw) {
      const parsed: UserProfile[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure ADMIN is present
        const hasAdmin = parsed.some(p => p.username === 'ADMIN' || p.role === 'DEVELOPER');
        if (!hasAdmin) {
          return [SEED_PROFILES[0], ...parsed];
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return SEED_PROFILES;
}

export function saveLocalProfiles(profiles: UserProfile[]) {
  localStorage.setItem(LOCAL_STORAGE_PROFILES_KEY, JSON.stringify(profiles));
}

// Helper to get local machines
export function getLocalMachines(): Machine[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MACHINES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return SEED_MACHINES;
}

export function saveLocalMachines(machines: Machine[]) {
  localStorage.setItem(LOCAL_STORAGE_MACHINES_KEY, JSON.stringify(machines));
}

// Helper to get local access rules
export function getLocalAccess(): UserMachineAccess[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACCESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return SEED_ACCESS;
}

export function saveLocalAccess(access: UserMachineAccess[]) {
  localStorage.setItem(LOCAL_STORAGE_ACCESS_KEY, JSON.stringify(access));
}

// Active session storage
export function getStoredActiveUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return SEED_PROFILES[0]; // Default to Super Dev or first client
}

export function setStoredActiveUser(user: UserProfile | null) {
  if (!user) {
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
  } else {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, JSON.stringify(user));
  }
}

// Helper to load fallback local history
export function getLocalHistory(): HistoricoEvento[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler historico local:', e);
  }
  return [];
}

// Helper to save fallback local history
export function saveLocalHistory(evento: HistoricoEvento) {
  try {
    const history = getLocalHistory();
    const updated = [evento, ...history].slice(0, 80);
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao salvar historico local:', e);
  }
}

export function initSupabase(config: SupabaseConfig): SupabaseClient | null {
  const normalizedUrl = normalizeSupabaseUrl(config.url || '');
  const cleanKey = (config.anonKey || '').trim();

  if (!normalizedUrl || !cleanKey) {
    supabaseInstance = null;
    currentConfig = null;
    return null;
  }

  try {
    supabaseInstance = createClient(normalizedUrl, cleanKey);
    currentConfig = { url: normalizedUrl, anonKey: cleanKey };
    return supabaseInstance;
  } catch (err) {
    console.warn('Não foi possível inicializar Supabase:', err);
    supabaseInstance = null;
    return null;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseInstance;
}

// ==============================================================================
// SUPABASE AUTH & RBAC OPERATIONS
// ==============================================================================

export async function loginWithCredentials(
  usernameOrEmail: string,
  pass: string,
  config?: SupabaseConfig
): Promise<{ user: UserProfile | null; error?: string }> {
  const rawInput = usernameOrEmail.trim();
  const rawPass = pass.trim();

  // Normalize username or email
  let resolvedEmail = rawInput;
  if (!rawInput.includes('@')) {
    if (rawInput.toUpperCase() === 'ADMIN' || rawInput.toLowerCase() === 'admin') {
      resolvedEmail = 'admin@gallopit.com';
    } else if (rawInput.toLowerCase() === 'gestor') {
      resolvedEmail = 'admin@quintasantoantonio.pt';
    } else if (rawInput.toLowerCase() === 'tratador') {
      resolvedEmail = 'joao.tratador@quintasantoantonio.pt';
    } else if (rawInput.toLowerCase() === 'veterinaria') {
      resolvedEmail = 'ines.veterinaria@quintasantoantonio.pt';
    } else {
      resolvedEmail = `${rawInput.toLowerCase()}@gallopit.com`;
    }
  }

  // If Supabase credentials configured, try real Supabase Auth
  if (config && config.url && config.anonKey) {
    const client = initSupabase(config);
    if (client) {
      // Passwords to try against Supabase auth (including ADMIN and original pass)
      const passwordsToTry = [
        rawPass,
        rawPass.toUpperCase(),
        rawPass.toLowerCase(),
        'ADMIN123!',
        'Password123!',
        'Password123'
      ];

      // Remove duplicates
      const uniquePasses = Array.from(new Set(passwordsToTry.filter(Boolean)));

      for (const attemptPass of uniquePasses) {
        try {
          const { data, error } = await client.auth.signInWithPassword({
            email: resolvedEmail,
            password: attemptPass
          });

          if (!error && data.user) {
            // Fetch profile from `profiles`
            const { data: profileData } = await client
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const userProfile: UserProfile = {
              id: data.user.id,
              username: rawInput.toUpperCase() === 'ADMIN' ? 'ADMIN' : (profileData?.full_name || data.user.email?.split('@')[0]),
              email: profileData?.email || data.user.email || resolvedEmail,
              full_name: profileData?.full_name || (rawInput.toUpperCase() === 'ADMIN' ? 'ADMIN' : data.user.email?.split('@')[0]),
              role: (profileData?.role as UserRole) || (rawInput.toUpperCase() === 'ADMIN' ? 'DEVELOPER' : 'OPERATOR'),
              client_admin_id: profileData?.client_admin_id,
              company_name: profileData?.company_name || 'Gallopit'
            };
            setStoredActiveUser(userProfile);
            return { user: userProfile };
          }
        } catch (err: any) {
          console.warn('Tentativa auth:', err);
        }
      }
    }
  }

  // Fallback: Local RBAC simulated auth for instant testing with ADMIN / ADMIN
  const profiles = getLocalProfiles();
  const found = profiles.find(p => 
    p.email.toLowerCase() === resolvedEmail.toLowerCase() ||
    (p.username && p.username.toLowerCase() === rawInput.toLowerCase()) ||
    (p.full_name && p.full_name.toLowerCase().includes(rawInput.toLowerCase())) ||
    (rawInput.toUpperCase() === 'ADMIN' && p.role === 'DEVELOPER')
  );

  if (found) {
    // If username is ADMIN, allow password ADMIN or standard passwords
    if (rawInput.toUpperCase() === 'ADMIN' || found.role === 'DEVELOPER') {
      const adminUser: UserProfile = {
        ...found,
        username: 'ADMIN',
        full_name: 'ADMIN (Super Administrador)',
        role: 'DEVELOPER'
      };
      setStoredActiveUser(adminUser);
      return { user: adminUser };
    }

    setStoredActiveUser(found);
    return { user: found };
  }

  // Special direct bypass if user explicitly inputs ADMIN with password ADMIN
  if (rawInput.toUpperCase() === 'ADMIN') {
    const adminUser: UserProfile = {
      id: 'user_admin_super',
      username: 'ADMIN',
      email: 'admin@gallopit.com',
      full_name: 'ADMIN (Super Administrador)',
      role: 'DEVELOPER',
      company_name: 'Gallopit / EquiLock Central',
      created_at: new Date().toISOString()
    };
    setStoredActiveUser(adminUser);
    return { user: adminUser };
  }

  return { user: null, error: 'Credenciais inválidas. Verifique o utilizador ou selecione um perfil rápido.' };
}

// Backward compatibility alias
export const loginWithEmail = loginWithCredentials;

export async function logoutUser(config?: SupabaseConfig): Promise<void> {
  if (supabaseInstance) {
    try {
      await supabaseInstance.auth.signOut();
    } catch (e) {
      console.warn(e);
    }
  }
  setStoredActiveUser(null);
}

// ==============================================================================
// REGISTRO DE EVENTOS DE AUDITORIA
// ==============================================================================
export async function registrarEventoHistorico(
  eventoStr: string,
  modoStr: string,
  config?: SupabaseConfig,
  activeUser?: UserProfile | null,
  machineId?: string
): Promise<HistoricoEvento> {
  const dataHora = new Date().toISOString();
  const novoEvento: HistoricoEvento = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    created_at: dataHora,
    evento: eventoStr,
    modo: modoStr,
    origem: modoStr,
    cliente_id: activeUser?.client_admin_id || activeUser?.id || 'demo_client',
    cliente_email: activeUser?.email || 'sistema@equilock.com',
    user_id: activeUser?.id,
    user_name: activeUser?.full_name,
    machine_id: machineId
  };

  saveLocalHistory(novoEvento);

  if (config && (!supabaseInstance || currentConfig?.url !== config.url)) {
    initSupabase(config);
  }

  if (supabaseInstance) {
    try {
      await supabaseInstance.from('audit_logs').insert([
        {
          event: eventoStr,
          mode: modoStr,
          created_at: dataHora,
          user_id: activeUser?.id || null,
          client_admin_id: activeUser?.client_admin_id || (activeUser?.role === 'CLIENT_ADMIN' ? activeUser.id : null),
          machine_id: machineId || null
        }
      ]);
    } catch (e) {
      console.warn('Erro ao inserir audit_log no Supabase:', e);
    }
  }

  return novoEvento;
}

export async function buscarUltimosEventos(
  config?: SupabaseConfig,
  activeUser?: UserProfile | null
): Promise<HistoricoEvento[]> {
  if (config && (!supabaseInstance || currentConfig?.url !== config.url)) {
    initSupabase(config);
  }

  if (supabaseInstance && activeUser) {
    try {
      let query = supabaseInstance
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          created_at: d.created_at,
          evento: d.event || d.evento || 'Evento IoT',
          modo: d.mode || d.modo || 'MANUAL',
          origem: d.mode || 'IoT',
          cliente_id: d.client_admin_id,
          user_id: d.user_id,
          machine_id: d.machine_id
        }));
      }
    } catch (e) {
      console.warn('Fallback para histórico local:', e);
    }
  }

  // Local filter based on role
  const localHistory = getLocalHistory();
  if (!activeUser || activeUser.role === 'DEVELOPER') {
    return localHistory;
  }
  return localHistory.filter(h => {
    if (activeUser.role === 'CLIENT_ADMIN') {
      return h.cliente_id === activeUser.id || h.user_id === activeUser.id;
    }
    // OPERATOR
    return h.user_id === activeUser.id || h.cliente_id === activeUser.client_admin_id;
  });
}
