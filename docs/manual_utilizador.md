# EquiLock: Sistema de Cavalariça Inteligente IoT
## Manual do Utilizador e Especificação Técnica de Comunicação MQTT
**Versão 2.0 (Pronto para Escalabilidade Multi-Tenant)**

---

## 1. Introdução ao EquiLock
O **EquiLock** é um sistema inteligente e automatizado para gestão de baias (boxes) em cavalariças modernas. O sistema combina hardware IoT de elevada fiabilidade (fechaduras solenoides e microcontroladores ESP32/ESP8266) com uma plataforma web responsiva acessível a partir de smartphones, tablets e computadores.

A Versão 2.0 introduz arquitetura **Multi-Tenant (Múltiplos Clientes/Cavalariças)**, controlo de acessos baseado em papéis (RBAC) e comunicação MQTT hierárquica e escalável.

---

## 2. Perfis e Níveis de Acesso (RBAC)

O sistema divide a gestão em 3 perfis de utilizador:

| Perfil | Acesso | Responsabilidades Principais |
| :--- | :--- | :--- |
| 🛡️ **DEVELOPER** *(Super Admin)* | Global | Registar novos armários/hardware (IDs e MAC Address), associar máquinas a novos clientes. |
| 🏢 **CLIENT_ADMIN** *(Dono do Haras)* | Da Empresa | Gerir a sua cavalariça, criar contas para funcionários/tratadores, atribuir máquinas a utilizadores. |
| 👨‍🌾 **OPERATOR** *(Tratador/Funcionário)* | Limitado | Operar as baias atribuídas (abertura manual, iniciar sequências diárias, consultar estado). |

---

## 3. O Hardware (Armário e Sinalização)

O armário físico controla até **4 solenoides (fechaduras de baias)** e possui mecanismos rígidos de proteção elétrica:

* **Atuação Segura (4 Segundos):** Cada solenoide é energizado por exatos **4 segundos**. Após este tempo, a alimentação é cortada automaticamente para evitar sobreaquecimento da bobina.
* **Proteção Anti-Spam:** O hardware e a interface ignoram comandos repetidos num intervalo inferior a 4 segundos.

### Tabela de Diagnósticos do LED de Sinalização
O LED instalado no armário físico comunica o estado do equipamento em tempo real:

| Sinal do LED | Significado | Ação Recomendada |
| :--- | :--- | :--- |
| 🟡 **Piscar Lento** | À procura de rede Wi-Fi / Reconexão MQTT. | Verificar o router e sinal de internet local. |
| 🟢 **Fixo por 3 segundos** | Ligação bem-sucedida à rede e ao broker MQTT. | Nenhuma (sistema pronto a operar). |
| ⚡ **Piscar Rápido (5s)** | **Aviso Prévio:** Uma porta vai abrir dentro de 5 segundos. | **Afaste-se da baia imediatamente.** |
| 🔴 **Aceso Fixo (4s)** | Uma fechadura solenoide está ativa neste momento. | Aguardar conclusão da abertura. |
| ⚪ **Apagado** | Armário ligado e em standby normal. | Funcionamento regular. |

---

## 4. Modos de Operação (Painel Web)

O Dashboard organiza-se em **4 áreas principais**:

### Aba 1: Controlo Manual
* Exibe os cartões das **Boxes 1 a 4**.
* Clique em **"Abrir Box"** para acionar a fechadura correspondente.
* O botão fica temporariamente desativado durante 4 segundos com contagem decrescente visual.

### Aba 2: Sequência Diária (Modo Delay)
* Ideal para momentos de alimentação ou saída coordenada de cavalos.
* Configura-se o **Intervalo (em minutos)** entre a abertura de cada box (ex: 5 minutos).
* Ao clicar em **"Iniciar Sequência"**, a Box 1 abre imediatamente. Após o tempo configurado (com 5s de aviso prévio por LED pisca-rápido), a Box 2 abre, repetindo-se até à Box 4.

### Aba 3: Agendamento (Modo Agenda)
* Torna a cavalariça 100% autónoma.
* Define-se a hora e minuto diários (HH:MM) para a abertura automática de cada box (ex: `07:30`).
* O armário sincroniza as horas com a internet via **NTP**, garantindo pontualidade absoluta.

### Aba 4: Histórico & Sistema
* **Histórico de Auditoria:** Regista quem abriu cada box, a hora exata e a origem (Manual, Sequência ou Agenda).
* **Modo Padrão Autónomo:** Chave seletora que define qual o modo autónomo padrão (`DELAY` ou `AGENDA`) caso haja reinício do armário.

---

## 5. Resiliência e Operação Offline

* **Corte de Energia:** As fechaduras mantêm-se trancadas mecanicamente. As definições são guardadas na memória não-volátil (EEPROM/Preferences). Ao regressar a energia, o armário retoma o estado anterior.
* **Perda de Internet/Wi-Fi:** Se a ligação Wi-Fi falhar, a interface web mostra a máquina como **Offline**. Contudo, o armário continua a executar as suas rotinas e agendamentos autonomamente usando o seu relógio interno.

---

## 6. Referência Técnica: Protocolo de Comunicação MQTT

A comunicação entre a Web e os Armários é realizada via protocolo **MQTT sobre WebSockets** (porta `9001`/`wss`).

### 6.1. Estrutura Padrão dos Tópicos (Multi-Tenant)
```text
equilock / {client_id} / {machine_id} / {direcao} / {acao}
```

* `{client_id}`: Identificador único do cliente/haras no Supabase (ex: `haras_do_sol`).
* `{machine_id}`: Identificador do armário físico (ex: `eq_001`).

---

### 6.2. Tópicos de Comando (Web Dashboard $\rightarrow$ Armário ESP32)

#### 1. Abertura Manual de Box
* **Tópico:** `equilock/{client_id}/{machine_id}/cmd/open`
* **Payload JSON:**
  ```json
  {
    "box": 1,
    "user_id": "usr_9981",
    "timestamp": 1770932000
  }
  ```
  *(Nota: Para abrir todas as boxes em manutenção, passar `"box": "all"`).*

#### 2. Alteração de Modo de Operação
* **Tópico:** `equilock/{client_id}/{machine_id}/cmd/mode`
* **Payload JSON:**
  ```json
  {
    "modo": "DELAY",
    "intervalo_minutos": 5
  }
  ```

#### 3. Configuração de Agendamento
* **Tópico:** `equilock/{client_id}/{machine_id}/cmd/schedule`
* **Payload JSON:**
  ```json
  {
    "box": 1,
    "hora": 7,
    "minuto": 30,
    "ativo": true
  }
  ```

#### 4. Pedido de Estado Atual (Force Refresh)
* **Tópico:** `equilock/{client_id}/{machine_id}/cmd/status_get`
* **Payload JSON:** `{}`

---

### 6.3. Tópicos de Status e Telemetria (Armário ESP32 $\rightarrow$ Web Dashboard)

#### 1. Presença e Estado de Ligação (MQTT LWT - Last Will)
* **Tópico:** `equilock/{client_id}/{machine_id}/status/presence`
* **Payload Simples:** `"online"` ou `"offline"`
* **Nota:** O broker envia automaticamente `"offline"` se a ESP32 perder a ligação abruptamente.

#### 2. Estado Completo do Sistema (Retained Message)
* **Tópico:** `equilock/{client_id}/{machine_id}/status/state`
* **Payload JSON Completo:**
  ```json
  {
    "client_id": "haras_do_sol",
    "machine_id": "eq_001",
    "modo_ativo": "DELAY",
    "intervalo_minutos": 5,
    "sequencia_em_execucao": false,
    "box_atual_sequencia": 0,
    "boxes": [
      {"box": 1, "hora": 7, "minuto": 30, "ativo": true, "status": "FECHADA"},
      {"box": 2, "hora": 8, "minuto": 0, "ativo": true, "status": "FECHADA"},
      {"box": 3, "hora": 12, "minuto": 30, "ativo": true, "status": "FECHADA"},
      {"box": 4, "hora": 19, "minuto": 0, "ativo": true, "status": "FECHADA"}
    ],
    "firmware_version": "2.0.0",
    "wifi_rssi": -62
  }
  ```

#### 3. Notificação de Eventos em Tempo Real
* **Tópico:** `equilock/{client_id}/{machine_id}/status/event`
* **Payload JSON:**
  ```json
  {
    "evento": "BOX_OPENED",
    "box": 1,
    "origem": "MANUAL",
    "user": "João Silva",
    "timestamp": 1770932005,
    "mensagem": "Box 1 aberta com sucesso por comando manual."
  }
  ```

---

## 7. Resumo de Subscrições para a Aplicação Web

Quando o utilizador faz login na plataforma web:

* **Operador (Acede à Máquina `eq_001`):**
  * Subscreve a: `equilock/haras_do_sol/eq_001/status/#`
* **Client Admin (Visualiza todas as máquinas do Haras):**
  * Subscreve a: `equilock/haras_do_sol/+/status/#`
* **Developer (Monitoriza a frota global de 100+ máquinas):**
  * Subscreve a: `equilock/+/+/status/presence`
