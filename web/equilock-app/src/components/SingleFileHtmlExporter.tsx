import React, { useState } from 'react';
import { MqttConfig, SupabaseConfig, OperatingMode } from '../types';
import { Code, Copy, Check, Download, ExternalLink, FileCode } from 'lucide-react';

interface SingleFileHtmlExporterProps {
  mqttConfig: MqttConfig;
  supabaseConfig: SupabaseConfig;
  modoAtual: OperatingMode;
}

export const SingleFileHtmlExporter: React.FC<SingleFileHtmlExporterProps> = ({
  mqttConfig,
  supabaseConfig,
  modoAtual
}) => {
  const [copiado, setCopiado] = useState(false);

  // Generate the full single-file index.html code template as requested in the prompt
  const generateSingleFileHtml = (): string => {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GallopIT - Cavalariça Inteligente</title>
  
  <!-- Google Font: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    body {
      background-color: #FFFFFF;
      color: #4B5563;
      padding: 2rem;
      max-w: 1200px;
      margin: 0 auto;
      min-height: 100vh;
    }

    /* HEADER FIXO & NAVEGAÇÃO */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #F3F4F6;
      margin-bottom: 2.5rem;
      position: relative;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #374151;
      letter-spacing: -0.025em;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      background-color: #E6F4EA;
      color: #2E5334;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #558B5B;
    }

    .hamburger-btn {
      background: #F9FAFB;
      border: 1px solid #F3F4F6;
      border-radius: 12px;
      padding: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .hamburger-btn:hover {
      background: #F3F4F6;
    }

    .hamburger-btn svg {
      width: 20px;
      height: 20px;
      stroke: #374151;
    }

    /* MENU DROPDOWN */
    .menu-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: #FFFFFF;
      border: 1px solid #F3F4F6;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
      padding: 8px;
      width: 240px;
      z-index: 50;
      display: none;
      flex-direction: column;
      gap: 4px;
    }

    .menu-dropdown.active {
      display: flex;
    }

    .menu-item {
      padding: 10px 14px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: #4B5563;
      font-size: 0.875rem;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .menu-item:hover, .menu-item.active {
      background: #E6F4EA;
      color: #2E5334;
      font-weight: 600;
    }

    /* CONTEÚDO DAS ABAS */
    .tab-content {
      display: none;
      animation: fadeIn 0.25s ease-in-out;
    }

    .tab-content.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* CARDS & GRELHA (ABA 1: CONTROLO MANUAL) */
    .grid-boxes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
    }

    .card {
      background: #FFFFFF;
      border: 1px solid #F3F4F6;
      border-radius: 16px;
      padding: 1.75rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 20px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
    }

    .btn-abrir {
      width: 100%;
      padding: 12px 16px;
      background-color: #A3C9A8;
      color: #FFFFFF;
      border: none;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.1s ease;
    }

    .btn-abrir:hover {
      background-color: #8FBC8F;
    }

    .btn-abrir:active {
      transform: scale(0.98);
    }

    /* SEQUÊNCIA AUTOMÁTICA (ABA 2) */
    .card-center {
      max-width: 500px;
      margin: 0 auto;
    }

    .input-line {
      width: 100%;
      padding: 12px 0;
      border: none;
      border-bottom: 2px solid #E5E7EB;
      font-size: 1.25rem;
      color: #374151;
      outline: none;
      margin: 1rem 0 2rem 0;
      transition: border-color 0.2s ease;
    }

    .input-line:focus {
      border-bottom-color: #A3C9A8;
    }

    /* AGENDAMENTO (ABA 3) */
    .schedule-list {
      display: flex;
      flex-direction: column;
    }

    .schedule-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 0;
      border-bottom: 1px solid #F3F4F6;
    }

    .schedule-item:last-child {
      border-bottom: none;
    }

    .time-input {
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 0.875rem;
      color: #374151;
      outline: none;
    }

    /* HISTÓRICO & SISTEMA (ABA 4) */
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-mb: 2rem;
    }

    .history-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      background: #F9FAFB;
      border-radius: 12px;
      font-size: 0.875rem;
    }

    /* TOGGLE SWITCH CSS */
    .toggle-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #F3F4F6;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #E5E7EB;
      transition: .3s;
      border-radius: 34px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #A3C9A8;
    }

    input:checked + .slider:before {
      transform: translateX(22px);
    }
  </style>
</head>
<body>

  <!-- HEADER FIXO & MENU -->
  <header>
    <div class="brand">
      <h1>GallopIT</h1>
      <div class="status-badge">
        <span class="status-dot"></span>
        <span>Sistema Online</span>
      </div>
    </div>

    <!-- HAMBURGER MENU BUTTON -->
    <button class="hamburger-btn" id="hamburgerBtn" aria-label="Abrir Menu">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>

    <!-- MENU DROPDOWN -->
    <div class="menu-dropdown" id="menuDropdown">
      <button class="menu-item active" onclick="switchTab('manual')">Controlo Manual</button>
      <button class="menu-item" onclick="switchTab('sequence')">Sequência Diária</button>
      <button class="menu-item" onclick="switchTab('schedule')">Agendamento</button>
      <button class="menu-item" onclick="switchTab('history')">Histórico & Sistema</button>
    </div>
  </header>

  <!-- ABA 1: CONTROLO MANUAL (VISÃO DE ARMÁRIO COM 4 PRATELEIRAS) -->
  <section id="tab-manual" class="tab-content active">
    <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.02);">
      
      <!-- Cabeçalho do Armário -->
      <div style="background: linear-gradient(to right, #292524, #44403c); color: #FFFFFF; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background-color: #A3C9A8;"></span>
          <span style="font-weight: 700; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Armário Inteligente GallopIT</span>
        </div>
        <span style="font-size: 0.75rem; color: #D1E6D3; font-family: monospace;">4 Prateleiras • Solenoide 12V</span>
      </div>

      <!-- Estrutura Interior das 4 Prateleiras -->
      <div style="padding: 24px; background-color: #FAFAFA; display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Prateleira 1 -->
        <div>
          <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 56px; height: 56px; border-radius: 12px; background: #E6F4EA; border: 1px solid #D1E6D3; display: flex; align-items: center; justify-content: center; color: #2E5334;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <div>
                <span style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; background: #F3F4F6; padding: 2px 8px; border-radius: 4px; color: #6B7280;">Prateleira 01</span>
                <h3 style="font-size: 1.125rem; font-weight: 700; color: #1F2937; margin-top: 2px;">Box 1 - Rações & Suplementos</h3>
                <span style="font-size: 0.75rem; color: #9CA3AF;">Fechadura Solenoide Trancada</span>
              </div>
            </div>
            <button class="btn-abrir" style="width: auto; padding: 10px 24px;" onclick="alert('Prateleira 1 / Box 1 Aberta!')">Abrir Prateleira 1</button>
          </div>
          <div style="height: 10px; background: linear-gradient(to right, #D6D3D1, #E7E5E4, #D6D3D1); border-radius: 0 0 6px 6px; margin-top: 2px; border-top: 1px solid #D6D3D1;"></div>
        </div>

        <!-- Prateleira 2 -->
        <div>
          <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 56px; height: 56px; border-radius: 12px; background: #E6F4EA; border: 1px solid #D1E6D3; display: flex; align-items: center; justify-content: center; color: #2E5334;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <div>
                <span style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; background: #F3F4F6; padding: 2px 8px; border-radius: 4px; color: #6B7280;">Prateleira 02</span>
                <h3 style="font-size: 1.125rem; font-weight: 700; color: #1F2937; margin-top: 2px;">Box 2 - Medicamentos & Cuidados</h3>
                <span style="font-size: 0.75rem; color: #9CA3AF;">Fechadura Solenoide Trancada</span>
              </div>
            </div>
            <button class="btn-abrir" style="width: auto; padding: 10px 24px;" onclick="alert('Prateleira 2 / Box 2 Aberta!')">Abrir Prateleira 2</button>
          </div>
          <div style="height: 10px; background: linear-gradient(to right, #D6D3D1, #E7E5E4, #D6D3D1); border-radius: 0 0 6px 6px; margin-top: 2px; border-top: 1px solid #D6D3D1;"></div>
        </div>

        <!-- Prateleira 3 -->
        <div>
          <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 56px; height: 56px; border-radius: 12px; background: #E6F4EA; border: 1px solid #D1E6D3; display: flex; align-items: center; justify-content: center; color: #2E5334;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <div>
                <span style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; background: #F3F4F6; padding: 2px 8px; border-radius: 4px; color: #6B7280;">Prateleira 03</span>
                <h3 style="font-size: 1.125rem; font-weight: 700; color: #1F2937; margin-top: 2px;">Box 3 - Sela & Equipamentos</h3>
                <span style="font-size: 0.75rem; color: #9CA3AF;">Fechadura Solenoide Trancada</span>
              </div>
            </div>
            <button class="btn-abrir" style="width: auto; padding: 10px 24px;" onclick="alert('Prateleira 3 / Box 3 Aberta!')">Abrir Prateleira 3</button>
          </div>
          <div style="height: 10px; background: linear-gradient(to right, #D6D3D1, #E7E5E4, #D6D3D1); border-radius: 0 0 6px 6px; margin-top: 2px; border-top: 1px solid #D6D3D1;"></div>
        </div>

        <!-- Prateleira 4 -->
        <div>
          <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 56px; height: 56px; border-radius: 12px; background: #E6F4EA; border: 1px solid #D1E6D3; display: flex; align-items: center; justify-content: center; color: #2E5334;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <div>
                <span style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; background: #F3F4F6; padding: 2px 8px; border-radius: 4px; color: #6B7280;">Prateleira 04</span>
                <h3 style="font-size: 1.125rem; font-weight: 700; color: #1F2937; margin-top: 2px;">Box 4 - Acessórios & Mantas</h3>
                <span style="font-size: 0.75rem; color: #9CA3AF;">Fechadura Solenoide Trancada</span>
              </div>
            </div>
            <button class="btn-abrir" style="width: auto; padding: 10px 24px;" onclick="alert('Prateleira 4 / Box 4 Aberta!')">Abrir Prateleira 4</button>
          </div>
          <div style="height: 10px; background: linear-gradient(to right, #D6D3D1, #E7E5E4, #D6D3D1); border-radius: 0 0 6px 6px; margin-top: 2px; border-top: 1px solid #D6D3D1;"></div>
        </div>

      </div>
    </div>
  </section>

  <!-- ABA 2: SEQUÊNCIA DIÁRIA -->
  <section id="tab-sequence" class="tab-content">
    <div class="card card-center">
      <h2 style="font-size: 1.25rem; font-weight: 600; color: #374151;">Sequência Automática</h2>
      <p style="font-size: 0.875rem; color: #9CA3AF; margin-top: 4px;">Defina o intervalo entre destravamentos</p>
      
      <input type="number" class="input-line" placeholder="Intervalo (min)" value="5">
      
      <button class="btn-abrir" onclick="alert('Sequência iniciada!')">Iniciar Sequência</button>
    </div>
  </section>

  <!-- ABA 3: AGENDAMENTO -->
  <section id="tab-schedule" class="tab-content">
    <div class="card">
      <div class="schedule-list">
        <div class="schedule-item">
          <span style="font-weight: 500;">Box 1</span>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="time" class="time-input" value="08:00">
            <button class="btn-abrir" style="width: auto; padding: 6px 16px;" onclick="alert('Horário atualizado!')">Atualizar</button>
          </div>
        </div>

        <div class="schedule-item">
          <span style="font-weight: 500;">Box 2</span>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="time" class="time-input" value="08:30">
            <button class="btn-abrir" style="width: auto; padding: 6px 16px;" onclick="alert('Horário atualizado!')">Atualizar</button>
          </div>
        </div>

        <div class="schedule-item">
          <span style="font-weight: 500;">Box 3</span>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="time" class="time-input" value="09:00">
            <button class="btn-abrir" style="width: auto; padding: 6px 16px;" onclick="alert('Horário atualizado!')">Atualizar</button>
          </div>
        </div>

        <div class="schedule-item">
          <span style="font-weight: 500;">Box 4</span>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="time" class="time-input" value="09:30">
            <button class="btn-abrir" style="width: auto; padding: 6px 16px;" onclick="alert('Horário atualizado!')">Atualizar</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ABA 4: HISTÓRICO & SISTEMA -->
  <section id="tab-history" class="tab-content">
    <div class="card">
      <h2 style="font-size: 1.125rem; font-weight: 600; color: #374151; margin-bottom: 1rem;">Histórico Recente</h2>
      
      <div class="history-list">
        <div class="history-item">
          <span>08:00 - Box 1 Aberta</span>
          <span style="color: #9CA3AF;">Automático</span>
        </div>
        <div class="history-item">
          <span>08:30 - Box 2 Aberta</span>
          <span style="color: #9CA3AF;">Automático</span>
        </div>
        <div class="history-item">
          <span>07:15 - Box 3 Aberta</span>
          <span style="color: #9CA3AF;">Manual</span>
        </div>
      </div>

      <div class="toggle-container">
        <span style="font-weight: 500; font-size: 0.875rem;">Alternar Modo (Delay / Agenda)</span>
        <label class="switch">
          <input type="checkbox" checked>
          <span class="slider"></span>
        </label>
      </div>
    </div>
  </section>

  <!-- LÓGICA DE UI (JAVASCRIPT) -->
  <script>
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const menuDropdown = document.getElementById('menuDropdown');

    // Toggle menu dropdown
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
      menuDropdown.classList.remove('active');
    });

    // Switch active tabs
    function switchTab(tabId) {
      // Hide all tabs
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });

      // Show target tab
      const targetTab = document.getElementById('tab-' + tabId);
      if (targetTab) {
        targetTab.classList.add('active');
      }

      // Update menu items active class
      document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
      });
      event.currentTarget.classList.add('active');

      // Close dropdown
      menuDropdown.classList.remove('active');
    }
  </script>
</body>
</html>`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateSingleFileHtml());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleDownloadFile = () => {
    const code = generateSingleFileHtml();
    const blob = new Blob([code], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'index.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-stone-800">
          <FileCode className="w-5 h-5 text-[#558b5b]" />
          <h4 className="font-bold text-sm font-heading">Exportar Código `index.html` Único</h4>
        </div>
        <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 font-semibold">
          Single File SPA
        </span>
      </div>

      <p className="text-xs text-stone-600">
        Compila toda a interface, MQTT.js, Supabase-js e estilos em um arquivo <code className="text-emerald-700 bg-stone-200/60 px-1 py-0.5 rounded font-mono text-[11px]">index.html</code> independente, pronto para deploy no <strong>GitHub Pages</strong> ou servidor local.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          onClick={handleCopyCode}
          className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-700 font-medium text-xs flex items-center justify-center space-x-2 border border-stone-200 shadow-xs transition-all active:scale-95"
        >
          {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copiado ? 'Código Copiado!' : 'Copiar HTML Completo'}</span>
        </button>

        <button
          onClick={handleDownloadFile}
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#a3c9a8] hover:bg-[#8fbc8f] text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Baixar `index.html`</span>
        </button>
      </div>
    </div>
  );
};
