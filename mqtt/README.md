# Configurações do Broker MQTT do EquiLock

Esta pasta contém especificações, esquemas JSON e guias para a configuração do broker MQTT que servirá de ponte de comunicação entre o painel de controlo web e o armário de hardware físico.

## Brokers Recomendados
* **Mosquitto** (Altamente personalizável e leve, ideal para Raspberry Pi ou servidores dedicados).
* **HiveMQ** ou **EMQX** (Excelentes para soluções baseadas na cloud).

## Configuração Necessária
Para permitir a comunicação do dashboard web diretamente com o broker a partir do browser, o broker MQTT **deve ter suporte a WebSockets ativo**.

### Exemplo de configuração Mosquitto (`mosquitto.conf`):
```ini
# Ligação padrão MQTT (Porta 1883)
listener 1883
allow_anonymous true

# Ligação WebSockets para o Dashboard (Porta 9001)
listener 9001
protocol websockets
allow_anonymous true
```

## Estrutura de Tópicos
Consulte a secção **Referência Técnica** no [Manual do Utilizador](../docs/manual_utilizador.md) para verificar a lista de tópicos e payloads esperados pelo sistema.
