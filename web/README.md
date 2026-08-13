# Dashboard Web do EquiLock

Esta pasta irá conter o painel de controlo web responsivo do sistema EquiLock.

## Requisitos do Design
* Interface minimalista, moderna e limpa.
* Indicador visível do status da conexão (Online/Offline) no topo.
* Menu hambúrguer no canto superior direito para navegar entre as 4 abas:
  1. **Controlo Manual** (Botões individuais das Boxes 1-4)
  2. **Sequência Diária** (Definição de intervalos em minutos e botão de iniciar)
  3. **Agendamento** (Definição de horas/minutos para cada box e exibição do estado da memória do armário)
  4. **Histórico & Sistema** (Lista cronológica de aberturas e alternância do modo padrão)

## Tecnologias Propostas
* Frontend: HTML5, CSS3, JavaScript (Vanish/ES6 ou framework a definir)
* Comunicação: Ligação via WebSockets ou cliente MQTT over WebSockets para subscrição/publicação direta nos tópicos de controlo.
