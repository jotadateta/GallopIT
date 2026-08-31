# GallopIT: Sistema de Cavalariça Inteligente IoT (v1.0 Estável MVP)

> **GallopIT v1.0 - Versão Estável de Lançamento MVP**  
> Repositório oficial contendo o firmware para ESP32, a aplicação Web em React + Vite + Tailwind, o utilitário Python Tester e a documentação completa de campo em LaTeX e Markdown.

---

## 🚀 Visão Geral do Sistema

O **GallopIT v1.0** é uma plataforma IoT completa para gestão inteligente de baias (boxes) em cavalariças modernas. O sistema permite controlo remoto das fechaduras solenoides (pulsos de 4s), agendamento por horário (NTP) ou temporizador sequencial, monitorização de presença e histórico de auditoria em tempo real.

---

## 📁 Estrutura do Repositório

```text
Projeto-GallopIT/
├── README.md                          # Visão geral e guia do projeto GallopIT v1.0 Estável
├── docs/
│   ├── manual_instrucoes.tex          # 📄 Manual Oficial de Instalação e Suporte Telefónico em LaTeX
│   ├── manual_instalacao_cliente_mvp.md # 📘 Guia de Campo para o Técnico & App Mobile MQTT
│   ├── manual_utilizador.md           # Especificações operacionais e lógica do sistema
│   ├── prompt_google_ai_studio.md     # Prompt Mestre para a Web App
│   └── business_plan.md               # Plano de negócios e modelo de subscrição SaaS
├── firmware/
│   ├── platformio.ini                 # Configuração de compilação PlatformIO (ESP32)
│   └── src/
│       ├── config.h                   # Pinos, segredos de auth, Active-LOW e tempos de pulso
│       └── main.cpp                   # Firmware C++ v2.3 / v1.0 Estável (NVS, MQTT 1024B, Latch, AP)
├── web/
│   └── equilock---gestor-de-cavalariças-iot/ # 🌐 Web App React 19 + Vite 6 + Tailwind + WSS MQTT
│       ├── src/                       # Código fonte TypeScript (App.tsx, components/, lib/)
│       ├── package.json               # Dependências da Web App
│       └── supabase_schema_rbac.sql   # Schema de base de dados Supabase com RBAC
├── Python-Tester/
│   ├── README.md                      # Instruções do utilitário de testes CLI
│   └── gallopit_tester.py             # Script interativo Python para monitorização MQTT
└── mqtt/
    └── README.md                      # Especificação e topologia dos tópicos MQTT
```

---

## 🛠️ Especificações Técnicas (v1.0 Estável)

1. **Web App React (Pronta para Cloudflare Pages):**
   * Interface moderna com suporte para controlo manual de baias, re-armamento, agendamentos, timers, simulador embutido e consola de auditoria.
   * Conexão via **WebSocket Seguro (WSS)** ao broker MQTT público de alta disponibilidade (`wss://broker.emqx.io:8084/mqtt`).
   * Validação de PING com timeout de 3,5s (sinaliza automaticamente `ESP32: OFFLINE` quando desligado).

2. **Firmware ESP32:**
   * **Active-LOW Relay Logic:** Previne disparos acidentais das fechaduras solenoides durante o boot.
   * **Estado Latch Permanente (NVS Flash):** Preserva o estado `ARMADA` vs `ABERTA` mesmo em caso de falha de energia.
   * **Captive Portal AP:** Cria a rede `GallopIT-Setup-[MAC]` em `http://192.168.4.1` para configuração manual de Wi-Fi sem necessidade de reprogramação.

---

## 🌩️ Como Fazer Deploy da Web App no Cloudflare Pages

Para colocar o site online no Cloudflare Pages:

1. Acede ao painel do **Cloudflare Dashboard** $\rightarrow$ **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
2. Seleciona o teu repositório GitHub: `jotadateta/GallopIT`.
3. Configura os parâmetros de Build:
   * **Framework preset:** `Vite`
   * **Root directory:** `web/equilock---gestor-de-cavalariças-iot`
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`
4. Clica em **Save and Deploy**. Em 1 minuto o teu site estará online no domínio `.pages.dev` do Cloudflare!

---

## 📡 Tabela Rápida de Tópicos MQTT

Tópico base: `gallopit/{client_id}/{machine_id}/...`

| Ação / Sinal | Tópico | Payload | Função |
| :--- | :--- | :--- | :--- |
| **Abrir Box 1** | `.../box/1/open` | `{}` | Ativa solenoide 1 (4s) e marca `ABERTA`. |
| **Armar Box 1** | `.../box/1/arm` | `{}` | Marca Box 1 como `ARMADA`. |
| **Status Box 1** | `.../box/1/status` | - | Retorna `"ABERTA"` ou `"ARMADA"` (Retained). |
| **PING Teste** | `.../cmd/ping` | `{}` | Responde com `PONG` em `< 20ms`. |
| **Presença** | `.../status/presence` | - | Retorna `"online"` ou `"offline"`. |
| **Estado Total** | `.../status/state` | - | Payload JSON completo de telemetria (1024B). |

---
*GallopIT v1.0 - Plataforma Autónoma de Cavalariças IoT*
