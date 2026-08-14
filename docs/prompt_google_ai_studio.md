# Prompt Mestre para Google AI Studio: Desenvolvimento da Web App GallopIT (v2.2)

> **Instrução de Utilização:** Copia e cola o texto abaixo diretamente no **Google AI Studio** (ou outro assistente de LLM/Frontend) para gerar a aplicação web completa do GallopIT.

---

```markdown
Tu és um Engenheiro Frontend Sénior e Arquiteto IoT. O teu objetivo é criar uma Web Application moderna, responsiva e de alto rendimento para o sistema **GallopIT v2.2** (Gestão de Baias/Boxes Inteligentes para Cavalariças).

A aplicação web vai conectar-se diretamente ao Broker MQTT público via WebSockets para comunicar em tempo real com microcontroladores ESP32 instalados nas boxes.

---

### 1. ARQUITETURA E TECNOLOGIAS UTILIZADAS
* **Frontend:** HTML5, JavaScript Moderno (ES6+ / React ou Vanilla JS), Tailwind CSS (ou Vanilla CSS com componentes escuros/elegantes tipo Premium Dark Mode).
* **Conexão MQTT:** Biblioteca `mqtt.js` (ou Paho MQTT) via WebSockets (WSS).
  * **Broker Host:** `broker.emqx.io`
  * **Porta WSS (Browser):** `8084` (Caminho `/mqtt`)
  * **URI de Conexão:** `wss://broker.emqx.io:8084/mqtt`

---

### 2. NÍVEIS DE ACESSO (RBAC - ROLE BASED ACCESS CONTROL)
A interface deve ajustar a visibilidade de acordo com o perfil selecionado:
1. 🛡️ **DEVELOPER (Super Admin):**
   * Acesso à aba de **Auto-Descoberta de Dispositivos**.
   * Escuta o tópico `gallopit/discovery/announcement` para detetar novas ESP32 com o seu MAC Address.
   * Formulário de **Setup Seguro / Provisionamento** para enviar a `secret_key` e associar o MAC a um `client_id` e `machine_id`.
2. 🏢 **CLIENT_ADMIN (Dono do Haras):**
   * Controlo total das 4 boxes, configuração de modos (`DELAY` vs `AGENDA`), agendamentos HH:MM e logs de auditoria.
3. 👨‍🌾 **OPERATOR (Tratador / Funcionário):**
   * Visão operacional limpa: Abertura manual das 4 boxes e botão de **Armar Prateleira/Box**.

---

### 3. ESPECIFICAÇÃO DE TÓPICOS E PAYLOADS MQTT (v2.2)

O padrão de tópicos operacionais segue a estrutura:
`gallopit / {client_id} / {machine_id} / {direcao} / {acao}`

#### 3.1. Envio de Comandos (Web App -> ESP32)
* **Abrir Box (Dispara solenoide 4s + Marca ABERTA):**
  * Tópico: `gallopit/{client_id}/{machine_id}/cmd/open`
  * Payload: `{"box": 1}` *(ou `{"box": "all"}`)*
* **Armar Box / Prateleira (Marca como ARMADA/Fechada):**
  * Tópico: `gallopit/{client_id}/{machine_id}/cmd/arm`
  * Payload: `{"box": 1}` *(ou `{"box": "all"}`)*
* **Ping de Conexão (Verifica se a máquina responde online):**
  * Tópico: `gallopit/{client_id}/{machine_id}/cmd/ping`
  * Payload: `{}`
* **Alterar Modo de Operação (DELAY / AGENDA):**
  * Tópico: `gallopit/{client_id}/{machine_id}/cmd/mode`
  * Payload: `{"modo": "DELAY", "intervalo_minutos": 5}`
* **Configurar Agendamento Diário:**
  * Tópico: `gallopit/{client_id}/{machine_id}/cmd/schedule`
  * Payload: `{"box": 1, "hora": 7, "minuto": 30, "ativo": true}`
* **Solicitar Estado Atual:**
  * Tópico: `gallopit/{client_id}/{machine_id}/cmd/status_get`
  * Payload: `{}`

#### 3.2. Leitura de Respostas (ESP32 -> Web App)
* **Presença Online/Offline (LWT Retained):**
  * Tópico: `gallopit/{client_id}/{machine_id}/status/presence`
  * Conteúdo: `"online"` ou `"offline"`
* **Estado Completo (JSON Retained):**
  * Tópico: `gallopit/{client_id}/{machine_id}/status/state`
  * Exemplo de Payload JSON recebido:
    ```json
    {
      "system": "gallopit",
      "client_id": "haras_quinta_do_sol",
      "machine_id": "box_principal_01",
      "mac_address": "88:57:21:78:EF:3C",
      "provisioned": true,
      "modo_ativo": "DELAY",
      "intervalo_minutos": 5,
      "firmware": "2.2.0-ESP32",
      "wifi_rssi": -45,
      "boxes": [
        {"box": 1, "hora": -1, "minuto": -1, "ativo": false, "rele_ativo": false, "status": "ABERTA"},
        {"box": 2, "hora": 7, "minuto": 30, "ativo": true, "rele_ativo": false, "status": "ARMADA"},
        {"box": 3, "hora": -1, "minuto": -1, "ativo": false, "rele_ativo": false, "status": "ARMADA"},
        {"box": 4, "hora": -1, "minuto": -1, "ativo": false, "rele_ativo": false, "status": "ARMADA"}
      ]
    }
    ```
* **Eventos de Auditoria e PONG:**
  * Tópico: `gallopit/{client_id}/{machine_id}/status/event`

---

### 4. REQUISITOS DE INTERFACE E DESIGN (UI/UX)

1. **Cabeçalho com Indicador de Conexão:**
   * Badge de estado em tempo real: 🟢 `ONLINE` / 🔴 `OFFLINE` / 🟡 `A LIGAR...`.
   * Botão de **Ping/Atualizar** que envia o comando `cmd/ping`.

2. **Cartões das 4 Boxes (Grid Responsivo):**
   * Cada cartão exibe:
     * Título (ex: **Box 1 - Baia Principal**).
     * Indicador de Estado Lógico:
       * 🔴 **`ABERTA`** (Porta solta / alimentada) $\rightarrow$ Exibe o botão **"Armar Box"** (manda `cmd/arm`).
       * 🟢 **`ARMADA`** (Prateleira fechada e pronta) $\rightarrow$ Exibe o botão **"Abrir Box"** (manda `cmd/open`).
     * Se `rele_ativo` for `true`, o botão mostra uma **contagem decrescente visual de 4 segundos** e fica desativado.

3. **Painel de Ações Master:**
   * Botão **"Armar Todas"** (manda `cmd/arm` com `box: "all"`).
   * Botão **"Abrir Todas"** (manda `cmd/open` com `box: "all"`).

4. **Seletor de Modo (DELAY vs AGENDA):**
   * Toggle visual para mudar entre Modo Sequência Diária (com input de minutos entre cada box) e Modo Agendamento (com seletores de hora/minuto para cada box).

5. **Aba de Provisionamento / Developer:**
   * Lista de dispositivos descobertos no tópico `gallopit/discovery/announcement`.
   * Formulário com campos: `MAC Address`, `Client ID`, `Machine ID` e `Secret Key` (Predefinida: `GALLOPIT_SECURE_AUTH_KEY_2026`).

6. **Log de Eventos / Auditoria:**
   * Tabela em tempo real a mostrar quem abriu ou armou cada box, a hora exata e a origem do comando.

---

### 5. CÓDIGO EXEMPLO DE CONEXÃO WEBSOCKET MQTT (JavaScript)

```javascript
import mqtt from 'mqtt';

const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
  clientId: 'GallopIT-WebApp-' + Math.random().toString(16).substring(2, 8),
  clean: true,
  reconnectPeriod: 3000
});

client.on('connect', () => {
  console.log('Conetado ao EMQX MQTT Broker via WSS!');
  
  // 1. Escuta anúncios de novos equipamentos
  client.subscribe('gallopit/discovery/announcement');
  
  // 2. Escuta toda a árvore do cliente ativo
  const clientId = 'haras_quinta_do_sol';
  const machineId = 'box_principal_01';
  client.subscribe(`gallopit/${clientId}/${machineId}/status/#`);
  
  // 3. Solicita estado inicial
  client.publish(`gallopit/${clientId}/${machineId}/cmd/status_get`, '{}');
});

client.on('message', (topic, payload) => {
  const messageStr = payload.toString();
  const data = JSON.parse(messageStr);
  
  if (topic.endsWith('/status/state')) {
    updateBoxesUI(data.boxes); // Atualiza os cartões na tela
  } else if (topic.endsWith('/status/presence')) {
    updateOnlineBadge(messageStr === 'online');
  }
});

// Função para abrir uma box (4s solenoide)
function openBox(clientId, machineId, boxNumber) {
  const topic = `gallopit/${clientId}/${machineId}/cmd/open`;
  client.publish(topic, JSON.stringify({ box: boxNumber }));
}

// Função para armar uma box (marcar ARMADA)
function armBox(clientId, machineId, boxNumber) {
  const topic = `gallopit/${clientId}/${machineId}/cmd/arm`;
  client.publish(topic, JSON.stringify({ box: boxNumber }));
}
```

Cria uma interface Web moderna, elegante, 100% responsiva e com excelente UX baseada nestes requisitos!
```
