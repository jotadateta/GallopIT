# GallopIT: Sistema de Cavalariça Inteligente IoT
## Manual do Utilizador e Especificação Técnica de Comunicação MQTT
**Versão 2.2 (Com Suporte para Estado Lógico Latch, Setup Seguro & Ping de Conexão)**

---

## 1. Introdução ao GallopIT
O **GallopIT** é um sistema inteligente e automatizado para gestão de baias (boxes) em cavalariças modernas. O sistema combina hardware IoT de elevada fiabilidade (fechaduras solenoides e microcontroladores ESP32/ESP8266) com uma plataforma web responsiva acessível a partir de smartphones, tablets e computadores.

A Versão 2.2 introduz o **Estado Lógico Latch Permanente (ARMADA vs ABERTA)** guardado na memória NVS Flash do ESP32, bem como comandos diretos de **Armar Prateleira (`cmd/arm`)** e **Ping de Conexão em Tempo Real (`cmd/ping`)**.

---

## 2. Perfis e Níveis de Acesso (RBAC)

O sistema divide a gestão em 3 perfis de utilizador:

| Perfil | Acesso | Responsabilidades Principais |
| :--- | :--- | :--- |
| 🛡️ **DEVELOPER** *(Super Admin)* | Global | Registar novos armários/hardware (MAC Address), provisionar via chave secreta de setup e associar a clientes. |
| 🏢 **CLIENT_ADMIN** *(Dono do Haras)* | Da Empresa | Gerir a sua cavalariça, criar contas para funcionários/tratadores, atribuir máquinas a utilizadores. |
| 👨‍🌾 **OPERATOR** *(Tratador/Funcionário)* | Limitado | Operar as baias atribuídas (abertura manual, armar prateleiras fechadas, consultar estado). |

---

## 3. O Hardware (Armário e Sinalização)

O armário físico controla até **4 solenoides (fechaduras de baias)** e possui mecanismos rígidos de proteção elétrica:

* **Atuação Segura (4 Segundos):** Cada solenoide é energizado por exatos **4 segundos**. Após este tempo, a alimentação é cortada automaticamente para evitar sobreaquecimento da bobina.
* **Estado Lógico Latch (ARMADA vs ABERTA):** Mesmo após os 4 segundos do solenoide terminarem, a ESP32 sabe que a baia ficou **`ABERTA`** (porta solta), e só volta ao estado **`ARMADA`** quando o utilizador armar a prateleira no painel web (`cmd/arm`).
* **Proteção Anti-Spam:** O hardware e a interface ignoram comandos repetidos num intervalo inferior a 4 segundos.

### Tabela de Diagnósticos do LED de Sinalização
O LED instalado no armário físico comunica o estado do equipamento em tempo real:

| Sinal do LED | Significado | Ação Recomendada |
| :--- | :--- | :--- |
| 🟡 **Piscar Lento** | À procura de rede Wi-Fi / Modo Setup Aguardando Configuração. | Verificar o router ou enviar o JSON de setup seguro. |
| 🟢 **Fixo por 3 segundos** | Ligação bem-sucedida à rede e ao broker MQTT. | Nenhuma (sistema pronto a operar). |
| ⚡ **Piscar Rápido (5s)** | **Aviso Prévio:** Uma porta vai abrir dentro de 5 segundos. | **Afaste-se da baia imediatamente.** |
| 🔴 **Aceso Fixo (4s)** | Uma fechadura solenoide está ativa neste momento. | Aguardar conclusão da abertura. |
| ⚪ **Apagado** | Armário ligado e em standby normal. | Funcionamento regular. |

---

## 4. Modos de Operação (Painel Web)

O Dashboard organiza-se em **4 áreas principais**:

### Aba 1: Controlo Manual & Estado dos Trincos
* Exibe os cartões das **Boxes 1 a 4** com indicador visual de estado (**`ARMADA`** em verde / **`ABERTA`** em vermelho).
* Clique em **"Abrir Box"** para acionar a fechadura (4 segundos de solenoide + transição para estado `ABERTA`).
* Clique em **"Armar Box"** ou **"Armar Todas"** para registar que a prateleira foi reabastecida/fechada fisicamente.

### Aba 2: Sequência Diária (Modo Delay)
* Configura-se o **Intervalo (em minutos)** entre a abertura de cada box (ex: 5 minutos).
* Ao clicar em **"Iniciar Sequência"**, a Box 1 abre imediatamente. Após o tempo configurado, a Box 2 abre, repetindo-se até à Box 4.

### Aba 3: Agendamento (Modo Agenda)
* Define-se a hora e minuto diários (HH:MM) para a abertura automática de cada box (ex: `07:30`).
* O armário sincroniza as horas com a internet via **NTP**, garantindo pontualidade absoluta.

### Aba 4: Histórico & Sistema
* **Histórico de Auditoria:** Regista quem abriu e quem armou cada box, a hora exata e a origem.
* **Verificação de Conexão (PING):** Envia um sinal instantâneo ao armário para validar resposta online.

---

## 5. Setup Inicial Seguro (Provisionamento por MQTT)

Para evitar que terceiros enviem comandos de configuração e alterem os tópicos de um armário, o GallopIT inclui uma camada de **Autenticação por Chave Secreta de Provisionamento (Secret Key Verification)** com persistência em memória não-volátil (NVS/Preferences).

### 5.1. Tópico de Setup Fabril (Baseado no MAC Address Físico)
* **Tópico de Setup:** `gallopit/setup/{MAC_ADDRESS}/config`
  * *Exemplo:* `gallopit/setup/88572178EF3C/config`

### 5.2. Payload JSON de Setup Seguro
```json
{
  "secret_key": "GALLOPIT_SECURE_AUTH_KEY_2026",
  "client_id": "haras_quinta_do_sol",
  "machine_id": "box_principal_01"
}
```

---

## 6. Referência Técnica: Tópicos MQTT Operacionais (v2.2)

```text
gallopit / {client_id} / {machine_id} / {direcao} / {acao}
```

### 6.1. Tópicos de Comando (Web Dashboard / Script $\rightarrow$ Armário ESP32)

| Tópico | Payload JSON | Descrição |
| :--- | :--- | :--- |
| `gallopit/{client_id}/{machine_id}/cmd/open` | `{"box": 1}` / `{"box": "all"}` | Abertura (4s relé + marca `ABERTA`). |
| `gallopit/{client_id}/{machine_id}/cmd/arm` | `{"box": 1}` / `{"box": "all"}` | Re-armar a box (marca `ARMADA`). |
| `gallopit/{client_id}/{machine_id}/cmd/ping` | `{}` | Pedido PING para verificar presença online. |
| `gallopit/{client_id}/{machine_id}/cmd/mode` | `{"modo": "DELAY", "intervalo_minutos": 5}` | Alteração de modo ativo. |
| `gallopit/{client_id}/{machine_id}/cmd/schedule` | `{"box": 1, "hora": 7, "minuto": 30, "ativo": true}` | Configuração de horário diário. |
| `gallopit/{client_id}/{machine_id}/cmd/status_get` | `{}` | Pedido de envio do estado completo. |

### 6.2. Tópicos de Status (Armário ESP32 $\rightarrow$ Web Dashboard / Script)

| Tópico | Payload | Descrição |
| :--- | :--- | :--- |
| `gallopit/{client_id}/{machine_id}/status/presence` | `"online"` / `"offline"` | Estado LWT (Last Will) com retenção (Retained). |
| `gallopit/{client_id}/{machine_id}/status/state` | JSON completo (Retained) | Lista das 4 boxes com o campo `"status": "ABERTA"` / `"ARMADA"`. |
| `gallopit/{client_id}/{machine_id}/status/event` | JSON de Evento | Auditoria de aberturas, re-armamentos e respostas a PING (`PONG`). |
