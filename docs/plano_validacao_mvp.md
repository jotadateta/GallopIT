# EquiLock: Plano de Validação do MVP e Preparação para Investidores
**Versão 1.0 - Estudo de Viabilidade Técnica e Comercial**

---

## 1. Visão Geral do Protótipo (MVP Atual)

O protótipo atual do **EquiLock** foi desenvolvido para provar o conceito funcional de automação de baias (boxes) em cavalariças, combinando acessibilidade de fabrico, custo reduzido e segurança operacional.

### Especificações do MVP Atual:
* **Estrutura Mecânica:** Perfis técnicos de alumínio 2020 (leves, modulares e ideais para montagem rápida).
* **Atuadores:** Trincos/atuadores lineares de 12V instalados **no exterior da box** (protegidos do acesso direto do cavalo).
* **Segurança Passiva:** Todos os trincos possuem mecanismo físico de abertura manual de emergência (operação humana em caso de corte elétrico).
* **Núcleo IoT:** Microcontrolador **ESP32** com comunicação Wi-Fi e protocolo **MQTT**.
* **Controlo de Potência:** Módulo de relés de 4 canais.
* **Sensores:** Trincos com sensores de posição integrados (atualmente desconectados para simplificação de cablagem nesta fase de MVP).

---

## 2. Matriz de Avaliação do MVP: O que funciona vs. O que falta para Produto

| Componente / Área | Estado no MVP Atual | Requisito para Versão Comercial (V2) | Impacto para Investidores |
| :--- | :--- | :--- | :--- |
| **Instalação Externa** | Requer pequeno recorte/adaptação na porta exterior da box. | Kit de montagem universal (*plug-and-play*) adaptável a 95% das baias padrão. | **Elevado:** Reduz tempo e custo de instalação por box. |
| **Estrutura (Perfis 2020)** | Excelente para validação de bancada/protótipo. | Caixa estanque (IP65) em aço inox / chapa dobrada ou ABS reforçado. | **Elevado:** Transmite imagem de produto industrial e profissional. |
| **Atuação (Relés + Solenoide)** | Módulo de relés genérico com pulso de 4s. | PCB dedicada com MOSFETs/drivers de estado sólido e optoacopladores. | **Médio:** Aumenta a vida útil (sem desgaste mecânico de relés) e reduz ruído. |
| **Comunicação (Wi-Fi)** | Wi-Fi direto do ESP32 ao Broker MQTT. | Wi-Fi + opção LoRaWAN / GSM ou rede ESP-NOW/Mesh. | **Elevado:** Cavalariças frequentemente têm péssima cobertura Wi-Fi nos estábulos. |
| **Sensores de Porta** | Não ligados no MVP (simplificação). | Conectados e lidos pelo firmware para confirmar fecho/abertura efetivos. | **Crítico:** Garante auditoria real (saber se a porta abriu mesmo ou se ficou encravada). |

---

## 3. Roteiro de Validação do MVP (Bateria de Testes em Bancada e Campo)

Antes de demonstrar o protótipo a investidores ou potenciais clientes piloto, o MVP deve passar por 4 testes de validação:

### Teste 1: Ensaio de Ciclos e Aquecimento (Fadiga)
* **Objetivo:** Garantir que o impulso de 4 segundos não sobreaquece o solenoide nem encrava o atuador.
* **Procedimento:** Executar 200 ciclos seguidos de abertura (com intervalo de 10s entre acionamentos) registando a temperatura do atuador 12V.
* **Critério de Sucesso:** Temperatura < 55°C e 0 falhas mecânicas.

### Teste 2: Resiliência de Falha de Rede (Modo Autónomo)
* **Objetivo:** Provar que se a internet/Wi-Fi cair, os cavalos continuam a ser alimentados/libertados no horário agendado.
* **Procedimento:** Simular a perda do sinal Wi-Fi após configurar a agenda no ESP32.
* **Critério de Sucesso:** O RTC/Timer do ESP32 abre as boxes no minuto exato e guarda o histórico na EEPROM/Flash para sincronizar quando a rede voltar.

### Teste 3: Simulação de Corte de Energia & Abertura Manual
* **Objetivo:** Validar a facilidade de acionamento manual por parte de um tratador.
* **Procedimento:** Desligar a alimentação de 12V e testar a abertura manual do trinco de fora da box.
* **Critério de Sucesso:** Abertura sem ferramenta especializada em menos de 3 segundos por porta.

### Teste 4: Resistência a Vibração e Poeira
* **Objetivo:** Verificar a estabilidade das conexões nos perfis 2020 e fios do ESP32.
* **Procedimento:** Submeter o módulo a ambiente de poeira moderada e pequenos choques mecânicos simulados.
* **Critério de Sucesso:** Ausência de maus contactos nos relés ou desconexão de jumpers.

---

## 4. Estrutura do Pitch & Apresentação a Investidores / Clientes

Quando apresentar o EquiLock a investidores ou donos de centros hípicos, a narrativa deve focar no **problema de negócio** e não apenas na eletrónica:

```text
[PROBLEMA]
* Mão-de-obra cara e escassa para alimentação/libertação matinal de cavalos (horários 06:00h / 07:00h).
* Falha humana em horários de medicação ou rotinas estritas de treino.
* Falta de registo/auditoria de quem abriu e a que horas.

[SOLUÇÃO EQUILOCK]
* Sistema IoT automatizado de baixo custo com tripla camada de segurança (Pulso de 4s, Abertura Manual e Operação Offline).
* Instalação externa não-invasiva para a segurança do animal.
* Dashboard web intuitivo para o gerente da cavalariça e tratadores.

[OPORTUNIDADE / ROI]
* Um centro hípico médio com 20 baias poupa ~1.5 a 2 horas/dia de trabalho manual.
* Retorno do investimento (ROI) para a cavalariça estimado em menos de 8 a 12 meses.
```

---

## 5. Estimativa de Custos: MVP vs. Versão de Produção (V2)

| Item | Custo MVP (Unidade 4 Boxes) | Custo V2 Escala (100 Unidades) |
| :--- | :--- | :--- |
| **Estrutura Física** | ~40€ (Perfis Alumínio 2020 + cantoneiras) | ~25€ (Caixa metálica/ABS personalizada) |
| **Atuadores (4x)** | ~60€ (Trincos 12V mercado geral) | ~35€ (AtuadoresOEM com desconto de lote) |
| **Eletrónica de Controlo** | ~15€ (ESP32 DevKit + Módulo 4 Relés) | ~12€ (PCB customizada SMDs + ESP32-WROOM) |
| **Alimentação & Cabos** | ~20€ (Fonte 12V 5A + cablagem) | ~15€ (Fonte com carregador de bateria integrado) |
| **Custo Total de Material (BOM)**| **~135€ / unidade (4 boxes)** | **~87€ / unidade (4 boxes)** |
| **Preço Estimado de Venda** | N/A (Protótipo) | **350€ - 450€ / unidade** (Margem > 70%) |

---

## 6. Próximos Passos Recomendados

1. **Finalizar a Demonstração Visual (Demo Mode):** Ter o Dashboard Web a comunicar em tempo real com o ESP32 num painel de exibição limpo (sem fios à vista).
2. **Gravar um Vídeo de Demonstração (30-45s):** Mostrar no dashboard o clique no botão "Abrir Box 1" e o atuador linear no perfil de alumínio a retrair imediatamente.
3. **Agendar Teste Piloto Real:** Instalar a unidade numa cavalariça parceira por 2 semanas para recolher testemunhos e feedback de tratadores reais.
