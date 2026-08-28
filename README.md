# GallopIT: Sistema de Cavalariça Inteligente IoT (v2.3 MVP)

Este repositório contém a documentação técnica, especificações, o firmware completo e o manual de instalação para o **GallopIT**, um sistema inteligente e automatizado para gestão de baias (boxes) em cavalariças modernas.

O GallopIT combina hardware IoT de alta fiabilidade (ESP32 com relés Active-LOW de 4 segundos e proteção contra brownout) com um protocolo MQTT multi-tenant seguro e suporte direto para **Aplicações Mobile MQTT** (ex: *IoT MQTT Panel*, *MQTT Dash*, *MyMQTT*).

---

## 📁 Estrutura do Repositório

```text
Projeto-GallopIT/
├── README.md                          # Visão geral e guia do projeto GallopIT v2.3
├── docs/
│   ├── manual_instalacao_cliente_mvp.md # 📘 Guia Completo de Instalação no Cliente & App Mobile MVP
│   ├── manual_utilizador.md           # Manual técnico e especificações operacionais v2.3
│   ├── prompt_google_ai_studio.md     # Prompt Mestre para geração da Web App no Google AI Studio
│   └── business_plan.md               # Plano de negócios e modelo de subscrição SaaS
├── firmware/
│   ├── platformio.ini                 # Configuração de compilação PlatformIO (ArduinoJson v7)
│   └── src/
│       ├── config.h                   # Pinos, segredos de setup, Active-LOW e tempos de pulso
│       └── main.cpp                   # Firmware C++ v2.3 (NVS, MQTT 1024B, Tópicos Diretos, Latch)
├── Python-Tester/
│   ├── README.md                      # Instruções de utilização do utilitário de teste
│   └── gallopit_tester.py             # Script interativo Python para monitorização e validação
└── mqtt/
    └── README.md                      # Especificação e definições do broker MQTT
```

---

## 🛠️ Funcionalidades Principais (v2.3 MVP)

1. **Atalhos para Apps Mobile MQTT (Sem necessidade de Website):**
   * Tópicos simplificados de atalho (`/box/1/open`, `/box/1/arm`, `/box/1/status`) que permitem configurar botões na app do cliente (iOS/Android) em **30 segundos**!

2. **Estado Lógico Latch (ARMADA vs ABERTA):**
   * Quando uma box é acionada (4 segundos de relé), o hardware marca o estado como **`ABERTA`** e guarda na memória flash permanente (**NVS Flash**).
   * O estado permanece **`ABERTA`** (mesmo se houver corte de energia) até que o tratador feche a baia e clique em **"Armar Box"** (`/arm`).

3. **Proteção Eletrónica & Hardware:**
   * **Active-LOW Relay Control:** Relés permanecem completamente desligados durante o boot e arranque do microcontrolador.
   * **Brownout Suppression:** Previne resets por picos elétricos ao ligar o Wi-Fi.
   * **Pulso Seguro de 4s:** Corta a corrente das bobinas solenoides automaticamente.

4. **Setup Wi-Fi Cativo (Captive Portal):**
   * Ponto de Acesso `GallopIT-Setup-XXXX` ativado automaticamente quando sem Wi-Fi, com formulário web em `http://192.168.4.1` para configurar Wi-Fi e IDs no local.

---

## 📡 Referência Rápida dos Tópicos MQTT para Apps Mobile

Tópico base: `gallopit/{client_id}/{machine_id}/...`

| Ação | Tópico | Payload | Função |
| :--- | :--- | :--- | :--- |
| **Abrir Box 1** | `.../box/1/open` | `{}` | Dispara solenoide 1 por 4s + marca `ABERTA`. |
| **Armar Box 1** | `.../box/1/arm` | `{}` | Marca Box 1 como `ARMADA`. |
| **Status Box 1** | `.../box/1/status` | - | Retorna `"ABERTA"` ou `"ARMADA"` (Retained). |
| **Abrir Todas** | `.../box/all/open` | `{}` | Dispara as 4 boxes em cadeia. |
| **Armar Todas** | `.../box/all/arm` | `{}` | Marca todas as 4 boxes como `ARMADA`. |
| **Presença** | `.../status/presence` | - | Retorna `"online"` ou `"offline"` (Retained). |

---

## 🚀 Como Iniciar no Cliente

1. **Gravar Firmware:** Carregar o código `firmware/` na ESP32 via PlatformIO.
2. **Instalação no Local:** Seguir o [Guia Completo de Instalação no Cliente](docs/manual_instalacao_cliente_mvp.md).
3. **App Mobile:** Configurar os botões na app **IoT MQTT Panel** no smartphone do cliente usando os tópicos acima.
