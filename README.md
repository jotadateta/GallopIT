# EquiLock: Sistema de Cavalariça Inteligente IoT

Este repositório contém a documentação técnica, especificações e, futuramente, o código fonte para o **EquiLock**, um sistema inteligente e automatizado para gestão de baias (boxes) em cavalariças modernas.

O EquiLock combina hardware IoT de alta fiabilidade com um painel de controlo web minimalista, robusto e responsivo.

---

## 📁 Estrutura do Repositório

Esta é a estrutura inicial organizada para facilitar o desenvolvimento e a sincronização com o seu novo computador:

```text
Project-GallopIT/
├── README.md                  # Este ficheiro com a visão geral do projeto
├── docs/
│   └── manual_utilizador.md   # Manual de utilizador e guia de operação completo (v1.3)
├── web/
│   └── README.md              # Diretório para o Dashboard Web (Frontend/Backend)
├── firmware/
│   └── README.md              # Diretório para o código do microcontrolador (ESP32/ESP8266, etc.)
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

## 📡 Comunicação e Protocolo (MQTT)

Toda a comunicação entre a interface web e o armário físico é efetuada através do protocolo MQTT com tópicos dedicados de comando, configuração e status:

* **Tópicos de Comando:** `armario/comando/manutencao` (`"ON"`), `armario/comando/sequencia` (`"START"`), `armario/comando/status` (`"GET"`).
* **Tópicos de Configuração:** `armario/config/modo` (`"DELAY"`/`"AGENDA"`), `armario/config/delay` (`{"minutos": X}`), `armario/config/agenda` (`{"prateleira": X, "hora": H, "minuto": M}`).
* **Tópicos de Status:** `armario/status/conexao` (`"online"`/`"offline"` via LWT), `armario/status/notificacao`, `armario/status/atual` (JSON completo).

---

## 🚀 Como Iniciar no Novo Computador

Para configurar e continuar o desenvolvimento neste repositório no seu computador portátil novo:

### 1. Clonar o repositório
```bash
git clone https://github.com/jotadateta/GallopIT.git
cd GallopIT
```

### 2. Fluxo de Trabalho Recomendado
* **`/web`:** Desenvolver a aplicação do Dashboard (ex: utilizando HTML/CSS/JS puros ou uma framework como Next.js/Vite).
* **`/firmware`:** Desenvolver o código das fechaduras (ex: C++ para ESP32 ou ESP8266 com bibliotecas WiFi e PubSubClient).
* **`/docs`:** Consultar e expandir o [Manual de Utilizador](docs/manual_utilizador.md) sempre que necessário.

