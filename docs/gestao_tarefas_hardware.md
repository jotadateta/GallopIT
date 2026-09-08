# 📋 GallopIT: Gestão de Tarefas e Resolução Mecânica / Hardware (MVP)

> **Documento de Controlo Operacional e Melhorias Físicas**  
> Registo, diagnóstico de causas, alternativas de solução, checklist de execução e critérios de validação para as pendências mecânicas do armário GallopIT.

---

## 📌 Resumo Executivo das Pendências

| ID | Área | Problema Identificado | Severidade | Impacto no Funcionamento | Status |
| :---: | :---: | :--- | :---: | :--- | :---: |
| **MEC-01** | Portas / Estrutura | Porta interior com atrito e colisões de fecho/abertura | 🔴 Alta | Pode bloquear o destrancamento do solenoide ou impedir o fecho completo | ⏳ A Fazer |
| **MEC-02** | Layout / Elétrica | Rampa de queda interfere fisicamente com a caixa elétrica | 🔴 Alta | Risco de impacto mecânico com cablagem e componentes de 12V/230V | ⏳ A Fazer |
| **MEC-03** | Acústica / Impacto | Batimento metálico ruidoso nas costas das gavetas ao abrir | 🟡 Média | Stress auditivo nos cavalos na cavalariça e desgaste prematuro de materiais | ⏳ A Fazer |

---

## 🛠️ Detalhe Técnico e Soluções Propostas

---

### 1. [MEC-01] Porta com Colisões por ser Interior (Embutida)

#### 🔍 Diagnóstico:
* As portas montadas no interior do vão (portas faceadas ou embutidas) exigem folgas milimétricas perfeitas em todos os 4 lados. Qualquer mínima torção da chapa, empeno da madeira/perfil ou folga nas dobradiças faz com que as extremidades raspem no caixilho.
* **Agravante no GallopIT:** Se a porta raspar no caixilho, a força da mola/gravidade pode não ser suficiente para empurrá-la para fora após o pulso do solenoide, fazendo a abertura falhar.

#### 💡 Soluções Possíveis:
1. **Solução A (Recomendada - Porta Sobreposta / Face Externa):**
   * Mudar a porta para montagem **sobreposta** (a porta bate por fora do batente em vez de entrar para dentro).
   * Elimina em 100% o atrito lateral e superior, permitindo folgas amplas sem comprometer a vedação.
2. **Solução B (Ajuste das Dobradiças Atuais):**
   * Se for indispensável manter a porta interior: substituir por dobradiças com regulação em 3 eixos (3D) ou aplicar chanfro de $2\text{ a }3\,\text{mm}$ nos topos da porta para aumentar a folga de alívio.

#### 📝 Checklist de Execução:
- [ ] Avaliar viabilidade de converter para dobradiça externa / porta sobreposta exterior.
- [ ] Medir as folgas atuais em carga (com ração nas gavetas).
- [ ] Reajustar furação ou instalar espaçadores nas dobradiças.
- [ ] Testar ciclo de 10 aberturas consecutivas sem atrito nem raspagem.

---

### 2. [MEC-02] Colisão da Rampa de Queda com a Caixa Elétrica

#### 🔍 Diagnóstico:
* O ângulo da rampa de descarga de alimento invade a cota de profundidade reservada para a caixa estanque elétrica (ESP32, placa de relés, fonte 12V, bornes).
* Vibrações contínuas da queda de alimento sobre a caixa elétrica podem afrouxar parafusos de bornes e bornes de relé, além do risco de acumulação de poeiras/farelo sobre as conexões elétricas.

#### 💡 Soluções Possíveis:
1. **Solução A (Relocação da Caixa Elétrica - Recomendada):**
   * Mover a caixa elétrica para uma das paredes laterais exteriores do armário ou para o topo (painel superior), longe da trajetória da ração.
2. **Solução B (Redefinição do Ângulo da Rampa / Defletor Protetor):**
   * Se a caixa tiver de ficar no fundo, instalar uma chapa deflectora a $45^\circ$ por cima da caixa, canalizando o alimento para a frente e criando uma barreira física de proteção estanque.
3. **Solução C (Caixa Elétrica com Perfil Slim):**
   * Substituir a caixa funda por um invólucro mais raso (slim) montado numa reentrância exterior.

#### 📝 Checklist de Execução:
- [ ] Marcar visualmente a trajetória do alimento em queda livre.
- [ ] Definir novo local seguro para a caixa elétrica (fora do canal de descarga).
- [ ] Garantir que os fios das fechaduras solenoides têm comprimento suficiente para o novo traçado.
- [ ] Instalar passa-cabos estanques (bujões PG) na nova posição da caixa.
- [ ] Testar descarga de 3 kg de alimento para confirmar desobstrução total.

---

### 3. [MEC-03] Amortecimento Acústico de Impacto nas Costas das Gavetas

#### 🔍 Diagnóstico:
* No instante do disparo do solenoide, a gaveta destranca sob pressão e atinge o batente final a alta velocidade, gerando um estalido metálico/seco muito alto.
* Cavalos têm audição altamente sensível; barulhos repentinos de batimento assustam o animal e causam fadiga mecânica na estrutura a médio prazo.

#### 💡 Soluções Possíveis:
1. **Borracha EVA de Alta Densidade ou Espuma EPDM Adesiva:**
   * Colar tiras de EVA (espessura de $5\,\text{mm}$ a $10\,\text{mm}$) ou borracha esponjosa no batente traseiro onde a gaveta bate.
2. **Batentes de Silicone / Amortecedores Cónicos de Borracha:**
   * Instalar pequenos batentes cónicos de borracha aparafusados (tipo pés de borracha para caixas acústicas ou móveis) nos cantos de impacto.
3. **Pistões Amortecedores de Móveis / Molas a Gás:**
   * Para uma sensação "premium", adicionar pequenos amortecedores de fim de curso (tipo amortecedor de gaveta de cozinha suave / *soft-close*).

#### 📝 Checklist de Execução:
- [ ] Medir a espessura máxima admissível no batente sem impedir o fecho do solenoide (folga de compressão).
- [ ] Comprar tiras de borracha EPDM autoadesiva ($5\text{ a }8\,\text{mm}$) ou batentes de silicone.
- [ ] Limpar e desengordurar as zonas de contacto antes de colar.
- [ ] Realizar teste acústico: verificar redução drástica dos decibéis no momento do destrancamento.
- [ ] Confirmar que, com o amortecedor comprimido, o solenoide engata e tranca sem esforço.

---

## 🛒 Lista de Materiais / Compras Sugeridas

| Item | Descrição | Quantidade | Finalidade |
| :--- | :--- | :---: | :--- |
| **Borracha EPDM / Neoprene adesiva** | Fita esponjosa $20\text{mm} \times 6\text{mm}$ | 1 rolo ($2\text{m}$) | Amortecimento sonoro nas costas das gavetas |
| **Batentes cónicos de borracha** | Batentes de aparafusar $\varnothing 15\text{mm}$ | 8 unidades | Fim de curso suave nos cantos de impacto |
| **Dobradiças para porta sobreposta** | Dobradiças exteriores ou de piano | 1 conjunto | Eliminar colisões da porta interior |
| **Calha / Fixadores para cablagem** | Abraçadeiras com base adesiva | 1 saco (20 un.) | Organização da nova rota de cabos da caixa |
| **Espaçadores / Suportes angulares** | Cantoneiras de fixação em L | 4 unidades | Suporte para chapa deflectora da rampa |

---

## 📊 Matriz de Prioridade \& Cronograma de Execução

```text
[Prioridade 1 - CRÍTICA]
└── MEC-02: Desviar rampa / reposicionar caixa elétrica
     (Impede danos elétricos e bloqueio de ração)

[Prioridade 2 - ALTA]
└── MEC-01: Corrigir geometria da porta (evitar colisões)
     (Garante abertura e fecho mecânico 100% fiável)

[Prioridade 3 - QUALIDADE]
└── MEC-03: Instalar amortecedores nas costas das gavetas
     (Conforto acústico para os cavalos e durabilidade)
```

---

## 🎯 Critérios de Aceitação Final (Teste de Validação)

Para considerar as tarefas mecânicas concluídas com sucesso, o equipamento deve passar neste teste final:

1. **Ciclo de Carga:** Encher as 4 gavetas com a carga nominal de ração.
2. **Ciclo Sequencial Completo:** Disparar a sequência automática (Box 1 $\rightarrow$ 2 $\rightarrow$ 3 $\rightarrow$ 4).
3. **Validações Obrigatórias:**
   * Nenhuma porta toca ou prende no caixilho durante a rotação.
   * O alimento escorre livremente pela rampa sem tocar em qualquer componente elétrico.
   * O ruído de abertura é abafado (apenas o estalido característico do solenoide de 4s, sem estrondo metálico).
   * Todas as 4 baias voltam a armar suavemente à mão e o solenoide tranca à primeira tentativa.
