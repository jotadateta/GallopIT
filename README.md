# GallopIT: Sistema de Cavalariça Inteligente IoT

Este repositório contém a documentação técnica, especificações e o código fonte para o **GallopIT**, um sistema inteligente e automatizado para gestão de baias (boxes) em cavalariças modernas.

O GallopIT combina hardware IoT de alta fiabilidade (ESP32) com um painel de controlo web minimalista, robusto, responsivo e escalável.

---

## 📁 Estrutura do Repositório

```text
Projeto-GallopIT/
├── README.md                  # Visão geral e guia rápido do sistema GallopIT
├── docs/
│   └── manual_utilizador.md   # Manual de utilizador e guia de especificação técnico v2.1
├── web/
│   └── README.md              # Requisitos para o Dashboard Web
├── firmware/
│   ├── platformio.ini         # Configuração de compilação PlatformIO para ESP32
│   └── src/
│       ├── config.h           # Definição de pinos, segredos de setup e Wi-Fi
│       └── main.cpp           # Firmware C++ completo (NVS, MQTT, LWT, 4s Solenoide)
└── mqtt/
    └── README.md              # Configurações e definições do broker MQTT
```

---

## 🛠️ Modos de Operação (Resumo)

O sistema opera sob 4 modos fundamentais acessíveis pelo painel web:
1. **Controlo Manual:** Abertura imediata de boxes individuais com pulso seguro de 4 segundos.
2. **Sequência Diária (Modo Delay):** Abertura sequencial coordenada das boxes (Box 1 à 4) com intervalos de atraso configuráveis.
3. **Agendamento:** Definição de horários diários recorrentes (Hora:Minuto) por box, sincronizados via internet (NTP).
4. **Histórico & Sistema:** Supervisão de auditoria (quem abriu e quando) e definição de modo padrão de fallback.

---

## 🔒 Setup Inicial Seguro & Protocolo MQTT

Toda a comunicação entre a interface web e o armário físico é efetuada através do protocolo MQTT com suporte a **Setup Inicial Seguro** autenticado por Chave Secreta (`secret_key`):

* **Tópico de Setup Fabril:** `gallopit/setup/{MAC_ADDRESS}/config`
  * **Payload:** `{"secret_key": "GALLOPIT_SECURE_AUTH_KEY_2026", "client_id": "haras_x", "machine_id": "box_01"}`
* **Tópicos de Comando:** `gallopit/{client_id}/{machine_id}/cmd/open`, `gallopit/{client_id}/{machine_id}/cmd/mode`, `gallopit/{client_id}/{machine_id}/cmd/schedule`
* **Tópicos de Status:** `gallopit/{client_id}/{machine_id}/status/presence` (LWT: `"online"`/`"offline"`), `gallopit/{client_id}/{machine_id}/status/state`, `gallopit/{client_id}/{machine_id}/status/event`

---

## 🚀 Como Iniciar

1. **Firmware:** Abrir a pasta `firmware` no **PlatformIO / VS Code** e carregar para o ESP32.
2. **Setup:** Enviar o JSON de provisionamento inicial com a `secret_key` para a máquina gravar em memória permanente.
3. **Docs:** Consultar o [Manual do Utilizador](docs/manual_utilizador.md) para detalhes completos de utilização.
