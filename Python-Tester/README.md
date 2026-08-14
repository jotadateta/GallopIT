# GallopIT - Python MQTT Tester & Validador de Hardware

Este utilitário Python permite monitorizar em tempo real todas as mensagens do sistema **GallopIT** e executar testes interativos de validação do equipamento físico (ESP32, relés de 4s, anúncios de descoberta e setup seguro).

---

## 🚀 Como Executar

### 1. Instalar as Dependências (apenas se necessário)
```bash
pip install paho-mqtt
```

### 2. Executar o Tester
No terminal (PowerShell ou CMD), navegue até à pasta e execute:

```bash
python gallopit_tester.py
```

---

## 🛠️ Funcionalidades do Tester

1. **Monitorização em Tempo Real (`gallopit/#`):**
   * Exibe mensagens com cores formatadas no terminal (Anúncios de Descoberta, Notificações de Presença LWT, Estado das Boxes e Eventos de Abertura).

2. **Menu Interativo por Teclas:**
   * **`1`** — **Setup Seguro:** Envia a `secret_key` para provisionar o MAC da ESP32.
   * **`2` a `5`** — **Abrir Boxes 1 a 4:** Envia o comando para atuar os relés individuais por 4 segundos.
   * **`6`** — **Abrir Todas as Boxes:** Ativa os 4 relés em simultâneo.
   * **`7`** — **Pedir Estado Atual:** Solicita à ESP32 a publicação do JSON completo em `status/state`.
   * **`8`** — **Alternar Modo:** Altera entre modo `DELAY` e `AGENDA`.
