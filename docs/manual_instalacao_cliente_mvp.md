# GallopIT MVP: Guia Completo de Instalação no Cliente & Configuração de App Mobile MQTT

> **Manual de Campo para o Técnico / Integrador (v2.3)**  
> Este documento descreve o procedimento passo-a-passo para instalar o equipamento **GallopIT** na cavalariça do cliente, efetuar o setup de Wi-Fi no local e configurar uma **Aplicação Mobile MQTT gratuita** (ex: *IoT MQTT Panel* ou *MQTT Dash*) no smartphone do cliente/tratador, sem necessidade de servidor ou website.

---

## 📋 Visão Geral da Solução Piloto (MVP)

No modelo MVP Piloto, a interface do cliente é uma **App Mobile MQTT genérica e gratuita** instalada no smartphone do cliente (iOS / Android). 

O firmware **GallopIT v2.3** disponibiliza **tópicos diretos de atalho** (`/box/X/open`, `/box/X/arm`, `/box/X/status`) que permitem configurar os botões na app do cliente em **menos de 2 minutos** por baia.

---

## 🛠️ Passo 1: Preparação do Hardware (Na Oficina)

Antes de ir ao cliente:

1. **Gravar o Firmware:** Carregar o código `firmware/src/main.cpp` (v2.3) para a placa ESP32 através do PlatformIO.
2. **Anotar o MAC Address:** Durante o boot na porta Serial (115200 baud), anota o MAC Address físico (ex: `88572178EF3C`).
3. **Verificar os Relés:** Garante que a placa de relés é **Active-LOW** (`const bool RELAY_ACTIVE_LOW = true;` em `config.h`).

---

## 🔌 Passo 2: Instalação Física na Cavalariça

No local do cliente:

1. **Alimentação:** Liga a fonte de alimentação de **12V DC** (mínimo 2A-3A) à caixa de controlo.
   * O regulador Step-Down / VIN converte os 12V para 5V limpos para a ESP32.
2. **Fechaduras Solenoides:**
   * Fase/Positivo 12V $\rightarrow$ Pino **`NO`** *(Normally Open)* de cada relé.
   * Saída Pino **`COM`** do relé $\rightarrow$ Polo positivo da fechadura solenoide.
   * Polo negativo do solenoide $\rightarrow$ GND Comum da fonte de 12V.
3. **LED de Sinalização:** Garante que o LED de sinalização no pino GPIO 2 (ou painel da caixa) está visível.

---

## 📶 Passo 3: Configuração do Wi-Fi no Local (Captive Portal)

Ao ligar o equipamento à tomada de energia na cavalariça do cliente pela 1.ª vez:

1. O LED da caixa vai ficar a **piscar lentamente (Modo AP Setup)**.
2. No teu smartphone ou no do cliente, abre as definições de Wi-Fi e liga-te à rede criada pela caixa:
   * **Nome da Rede Wi-Fi (SSID):** `GallopIT-Setup-88572178EF3C` *(substituir pelo MAC)*
   * **Palavra-passe:** `gallopit123`
3. O portal abre automaticamente. Se não abrir, acede no browser a **`http://192.168.4.1`**.
4. Preenche os campos do formulário:
   * **Nome da Rede Wi-Fi (SSID):** Nome do Wi-Fi da cavalariça do cliente.
   * **Palavra-passe do Wi-Fi:** Password do Wi-Fi do cliente.
   * **ID do Cliente:** ex: `quinta_do_sol`
   * **ID da Máquina:** ex: `box_principal_01`
   * **Secret Key (Opcional para provisionar):** `GALLOPIT_SECURE_AUTH_KEY_2026`
5. Clica em **"Guardar e Reiniciar"**.
6. A ESP32 vai reiniciar, conectar-se ao Wi-Fi do cliente e dar **3 piscas verdes fixos** no LED, indicando que está **ONLINE**!

---

## 📱 Passo 4: Configuração da App Mobile no Smartphone do Cliente

Recomendamos a app gratuita **IoT MQTT Panel** (disponível na Google Play Store e Apple App Store) ou **MQTT Dash**.

### 4.1. Criar a Conexão ao Broker na App
1. Abre a app **IoT MQTT Panel** e clica no ícone **`+`** para adicionar uma nova conexão.
2. Preenche os dados do servidor:
   * **Name:** `GallopIT Cavalariça`
   * **Broker Address:** `broker.emqx.io`
   * **Port:** `1883`
   * **Client ID:** `GallopIT-ClienteApp-` + números aleatórios.
3. Clica em **Save** e em seguida clica na conexão para abrir o painel.

---

### 4.2. Adicionar os Botões de Controlo (Mapeamento Rápido v2.3)

Substitui `{client}` por `quinta_do_sol` e `{machine}` por `box_principal_01` (os IDs configurados no Passo 3).

#### 🟢 Painel 1: Estado de Conexão da Máquina (Indicator)
* **Tipo de Painel:** *Indicator* / *LED Status*
* **Panel Name:** `Status do Equipamento`
* **Topic:** `gallopit/{client}/{machine}/status/presence`
* **On Payload:** `online` (Cor Verde)
* **Off Payload:** `offline` (Cor Vermelha)

---

#### 🔴 Painel 2: Controlo da Box 1 (Switch / Button)
* **Tipo de Painel:** *Button / Switch*
* **Panel Name:** `Box 1`
* **Sub-tópico de Estado (Text/Indicator):** `gallopit/{client}/{machine}/box/1/status` *(Mostra `ARMADA` em verde / `ABERTA` em vermelho)*
* **Botão ABRIR Box 1 (4 Segundos):**
  * **Topic:** `gallopit/{client}/{machine}/box/1/open`
  * **Payload:** `{}`
* **Botão ARMAR Box 1:**
  * **Topic:** `gallopit/{client}/{machine}/box/1/arm`
  * **Payload:** `{}`

---

#### 🔴 Painel 3: Controlo da Box 2
* **Topic ABRIR:** `gallopit/{client}/{machine}/box/2/open`
* **Topic ARMAR:** `gallopit/{client}/{machine}/box/2/arm`
* **Topic STATUS:** `gallopit/{client}/{machine}/box/2/status`

#### 🔴 Painel 4: Controlo da Box 3
* **Topic ABRIR:** `gallopit/{client}/{machine}/box/3/open`
* **Topic ARMAR:** `gallopit/{client}/{machine}/box/3/arm`
* **Topic STATUS:** `gallopit/{client}/{machine}/box/3/status`

#### 🔴 Painel 5: Controlo da Box 4
* **Topic ABRIR:** `gallopit/{client}/{machine}/box/4/open`
* **Topic ARMAR:** `gallopit/{client}/{machine}/box/4/arm`
* **Topic STATUS:** `gallopit/{client}/{machine}/box/4/status`

---

#### ⚡ Painel 6: Botões Master (Ações Globais)
* **Botão ABRIR TODAS:**
  * **Topic:** `gallopit/{client}/{machine}/box/all/open`
  * **Payload:** `{}`
* **Botão ARMAR TODAS:**
  * **Topic:** `gallopit/{client}/{machine}/box/all/arm`
  * **Payload:** `{}`

---

## 🧪 Passo 5: Checklist de Testes de Entrega no Cliente

Antes de dar o trabalho por concluído com o cliente, executa esta lista de verificação conjunta:

- [ ] **Teste de Abertura Box 1:** Clica em "Abrir Box 1" na app. O solenoide 1 deve atuar durante **exatos 4 segundos**, o LED acende fixo e o status na app muda para **`ABERTA`**.
- [ ] **Teste de Re-armamento:** Fecha a porta fisicamente e clica em "Armar Box 1". O status na app muda para **`ARMADA`**.
- [ ] **Teste das Restantes Boxes:** Valida Box 2, 3 e 4.
- [ ] **Teste do Botão Master:** Clica em "Abrir Todas" e valida a atuação em cadeia.
- [ ] **Teste de Falha de Energia (NVS Memory):** Desliga a ficha da fonte de 12V da tomada por 10 segundos e volta a ligar.
  * Quando a ESP32 reconeta, verifica se ela **memorizou exatamente quais as boxes que estavam ABERTAS e ARMADAS** antes do corte de energia!

---

## 📑 Resumo dos Tópicos MQTT para Apontamento Rápido

```text
GALLOPIT MVP - CLIENTE: {client} | MÁQUINA: {machine}

ABRIR BOX 1:   gallopit/{client}/{machine}/box/1/open
ARMAR BOX 1:   gallopit/{client}/{machine}/box/1/arm
STATUS BOX 1:  gallopit/{client}/{machine}/box/1/status

ABRIR TODAS:   gallopit/{client}/{machine}/box/all/open
ARMAR TODAS:   gallopit/{client}/{machine}/box/all/arm
PRESENÇA:      gallopit/{client}/{machine}/status/presence
```

---
*GallopIT v2.3 - Sistema Autónomo de Cavalariças IoT*
