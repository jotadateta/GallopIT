# GallopIT: Sistema de Cavalariça Inteligente IoT
## Manual do Utilizador e Especificação Técnica de Comunicação MQTT
**Versão 2.1 (Pronto para Escalabilidade Multi-Tenant & Setup Seguro)**

---

## 1. Introdução ao GallopIT
O **GallopIT** é um sistema inteligente e automatizado para gestão de baias (boxes) em cavalariças modernas. O sistema combina hardware IoT de elevada fiabilidade (fechaduras solenoides e microcontroladores ESP32/ESP8266) com uma plataforma web responsiva acessível a partir de smartphones, tablets e computadores.

A Versão 2.1 introduz o protocolo de **Setup Inicial Seguro por MQTT**, permitindo a vinculação remota e protegida de novos armários físicos a clientes específicos sem o risco de alterações não autorizadas nos tópicos.

---

## 2. Perfis e Níveis de Acesso (RBAC)

O sistema divide a gestão em 3 perfis de utilizador:

| Perfil | Acesso | Responsabilidades Principais |
| :--- | :--- | :--- |
| 🛡️ **DEVELOPER** *(Super Admin)* | Global | Registar novos armários/hardware (MAC Address), provisionar via chave secreta de setup e associar a clientes. |
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
| 🟡 **Piscar Lento** | À procura de rede Wi-Fi / Modo Setup Aguardando Configuração. | Verificar o router ou enviar o JSON de setup seguro. |
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
* Configura-se o **Intervalo (em minutos)** entre a abertura de cada box (ex: 5 minutos).
* Ao clicar em **"Iniciar Sequência"**, a Box 1 abre imediatamente. Após o tempo configurado (com 5s de aviso prévio por LED pisca-rápido), a Box 2 abre, repetindo-se até à Box 4.

### Aba 3: Agendamento (Modo Agenda)
* Define-se a hora e minuto diários (HH:MM) para a abertura automática de cada box (ex: `07:30`).
* O armário sincroniza as horas com a internet via **NTP**, garantindo pontualidade absoluta.

### Aba 4: Histórico & Sistema
* **Histórico de Auditoria:** Regista quem abriu cada box, a hora exata e a origem (Manual, Sequência ou Agenda).
* **Modo Padrão Autónomo:** Chave seletora que define qual o modo autónomo padrão (`DELAY` ou `AGENDA`) caso haja reinício do armário.

---

## 5. Setup Inicial Seguro (Provisionamento por MQTT)

Para evitar que terceiros enviem comandos de configuração e alterem os tópicos de um armário, o GallopIT inclui uma camada de **Autenticação por Chave Secreta de Provisionamento (Secret Key Verification)** com persistência em memória não-volátil (NVS/Preferences).

### 5.1. Tópico de Setup Fabril (Baseado no MAC Address Físico)
Ao ligar um novo ESP32 pela primeira vez, ele subscreve ao tópico de provisionamento baseado no seu MAC Address físico único:

* **Tópico de Setup:** `gallopit/setup/{MAC_ADDRESS}/config`
  * *Exemplo:* `gallopit/setup/AABBCCDDEEFF/config`

### 5.2. Payload JSON de Setup Seguro (Enviado pelo Developer)
```json
{
  "secret_key": "GALLOPIT_SECURE_AUTH_KEY_2026",
  "client_id": "haras_quinta_do_sol",
  "machine_id": "box_principal_01",
  "mqtt_server": "test.mosquitto.org",
  "lock_provisioning": true
}
```

### 5.3. Regras de Validação e Segurança
1. O ESP32 verifica se a `secret_key` corresponde exatamente à chave mestra gravada no firmware.
2. Se a chave for **inválida**, o comando é rejeitado instantaneamente e um alerta de segurança é emitido no tópico `gallopit/setup/{MAC_ADDRESS}/status`.
3. Se a chave for **válida**:
   - Os novos dados (`client_id`, `machine_id`, etc.) são gravados na memória flash permanente (**NVS/Preferences**).
   - O ESP32 altera imediatamente a sua árvore de tópicos ativos para `gallopit/{client_id}/{machine_id}/...`.
   - Se `"lock_provisioning": true`, novas reconfigurações só poderão ser feitas enviando novamente a chave secreta.

---

## 6. Referência Técnica: Tópicos MQTT Operacionais

Após o setup inicial, a comunicação segue o padrão:

```text
gallopit / {client_id} / {machine_id} / {direcao} / {acao}
```

### 6.1. Tópicos de Comando (Web Dashboard $\rightarrow$ Armário ESP32)

| Tópico | Payload JSON de Exemplo | Descrição |
| :--- | :--- | :--- |
| `gallopit/{client_id}/{machine_id}/cmd/open` | `{"box": 1}` | Abertura segura da Box (4 segundos). |
| `gallopit/{client_id}/{machine_id}/cmd/mode` | `{"modo": "DELAY", "intervalo_minutos": 5}` | Alteração de modo ativo. |
| `gallopit/{client_id}/{machine_id}/cmd/schedule` | `{"box": 1, "hora": 7, "minuto": 30, "ativo": true}` | Configuração de horário diário. |
| `gallopit/{client_id}/{machine_id}/cmd/status_get` | `{}` | Pedido de envio do estado atual. |

### 6.2. Tópicos de Status (Armário ESP32 $\rightarrow$ Web Dashboard)

| Tópico | Payload | Descrição |
| :--- | :--- | :--- |
| `gallopit/{client_id}/{machine_id}/status/presence` | `"online"` / `"offline"` | Estado LWT (Last Will) em tempo real. |
| `gallopit/{client_id}/{machine_id}/status/state` | JSON completo (Retained) | Estado detalhado das 4 boxes, RSSI e modo. |
| `gallopit/{client_id}/{machine_id}/status/event` | JSON de Evento | Registos pontuais de auditoria. |
