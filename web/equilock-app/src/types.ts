export type ConnectionStatus = 'disconnected' | 'connecting' | 'online' | 'offline';

export type OperatingMode = 'DELAY' | 'AGENDA';

export type UserRole = 'DEVELOPER' | 'CLIENT_ADMIN' | 'OPERATOR';

export type BoxLogicalStatus = 'ABERTA' | 'ARMADA';

export interface UserProfile {
  id: string; // auth.users UUID
  username: string; // Primary login username e.g. "ADMIN", "gestor", "tratador"
  full_name: string;
  email?: string; // Internal email compatibility
  role: UserRole;
  client_admin_id?: string | null; // references parent CLIENT_ADMIN profile if OPERATOR
  company_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Machine {
  id: string; // UUID or string id e.g. "eq_demo_01"
  serial_number: string; // e.g. "EQ-9042-PT"
  mac_address?: string; // e.g. "88:57:21:78:EF:3C"
  name: string; // e.g. "Armário 1 - Celeiro Principal"
  client_admin_id?: string | null; // UUID of assigned client admin
  client_id?: string; // e.g. "cliente_demo"
  mqtt_topic: string; // e.g. "eq_demo_01" or "armario_01"
  boxes_count: number; // default 4
  status: 'online' | 'offline' | 'maintenance';
  operating_mode: OperatingMode;
  intervalo_minutos?: number;
  wifi_rssi?: number;
  firmware?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserMachineAccess {
  id?: string;
  user_id: string; // OPERATOR profile UUID
  machine_id: string; // Machine UUID
  allowed_boxes: number[]; // e.g. [1, 2, 3, 4]
  can_trigger_sequence: boolean;
  can_modify_schedule: boolean;
  created_at?: string;
}

export interface BaiaState {
  id: number; // 1 to 4
  nome: string; // e.g. "Box 1 - Baia Principal"
  status: BoxLogicalStatus; // 'ABERTA' | 'ARMADA'
  rele_ativo: boolean; // true during 4s solenoid trigger
  tempoRestantePulse?: number; // visual countdown in seconds (4, 3, 2, 1)
  hora?: number; // 0..23 or -1
  minuto?: number; // 0..59 or -1
  ativo?: boolean; // schedule active
  trancaAberta: boolean; // boolean for legacy compatibility
  pulsando: boolean; // boolean for legacy compatibility
  agendaHora: string; // e.g. "07:30"
  ultimaAbertura?: string; // timestamp string
}

export interface Armario {
  id: string; // unique identifier e.g. "eq_demo_01"
  nome: string; // e.g. "Armário 1 - Celeiro Principal"
  client_id?: string; // e.g. "cliente_demo"
  topicoMqtt: string; // e.g. "eq_demo_01"
  mac_address?: string;
  serial_number?: string;
  client_admin_id?: string | null;
  status?: 'online' | 'offline' | 'maintenance';
  operating_mode?: OperatingMode;
  intervalo_minutos?: number;
  wifi_rssi?: number;
  firmware?: string;
  last_ping_latency_ms?: number;
  baias: BaiaState[];
}

export interface Esp32BoxTelemetry {
  box: number;
  hora: number;
  minuto: number;
  ativo: boolean;
  rele_ativo: boolean;
  status: BoxLogicalStatus;
}

export interface Esp32FullStatePayload {
  system?: string; // "gallopit"
  client_id: string;
  machine_id: string;
  mac_address?: string;
  provisioned?: boolean;
  modo_ativo: OperatingMode;
  intervalo_minutos: number;
  firmware?: string;
  wifi_rssi?: number;
  boxes: Esp32BoxTelemetry[];
}

export interface DiscoveredDevice {
  mac_address: string;
  firmware?: string;
  rssi?: number;
  ip?: string;
  uptime_sec?: number;
  discovered_at: string;
}

export interface AgendaConfig {
  baia: number;
  hora: string;
}

export interface DelayConfig {
  minutos: number;
}

export interface ClientAccount {
  id: string; // e.g. "cliente_demo"
  nomeCliente: string; // e.g. "Quinta Santo António"
  email: string;
  topicPrefix: string; // e.g. "gallopit/cliente_demo"
  dataCriacao?: string;
}

export interface HistoricoEvento {
  id?: string;
  created_at: string;
  evento: string; // e.g. "Box 1 Aberta (Solenoide 4s)"
  modo: string; // e.g. "MANUAL", "DELAY", "AGENDA", "ARMAR"
  origem?: string;
  detalhes?: string;
  cliente_id?: string;
  cliente_email?: string;
  user_id?: string;
  user_name?: string;
  machine_id?: string;
}

export interface MqttConfig {
  brokerUrl: string; // Default: "wss://broker.emqx.io:8084/mqtt"
  username?: string;
  password?: string;
  clientId: string;
  topicPrefix: string; // "gallopit"
}

export interface SupabaseConfig {
  url: string; // e.g. "https://xyz.supabase.co"
  anonKey: string;
}

export interface ToastMessage {
  id: string;
  tipo: 'sucesso' | 'erro' | 'info' | 'alerta';
  mensagem: string;
  dataHora: string;
}

