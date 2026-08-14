# GallopIT: Sistema de Cavalariça Inteligente IoT (v2.2)

Este repositório contém a documentação técnica, especificações, o firmware completo e os utilitários de teste para o **GallopIT**, um sistema inteligente e automatizado para gestão de baias (boxes) em cavalariças modernas.

O GallopIT combina hardware IoT de alta fiabilidade (ESP32 com relés Active-LOW de 4 segundos e proteção contra brownout) com um protocolo MQTT multi-tenant seguro e uma especificação completa para interfaces web modernas.

---

## 📁 Estrutura do Repositório

```text
Projeto-GallopIT/
├── README.md                      # Visão geral e guia do projeto GallopIT v2.2
├── docs/
│   ├── manual_utilizador.md       # Manual técnico e especificações operacionais v2.2
│   ├── prompt_google_ai_studio.md # Prompt Mestre para geração da Web App no Google AI Studio
│   └── business_plan.md           # Plano de negócios e modelo de subscrição SaaS
├── firmware/
│   ├── platformio.ini             # Configuração de compilação PlatformIO (ArduinoJson v7)
│   └── src/
│       ├── config.h               # Pinos, segredos de setup, Active-LOW e tempos de pulso
│       └── main.cpp               # Firmware C++ completo (NVS, MQTT 1024B, Latch, LWT)
├── Python-Tester/
│   ├── README.md                  # Instruções de utilização do utilitário de teste
│   └── gallopit_tester.py         # Script interativo Python para monitorização e validação de hardware
└── mqtt/
    └── README.md                  # Especificação e definições do broker MQTT
```

---

## 🛠️ Funcionalidades Principais (v2.2)

1. **Estado Lógico Latch (ARMADA vs ABERTA):**
   * Quando uma box é acionada (4 segundos de relé), o hardware marca o estado como **`ABERTA`** e guarda essa informação na memória flash permanente (**NVS Flash**).
   * O estado permanece **`ABERTA`** (mesmo se a placa for desligada) até que o utilizador/tratador feche a baia e envie o comando de **Armar** (`cmd/arm`).

2. **Proteção Eletrónica & Hardware:**
   * **Active-LOW Relay Control:** Garante que os relés permanecem completamente desligados durante o boot e arranque do microcontrolador.
   * **Brownout Detector Suppression:** Impede resets pânico causados por quedas temporárias de voltagem ao inicializar a antena Wi-Fi.
   * **Pulso Seguro de 4 Segundos:** Desativa a corrente das bobinas solenoides automaticamente ao fim de 4s para evitar aquecimento.

3. **Setup Inicial Seguro & Autenticação:**
   * Provisionamento fabril via tópico `gallopit/setup/{MAC_ADDRESS}/config` autenticado por `secret_key` (`GALLOPIT_SECURE_AUTH_KEY_2026`).

4. **Verificação de Conexão (PING / Heartbeat):**
   * Resposta instantânea ao comando `cmd/ping` com retenção de presença (`online` / `offline`).

---

## 📡 Referência Rápida do Protocolo MQTT

Tópico base: `gallopit/{client_id}/{machine_id}/{direcao}/{acao}`

| Tipo | Tópico | Payload | Função |
| :--- | :--- | :--- | :--- |
| **Cmd** | `.../cmd/open` | `{"box": 1}` ou `{"box": "all"}` | Dispara solenoide 4s + marca `ABERTA`. |
| **Cmd** | `.../cmd/arm` | `{"box": 1}` ou `{"box": "all"}` | Re-arma a prateleira + marca `ARMADA`. |
| **Cmd** | `.../cmd/ping` | `{}` | Testa ligação e obtém resposta `PONG`. |
| **Cmd** | `.../cmd/status_get` | `{}` | Solicita estado completo em `status/state`. |
| **Status** | `.../status/presence` | `"online"` / `"offline"` | Presença LWT (Retained). |
| **Status** | `.../status/state` | JSON Completo (Retained) | Lista das 4 boxes, RSSI, modo e status `ARMADA`/`ABERTA`. |

---

## 🚀 Como Iniciar

### 1. Gravar o Firmware na ESP32
Carregar o código contido em `firmware/` utilizando o **PlatformIO** (VS Code).

### 2. Validar o Hardware com o Python-Tester
No terminal, execute:
```bash
cd Python-Tester
python gallopit_tester.py
```
Use o menu numérico para testar o setup seguro, a abertura individual das 4 boxes, o armamento e o PING.

### 3. Criar a Web App no Google AI Studio
Copie o conteúdo de [`docs/prompt_google_ai_studio.md`](docs/prompt_google_ai_studio.md) para o Google AI Studio para gerar a interface gráfica completa.
