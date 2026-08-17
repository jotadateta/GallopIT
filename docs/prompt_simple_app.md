# Prompt Mestre para Google AI Studio: Web App Simplificada GallopIT (MVP Tester v1.0)

> **Instrução de Utilização:** Copia e cola o texto abaixo no **Google AI Studio** para gerar a aplicação web simplificada de validação do MVP do GallopIT.

---

```markdown
Tu és um Programador Frontend Sénior. O teu objetivo é criar uma Web Application de página única (Single Page), minimalista e responsiva, destinada à validação do MVP do sistema **GallopIT v2.2** com clientes de teste.

A aplicação deve ligar-se diretamente a um Broker MQTT público via WebSockets para controlar um armário de 4 boxes de cavalariça em tempo real.

---

### 1. ARQUITETURA E TECNOLOGIA
* **Estrutura:** Um único ficheiro HTML autónomo (`index.html`) contendo toda a estrutura, estilos (CSS incorporado) e lógica (JavaScript incorporado).
* **Biblioteca MQTT:** Utilizar a biblioteca Paho MQTT via CDN:
  `https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js`
* **Definições de Conexão MQTT (Pré-configuradas):**
  * **Broker Host:** `broker.emqx.io`
  * **Porta WSS:** `8084`
  * **Caminho:** `/mqtt`
  * **SSL/TLS (UseSSL):** `true`
  * **Tópico Base Padrão:** `gallopit/haras_quinta_do_sol/box_principal_01`

---

### 2. REQUISITOS DE DESIGN E INTERFACE (UI/UX)
* **Estilo Visual:** Dark Mode Moderno (Premium). Fundo escuro (#0f172a), cartões com tons cinza escuro (#1e293b), botões em verde esmeralda (#10b981) para ações positivas e vermelho/laranja para alertas.
* **Sem Níveis de Acesso (Sem RBAC):** Uma única vista limpa e direta para o operador/tester.

#### Elementos na Página:

1. **Cabeçalho de Status:**
   * Badge visual de estado da ligação: 🟢 `ONLINE` / 🔴 `OFFLINE` / 🟡 `A LIGAR...`.
   * Campo simples para alterar o **Client ID** e o **Machine ID** (valores padrão: `haras_quinta_do_sol` e `box_principal_01`). Se o utilizador alterar estes campos, a aplicação deve desligar-se, subscrever-se nos novos tópicos e pedir o estado atual.
   * Botão **"Ping"** para enviar um ping rápido ao equipamento.

2. **Ações Rápidas (Master Controls):**
   * Botão **"Abrir Todas as Boxes"** (envia `{"box": "all"}` para o comando de open).
   * Botão **"Armar Todas as Boxes"** (envia `{"box": "all"}` para o comando de arm).

3. **Cartões das 4 Boxes (Grid 2x2 ou Coluna Única em telemóvel):**
   * Cada cartão representa uma Box (1 a 4).
   * **Estado Lógico:** Indica se a porta está 🔴 `ABERTA` ou 🟢 `ARMADA`.
   * **Ação Dinâmica:**
     * Se estiver 🔴 `ABERTA`: Botão verde **"Armar Box"** (envia comando `/cmd/arm`).
     * Se estiver 🟢 `ARMADA`: Botão verde **"Abrir Box"** (envia comando `/cmd/open`).
   * **Contagem Decrescente:** Se a box receber feedback de atuação (`rele_ativo` for `true`), o botão deve ficar desativado e mostrar uma contagem decrescente visual de **4 segundos**.

4. **Painel de Configuração Básica:**
   * **Modo de Operação:** Toggle ou interruptor simples para alternar entre o Modo `DELAY` (Sequencial) e `AGENDA` (Agendamento).
   * **Configuração de Sequência (Delay):** Campo numérico simples para definir o "Intervalo (minutos)" e botão para Guardar.
   * **Horários de Agendamento:** Uma lista simples para as 4 boxes com campos para escolher Hora e Minuto (HH:MM) e um botão "Atualizar" para cada box.

5. **Consola de Eventos Simplificada:**
   * Uma secção de logs de texto simples no fundo da página que mostra as últimas mensagens recebidas/enviadas (ex: "Box 1 aberta com sucesso via Painel", "Perda de Wi-Fi detetada", etc.).

---

### 3. MAPEAMENTO DE TÓPICOS E PAYLOADS
A aplicação deve subscrever-se em:
* `gallopit/{client_id}/{machine_id}/status/presence` (recebe `"online"` ou `"offline"`)
* `gallopit/{client_id}/{machine_id}/status/state` (recebe o JSON de estado)
* `gallopit/{client_id}/{machine_id}/status/event` (recebe logs e eventos da ESP32)

#### Envio de Comandos:
* **Abrir Box:** Publicar em `gallopit/{client_id}/{machine_id}/cmd/open` $\rightarrow$ `{"box": <numero_ou_all>}`
* **Armar Box:** Publicar em `gallopit/{client_id}/{machine_id}/cmd/arm` $\rightarrow$ `{"box": <numero_ou_all>}`
* **Ping:** Publicar em `gallopit/{client_id}/{machine_id}/cmd/ping` $\rightarrow$ `{}`
* **Alternar Modo:** Publicar em `gallopit/{client_id}/{machine_id}/cmd/mode` $\rightarrow$ `{"modo": "DELAY" ou "AGENDA", "intervalo_minutos": X}`
* **Agendar Box:** Publicar in `gallopit/{client_id}/{machine_id}/cmd/schedule` $\rightarrow$ `{"box": X, "hora": H, "minuto": M, "ativo": true/false}`
* **Pedir Estado:** Publicar em `gallopit/{client_id}/{machine_id}/cmd/status_get` $\rightarrow$ `{}`

---

Cria uma página HTML moderna, limpa, totalmente responsiva e pronta a funcionar que execute estes requisitos.
```
