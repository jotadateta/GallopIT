# EquiLock: Sistema de Cavalariça Inteligente IoT
## Manual do Utilizador e Guia de Operação
**Versão 1.3**

---

## 1. Introdução ao EquiLock
Bem-vindo ao **EquiLock**, o seu sistema automatizado para gestão de baias (boxes) em cavalariças modernas. O EquiLock combina hardware de alta fiabilidade (fechaduras eletrónicas) com um painel de controlo web minimalista e acessível a partir de qualquer computador, tablet ou smartphone.

Este manual explicará como operar o sistema no dia a dia, como configurar horários automáticos e o que significam os avisos visuais.

---

## 2. O Hardware (O Armário e as Fechaduras)
O cérebro físico do sistema está instalado no local e controla até **4 fechaduras (solenoides)**. Para garantir a sua segurança e a durabilidade do equipamento, o sistema possui regras físicas estritas:

* **Atuação Segura (4 Segundos):** Sempre que uma porta é mandada abrir, a fechadura recebe energia apenas durante 4 segundos exatos. Isto impede o sobreaquecimento da fechadura e protege o sistema.
* **LED de Sinalização (Luz de Aviso):** O sistema possui uma luz (LED) na porta ou painel principal que indica o estado atual do armário físico:

| Sinal do LED | Significado | Ação Recomendada |
| :--- | :--- | :--- |
| **Piscar Lento** | O sistema está à procura de rede Wi-Fi ou perdeu a ligação temporariamente. | Verificar roteador/sinal de rede. |
| **Fixo por 3 segundos** | O sistema acabou de ligar à rede com sucesso. | Nenhuma (indicação de pronto). |
| **Piscar Rápido (Aviso Prévio)** | O sistema avisa que uma porta se vai abrir dentro de 5 segundos. | **Afaste-se da porta imediatamente.** |
| **Aceso Fixo (4s)** | Uma fechadura está neste momento a ser aberta. | Aguardar a conclusão da abertura. |
| **Apagado** | O sistema está ligado e à espera de ordens. | Funcionamento normal em standby. |

---

## 3. O Painel de Controlo Web (Dashboard)
Para controlar as baias, basta aceder à página web do EquiLock. O design foi pensado para ser limpo e organizado.

### 3.1. Status de Conexão
No topo da página (e no menu de Controlo Manual), verá a indicação do Status do Sistema:
* 🟢 **Online:** O painel web e o armário físico estão a comunicar perfeitamente. Pode enviar ordens.
* 🔴 **Offline:** O armário físico está sem energia ou sem internet.
  > [!WARNING]
  > Se o sistema estiver **Offline**, o painel web ficará bloqueado (esmaecido) para evitar que envie comandos que não serão recebidos pelo hardware físico.

### 3.2. Menu de Navegação
No canto superior direito, encontrará um **Ícone de Menu (Hamburger)**. Ao clicar nele, terá acesso às 4 áreas principais do sistema (Modos de Operação).

---

## 4. Modos de Operação (As 4 Abas)

### Aba 1: Controlo Manual
Esta é a vista principal, usada para abrir as portas de forma imediata.
* Verá 4 cartões perfeitamente limpos, representando da **Box 1** à **Box 4**.
* **Como usar:** Clique no botão verde **"Abrir Box"**.
* **O que acontece:** O botão ficará desativado por 4 segundos (para garantir a segurança elétrica) e ouvirá/verá a fechadura física abrir. Este evento fica registado na base de dados para segurança.

### Aba 2: Sequência Diária (Modo Delay)
Ideal para a hora de alimentação ou saída coordenada dos cavalos. O sistema abre a Box 1, aguarda um tempo, abre a Box 2, e assim por diante.
* **Configurar o Tempo:** Existe um campo **"Intervalo (minutos)"**. Digite o tempo de espera desejado entre cada abertura (ex: `5` para 5 minutos) e guarde.
* **Como usar:** Clique no botão verde **"Iniciar Sequência"**.
* **O que acontece:** A Box 1 abre imediatamente. Daí a 5 minutos, o armário dá um aviso visual (LED a piscar rápido por 5 segundos) e abre a Box 2. O processo repete-se sucessivamente até à Box 4.

### Aba 3: Agendamento
Esta secção transforma a cavalariça num sistema 100% autónomo. Cada box abrirá todos os dias a uma hora exata definida por si.
* Verá uma lista com as 4 Boxes.
* **Como usar:** Em cada Box, existe um campo de seleção de hora e minuto. Escolha a hora desejada (ex: `07:30` para o pequeno-almoço) e clique em **"Atualizar"**.
* Ao lado de cada Box, aparecerá uma pequena etiqueta a indicar o horário que o armário tem atualmente guardado na sua memória.
  > [!NOTE]
  > O sistema sincroniza o relógio automaticamente com a Internet (NTP), garantindo pontualidade.

### Aba 4: Histórico & Sistema
A área de supervisão, auditoria e configurações globais.
* **Histórico de Eventos:** Mostra uma lista cronológica das últimas ações. Permite saber, por exemplo, se a *"Box 1"* foi aberta às 08:00, e se foi aberta de forma *"Manual"* por um funcionário ou via *"Agendamento Automático"*.
* **Alternar Modo Principal:** Um interruptor (switch) permite-lhe definir qual o modo autónomo que o armário deve obedecer por defeito: o **Modo Sequência (Delay)** ou o **Modo Agendamento**.

---

## 5. Resiliência: O que acontece se algo falhar?
O EquiLock foi desenhado para ser extremamente seguro e não bloquear em caso de anomalias:

* **Corte de Energia:** Se a eletricidade falhar, as fechaduras mantêm-se trancadas mecanicamente. Quando a energia voltar, o armário retoma instantaneamente as configurações anteriores (pois grava tudo na sua memória EEPROM/Flash interna permanente). O painel web voltará a indicar "Online".
* **Perda de Internet (Wi-Fi):** Se a rede Wi-Fi da cavalariça cair, o painel web vai mostrar "Offline". No entanto, o armário não para de funcionar. Se tiver horários agendados ou uma sequência a decorrer, ele executará essas tarefas de forma autónoma através do seu relógio interno temporário.
* **Toques Duplos (Spam de Cliques):** A interface web e o hardware bloqueiam cliques rápidos repetidos no botão "Abrir", prevenindo sobrecargas no sistema elétrico.

---

## 6. Referência Técnico (Triagem e Diagnóstico)
Esta secção destina-se a técnicos e administradores de sistema para efeitos de diagnóstico. O sistema baseia-se no protocolo **MQTT** para comunicação.

### Tópicos de Comando (Painel Web $\rightarrow$ Armário)
* `armario/comando/manutencao`
  * **Payload:** `"ON"`
  * **Descrição:** Atua as 4 fechaduras simultaneamente (durante 4 segundos).
* `armario/comando/sequencia`
  * **Payload:** `"START"`
  * **Descrição:** Inicia o ciclo do Modo Delay (Sequência Diária).
* `armario/comando/status`
  * **Payload:** `"GET"`
  * **Descrição:** Pede ao armário para forçar o reenvio de toda a sua configuração atual.

### Tópicos de Configuração (Painel Web $\rightarrow$ Armário)
* `armario/config/modo`
  * **Payload:** `"DELAY"` ou `"AGENDA"`
  * **Descrição:** Altera o modo de operação ativo.
* `armario/config/delay`
  * **Payload:** `{"minutos": <inteiro>}` (Ex: `{"minutos": 5}`)
  * **Descrição:** Define o intervalo de tempo da sequência diária.
* `armario/config/agenda`
  * **Payload:** `{"prateleira": <1 a 4>, "hora": <0 a 23>, "minuto": <0 a 59>}`
  * **Descrição:** Define o horário de abertura de uma baia específica.

### Tópicos de Status (Armário $\rightarrow$ Painel Web)
* `armario/status/conexao`
  * **Payload:** `"online"` ou `"offline"`
  * **Descrição:** Gerido por LWT (Last Will and Testament) para indicar o estado de presença do equipamento físico.
* `armario/status/notificacao`
  * **Payload:** Texto simples (ex: `"Sequência concluída. Prateleira 4 aberta."`)
  * **Descrição:** Mensagens de log rápidas de eventos.
* `armario/status/atual`
  * **Payload:** Documento JSON completo.
  * **Descrição:** Enviado sempre que a configuração é alterada, garantindo a sincronização do painel web.
  * **Exemplo de Payload:**
    ```json
    {
      "modo": "DELAY",
      "delay_minutos": 5,
      "prateleira_no_momento": 0,
      "sequencia_ativa": false,
      "agenda": [
        {"prateleira": 1, "hora": 14, "minuto": 30, "ativo": true},
        {"prateleira": 2, "hora": 18, "minuto": 0, "ativo": true},
        {"prateleira": 3, "hora": -1, "minuto": -1, "ativo": false},
        {"prateleira": 4, "hora": -1, "minuto": -1, "ativo": false}
      ]
    }
    ```
