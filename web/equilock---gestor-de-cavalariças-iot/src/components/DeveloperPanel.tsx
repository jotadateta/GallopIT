import React, { useState } from 'react';
import { Machine, UserProfile, DiscoveredDevice } from '../types';
import {
  Cpu,
  Plus,
  Building2,
  CheckCircle,
  AlertCircle,
  Tag,
  Radio,
  Hash,
  Layers,
  Wrench,
  Search,
  Check,
  Edit2,
  Wifi,
  Sparkles,
  Zap,
  KeyRound,
  Send
} from 'lucide-react';

interface DeveloperPanelProps {
  machines: Machine[];
  profiles: UserProfile[];
  discoveredDevices?: DiscoveredDevice[];
  onRegisterMachine: (newMachine: Machine) => void;
  onAssignMachineToClient: (machineId: string, clientAdminId: string | null) => void;
  onProvisionMqtt?: (macAddress: string, clientId: string, machineId: string, secretKey: string) => void;
}

export const DeveloperPanel: React.FC<DeveloperPanelProps> = ({
  machines,
  profiles,
  discoveredDevices = [],
  onRegisterMachine,
  onAssignMachineToClient,
  onProvisionMqtt
}) => {
  // Form State for new physical machine
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [machineName, setMachineName] = useState('');
  const [clientId, setClientId] = useState('cliente_demo');
  const [mqttTopic, setMqttTopic] = useState('');
  const [secretKey, setSecretKey] = useState('GALLOPIT_SECURE_AUTH_KEY_2026');
  const [boxesCount, setBoxesCount] = useState(4);
  const [selectedClientAdminId, setSelectedClientAdminId] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // List of client admins only
  const clientAdmins = profiles.filter((p) => p.role === 'CLIENT_ADMIN');

  const handleSelectDiscoveredDevice = (device: DiscoveredDevice) => {
    const cleanMac = device.mac_address.toUpperCase();
    const macSuffix = cleanMac.replace(/[^A-Z0-9]/g, '').slice(-4);
    const autoSerial = `EQ-${macSuffix}-PT`;
    const autoTopic = `eq_${macSuffix.toLowerCase()}`;

    setMacAddress(cleanMac);
    setSerialNumber(autoSerial);
    setMachineName(`Armário Celeiro ${macSuffix}`);
    setMqttTopic(autoTopic);
  };

  const handleGenerateDefaults = () => {
    const randomSerial = 'EQ-' + Math.floor(1000 + Math.random() * 9000) + '-PT';
    const randomMac = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
    ).join(':');
    const macSuffix = randomMac.replace(/[^A-Z0-9]/g, '').slice(-4);
    const autoTopic = `eq_${macSuffix.toLowerCase()}`;

    setSerialNumber(randomSerial);
    setMacAddress(randomMac);
    setMachineName(`Armário Físico ${randomSerial}`);
    setMqttTopic(autoTopic);
  };

  const handleCreateMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim() || !machineName.trim()) return;

    const cleanMachineId = mqttTopic.trim() || `eq_${serialNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const cleanClientId = clientId.trim() || 'cliente_demo';

    const newMach: Machine = {
      id: cleanMachineId,
      serial_number: serialNumber.trim().toUpperCase(),
      mac_address: macAddress.trim().toUpperCase() || 'AA:BB:CC:11:22:33',
      name: machineName.trim(),
      client_id: cleanClientId,
      client_admin_id: selectedClientAdminId || null,
      mqtt_topic: cleanMachineId,
      boxes_count: boxesCount,
      status: 'online',
      operating_mode: 'DELAY',
      created_at: new Date().toISOString()
    };

    onRegisterMachine(newMach);

    // If provision MQTT is supported, broadcast to gallopit/discovery/provision
    if (onProvisionMqtt && macAddress) {
      onProvisionMqtt(newMach.mac_address || '', cleanClientId, cleanMachineId, secretKey);
    }

    setSuccessMsg(`Máquina ${newMach.serial_number} registada e provisionada com sucesso!`);
    setSerialNumber('');
    setMacAddress('');
    setMachineName('');
    setMqttTopic('');
    setSelectedClientAdminId('');

    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const filteredMachines = machines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.serial_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (m.mac_address && m.mac_address.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-purple-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-purple-900">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/80 border border-purple-700 text-xs font-bold uppercase tracking-wider text-purple-200">
            <Wrench className="w-3.5 h-3.5 text-[#a3c9a8]" />
            <span>Developer Super Admin & Hardware Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading">
            Gestão de Equipamentos GallopIT v2.2 & Provisionamento
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 max-w-2xl">
            Detecte novos ESP32 em tempo real via auto-descoberta MQTT, provisione as credenciais do cliente e associe cada máquina aos perfis de Client Admin.
          </p>
        </div>

        <div className="bg-purple-900/60 border border-purple-800 px-4 py-3 rounded-2xl text-xs space-y-1 shrink-0 w-full md:w-auto">
          <div className="text-purple-300">Total de Máquinas: <strong className="text-white">{machines.length}</strong></div>
          <div className="text-purple-300">Atribuídas: <strong className="text-emerald-400">{machines.filter(m => m.client_admin_id).length}</strong></div>
          <div className="text-purple-300">Em Descoberta: <strong className="text-amber-400">{discoveredDevices.length}</strong></div>
        </div>
      </div>

      {/* 1. Live Discovery Banner (If any unprovisioned devices announce) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-[#558b5b] animate-pulse" />
            <h3 className="font-bold text-stone-800 text-base font-heading">
              Auto-Descoberta de ESP32 na Rede (gallopit/discovery/announcement)
            </h3>
          </div>
          <span className="text-xs font-mono bg-stone-100 text-stone-600 px-3 py-1 rounded-full border border-stone-200">
            {discoveredDevices.length} dispositivo(s) detetado(s)
          </span>
        </div>

        {discoveredDevices.length === 0 ? (
          <div className="p-6 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <Radio className="w-8 h-8 mx-auto text-stone-400 mb-2 opacity-50" />
            <p className="text-xs font-medium text-stone-600">A escutar anúncios MQTT de novos módulos ESP32...</p>
            <p className="text-[11px] text-stone-400 mt-1">Ligue um novo ESP32 à rede ou use o simulador para testar o auto-provisionamento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {discoveredDevices.map((device, idx) => (
              <div
                key={device.mac_address + idx}
                className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 hover:border-[#a3c9a8] transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-stone-800 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-700" />
                    {device.mac_address}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {device.rssi ? `${device.rssi} dBm` : 'Bom'}
                  </span>
                </div>

                <div className="text-[11px] text-stone-500 space-y-0.5">
                  <div>Firmware: <span className="font-mono text-stone-700">{device.firmware || '2.2.0-ESP32'}</span></div>
                  <div>IP Local: <span className="font-mono text-stone-700">{device.ip || '192.168.1.100'}</span></div>
                  <div>Visto às: <span className="text-stone-700">{device.discovered_at}</span></div>
                </div>

                <button
                  onClick={() => handleSelectDiscoveredDevice(device)}
                  className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 active:scale-95 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Provisionar Dispositivo</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Form on Left, Catalog on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 2. Register / Provisioning Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-stone-800 text-base font-heading">
                Registo e Provisionamento
              </h3>
            </div>
            <button
              type="button"
              onClick={handleGenerateDefaults}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-xl transition-colors"
            >
              Gerar Aleatório
            </button>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateMachine} className="space-y-4">
            
            {/* MAC Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-stone-400" />
                <span>MAC Address do ESP32</span>
              </label>
              <input
                type="text"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="Ex: 88:57:21:78:EF:3C"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            {/* Serial Number & Friendly Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-stone-400" />
                  <span>Nº de Série *</span>
                </label>
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Ex: EQ-9042-PT"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-stone-400" />
                  <span>ID Máquina (MQTT) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={mqttTopic}
                  onChange={(e) => setMqttTopic(e.target.value)}
                  placeholder="Ex: eq_demo_01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            </div>

            {/* Friendly Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                <span>Nome Descritivo *</span>
              </label>
              <input
                type="text"
                required
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                placeholder="Ex: Armário 1 - Celeiro Principal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-medium"
              />
            </div>

            {/* Client ID & Secret Key */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>Client ID</span>
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Ex: cliente_demo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                  <span>Secret Key</span>
                </label>
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            </div>

            {/* Assign to Client Admin */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                <span>Atribuir a Administrador do Cliente</span>
              </label>
              <select
                value={selectedClientAdminId}
                onChange={(e) => setSelectedClientAdminId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
              >
                <option value="">Manter no Inventário Geral (Sem Dono)</option>
                {clientAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    @{admin.username} ({admin.company_name || admin.full_name})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center space-x-2 active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Registar Máquina e Transmitir Provisionamento</span>
            </button>
          </form>
        </div>

        {/* 3. Catalog / Machines List (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-purple-700" />
              <h3 className="font-bold text-stone-800 text-base font-heading">
                Máquinas Registadas ({filteredMachines.length})
              </h3>
            </div>

            {/* Search Filter */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Pesquisar máquina / serial..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {filteredMachines.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              Nenhuma máquina encontrada com os critérios pesquisados.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredMachines.map((m) => {
                const assignedAdmin = profiles.find((p) => p.id === m.client_admin_id);

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl border border-stone-200/90 hover:border-purple-300 transition-all bg-stone-50/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs bg-purple-100 text-purple-900 px-2 py-0.5 rounded">
                            {m.serial_number}
                          </span>
                          <h4 className="font-bold text-stone-800 text-sm">
                            {m.name}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-stone-500 font-mono">
                          <span>MAC: {m.mac_address || 'N/A'}</span>
                          <span>•</span>
                          <span>Tópico: gallopit/{m.client_id || 'cliente_demo'}/{m.mqtt_topic}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Online
                        </span>
                      </div>
                    </div>

                    {/* Assignment Selector */}
                    <div className="pt-2 border-t border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-1.5 text-stone-600">
                        <Building2 className="w-3.5 h-3.5 text-stone-400" />
                        <span>Proprietário / Haras:</span>
                      </div>

                      <select
                        value={m.client_admin_id || ''}
                        onChange={(e) => onAssignMachineToClient(m.id, e.target.value || null)}
                        className="px-3 py-1 rounded-xl border border-stone-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-stone-800"
                      >
                        <option value="">Livre (Sem Dono / Armazém)</option>
                        {clientAdmins.map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            @{admin.username} ({admin.company_name || admin.full_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
