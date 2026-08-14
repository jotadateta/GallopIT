/**
 * GallopIT Firmware v2.1 - ESP32
 * Sistema de Cavalariça Inteligente IoT
 * Suporte para Provisionamento Seguro por MQTT & NVS Preferences
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <time.h>
#include "config.h"

// --- Instância de Memória Permanente (NVS Flash) ---
Preferences preferences;

// --- Estados do LED de Sinalização ---
enum LedState {
    LED_STATE_OFF,
    LED_STATE_WIFI_CONNECTING,
    LED_STATE_READY_3S,
    LED_STATE_PRE_WARNING_5S,
    LED_STATE_ACTIVE_4S
};

LedState currentLedState = LED_STATE_OFF;
unsigned long ledStateTimer = 0;
unsigned long lastLedBlinkTimer = 0;
bool ledToggleState = false;

// --- Estrutura de Agendamento por Box ---
struct BoxSchedule {
    int hora = -1;
    int minuto = -1;
    bool ativo = false;
    bool abertaHoje = false;
};

BoxSchedule boxAgenda[4];

// --- Variáveis de Configuração Dinâmica (NVS) ---
String clientId = DEFAULT_CLIENT_ID;
String machineId = DEFAULT_MACHINE_ID;
String macAddressClean = "";
bool isProvisioned = false;

// --- Variáveis Globais de Estado ---
String modoAtivo = "DELAY"; // "DELAY" ou "AGENDA"
int intervaloDelayMinutos = 5;
bool sequenciaEmExecucao = false;
int boxAtualSequencia = 0;
unsigned long proximaAberturaSequenciaMs = 0;

// Temporizadores de relé (4s por box)
unsigned long relayStopTimes[4] = {0, 0, 0, 0};

// Clientes Wi-Fi e MQTT
WiFiClient espClient;
PubSubClient client(espClient);

// Tópicos MQTT dinâmicos
String topicSetupConfig;
String topicSetupStatus;
String topicCmd;
String topicStatusPresence;
String topicStatusState;
String topicStatusEvent;

// Protótipos de funções
void loadStoredPreferences();
void saveStoredPreferences();
void setupMQTTTopics();
bool connectToWiFi();
void reconnectMQTT();
void publishFullState();
void publishEvent(String evento, int boxNum, String origem, String msg);
void triggerBoxOpen(int boxIndex, String origem);
void handleLedStateMachine();
void processSequenceLogic();
void processAgendaLogic();
void processProvisioningConfig(StaticJsonDocument<512>& doc);
void mqttCallback(char* topic, byte* payload, unsigned int length);

void loadStoredPreferences() {
    preferences.begin("gallopit", false);
    clientId = preferences.getString("client_id", DEFAULT_CLIENT_ID);
    machineId = preferences.getString("machine_id", DEFAULT_MACHINE_ID);
    isProvisioned = preferences.getBool("provisioned", false);
    modoAtivo = preferences.getString("modo", "DELAY");
    intervaloDelayMinutos = preferences.getInt("delay_min", 5);
    preferences.end();

    Serial.println(F("[NVS] Configurações carregadas da memória permanente:"));
    Serial.print(F(" - Client ID: ")); Serial.println(clientId);
    Serial.print(F(" - Machine ID: ")); Serial.println(machineId);
    Serial.print(F(" - Provisionado: ")); Serial.println(isProvisioned ? "SIM" : "NAO (Aguardando Setup)");
}

void saveStoredPreferences() {
    preferences.begin("gallopit", false);
    preferences.putString("client_id", clientId);
    preferences.putString("machine_id", machineId);
    preferences.setBool("provisioned", isProvisioned);
    preferences.putString("modo", modoAtivo);
    preferences.putInt("delay_min", intervaloDelayMinutos);
    preferences.end();
    Serial.println(F("[NVS] Configurações guardadas na memória flash com sucesso."));
}

void setupMQTTTopics() {
    // Obter MAC Address limpo
    String mac = WiFi.macAddress();
    mac.replace(":", "");
    macAddressClean = mac;

    // Tópico de Setup Inicial Seguro
    topicSetupConfig = String(SYSTEM_PREFIX) + "/setup/" + macAddressClean + "/config";
    topicSetupStatus = String(SYSTEM_PREFIX) + "/setup/" + macAddressClean + "/status";

    // Tópicos Operacionais Dinâmicos
    String base = String(SYSTEM_PREFIX) + "/" + clientId + "/" + machineId;
    topicCmd = base + "/cmd/#";
    topicStatusPresence = base + "/status/presence";
    topicStatusState = base + "/status/state";
    topicStatusEvent = base + "/status/event";
}

bool connectToWiFi() {
    Serial.println(F("[WiFi] A procurar redes guardadas..."));
    WiFi.mode(WIFI_STA);
    currentLedState = LED_STATE_WIFI_CONNECTING;

    for (int i = 0; i < NUM_REDES; i++) {
        Serial.print(F("[WiFi] Tentativa em: "));
        Serial.println(REDES[i].ssid);

        WiFi.begin(REDES[i].ssid, REDES[i].password);

        int retries = 50; // 5 segundos
        while (WiFi.status() != WL_CONNECTED && retries > 0) {
            handleLedStateMachine();
            delay(100);
            retries--;
        }

        if (WiFi.status() == WL_CONNECTED) {
            Serial.println(F("[WiFi] Conetado com sucesso!"));
            Serial.print(F("[WiFi] Endereço IP: ")); Serial.println(WiFi.localIP());
            Serial.print(F("[WiFi] MAC Address: ")); Serial.println(WiFi.macAddress());

            configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
            return true;
        }
        WiFi.disconnect();
    }

    Serial.println(F("[WiFi] Falha ao conetar a todas as redes."));
    currentLedState = LED_STATE_OFF;
    return false;
}

void reconnectMQTT() {
    while (!client.connected() && WiFi.status() == WL_CONNECTED) {
        Serial.print(F("[MQTT] Conetando ao Broker: "));
        Serial.println(DEFAULT_MQTT_SERVER);

        String clientMqttId = "GallopIT-ESP32-" + macAddressClean;

        if (client.connect(clientMqttId.c_str(), topicStatusPresence.c_str(), 1, true, "offline")) {
            Serial.println(F("[MQTT] Ligado com sucesso!"));

            // Publica presenca online
            client.publish(topicStatusPresence.c_str(), "online", true);

            // Subscreve SEMPRE ao tópico de Setup Seguro (para permitir reconfiguração)
            client.subscribe(topicSetupConfig.c_str());
            Serial.print(F("[MQTT] Subscrito em Setup Seguro: "));
            Serial.println(topicSetupConfig);

            // Subscreve aos tópicos de comando operacionais
            client.subscribe(topicCmd.c_str());
            Serial.print(F("[MQTT] Subscrito em Comandos Operacionais: "));
            Serial.println(topicCmd);

            currentLedState = LED_STATE_READY_3S;
            ledStateTimer = millis() + 3000;

            publishFullState();
        } else {
            Serial.print(F("[MQTT] Erro rc="));
            Serial.print(client.state());
            Serial.println(F(". Tentando em 5s..."));
            delay(5000);
        }
    }
}

void publishFullState() {
    StaticJsonDocument<512> doc;
    doc["system"] = SYSTEM_PREFIX;
    doc["client_id"] = clientId;
    doc["machine_id"] = machineId;
    doc["mac_address"] = WiFi.macAddress();
    doc["provisioned"] = isProvisioned;
    doc["modo_ativo"] = modoAtivo;
    doc["intervalo_minutos"] = intervaloDelayMinutos;
    doc["sequencia_em_execucao"] = sequenciaEmExecucao;
    doc["firmware"] = "2.1.0-ESP32";
    doc["wifi_rssi"] = WiFi.RSSI();

    JsonArray boxesArr = doc.createNestedArray("boxes");
    for (int i = 0; i < 4; i++) {
        JsonObject b = boxesArr.createNestedObject();
        b["box"] = i + 1;
        b["hora"] = boxAgenda[i].hora;
        b["minuto"] = boxAgenda[i].minuto;
        b["ativo"] = boxAgenda[i].ativo;
        b["status"] = (relayStopTimes[i] > 0) ? "ABERTA" : "FECHADA";
    }

    String output;
    serializeJson(doc, output);
    client.publish(topicStatusState.c_str(), output.c_str(), true);
}

void publishEvent(String evento, int boxNum, String origem, String msg) {
    StaticJsonDocument<256> doc;
    doc["evento"] = evento;
    doc["box"] = boxNum;
    doc["origem"] = origem;
    doc["mensagem"] = msg;
    doc["timestamp"] = millis();

    String output;
    serializeJson(doc, output);
    client.publish(topicStatusEvent.c_str(), output.c_str());
}

void processProvisioningConfig(StaticJsonDocument<512>& doc) {
    // 1. Verificação de Segurança OBRIGATÓRIA da Secret Key
    if (!doc.containsKey("secret_key")) {
        Serial.println(F("[SECURITY WARNING] Tentativa de Setup rejeitada: Sem secret_key."));
        client.publish(topicSetupStatus.c_str(), "{\"status\":\"REJECTED_MISSING_KEY\"}");
        return;
    }

    String receivedSecret = doc["secret_key"].as<String>();
    if (receivedSecret != String(PROVISIONING_SECRET)) {
        Serial.println(F("[SECURITY WARNING] Tentativa de Setup REJEITADA: Secret Key incorreta!"));
        client.publish(topicSetupStatus.c_str(), "{\"status\":\"REJECTED_INVALID_SECRET\"}");
        return;
    }

    // 2. Atualização segura de configurações
    Serial.println(F("[SETUP] Autenticação com Secret Key bem-sucedida!"));

    if (doc.containsKey("client_id")) clientId = doc["client_id"].as<String>();
    if (doc.containsKey("machine_id")) machineId = doc["machine_id"].as<String>();

    isProvisioned = true;
    saveStoredPreferences();

    // Reconfigura os tópicos operacionais dinâmicos
    setupMQTTTopics();
    client.subscribe(topicCmd.c_str());

    StaticJsonDocument<256> resDoc;
    resDoc["status"] = "PROVISIONED_SUCCESS";
    resDoc["client_id"] = clientId;
    resDoc["machine_id"] = machineId;
    resDoc["mac_address"] = WiFi.macAddress();
    String resStr;
    serializeJson(resDoc, resStr);

    client.publish(topicSetupStatus.c_str(), resStr.c_str());
    publishFullState();

    Serial.println(F("[SETUP] Provisionamento concluído com sucesso e gravado na NVS!"));
}

void triggerBoxOpen(int boxIndex, String origem) {
    if (boxIndex < 0 || boxIndex >= 4) return;

    Serial.print(F("[SOLENOIDE] Ativando Box "));
    Serial.print(boxIndex + 1);
    Serial.println(F(" por 4 segundos."));

    digitalWrite(RELAY_PINS[boxIndex], HIGH);
    relayStopTimes[boxIndex] = millis() + SOLENOID_PULSE_MS;

    currentLedState = LED_STATE_ACTIVE_4S;
    ledStateTimer = millis() + SOLENOID_PULSE_MS;

    publishEvent("BOX_OPENED", boxIndex + 1, origem, "Fechadura ativada por 4 segundos.");
    publishFullState();
}

void handleLedStateMachine() {
    unsigned long now = millis();

    switch (currentLedState) {
        case LED_STATE_OFF:
            digitalWrite(LED_STATUS_PIN, LOW);
            break;

        case LED_STATE_WIFI_CONNECTING:
            if (now - lastLedBlinkTimer >= 500) {
                lastLedBlinkTimer = now;
                ledToggleState = !ledToggleState;
                digitalWrite(LED_STATUS_PIN, ledToggleState ? HIGH : LOW);
            }
            break;

        case LED_STATE_READY_3S:
            digitalWrite(LED_STATUS_PIN, HIGH);
            if (now >= ledStateTimer) currentLedState = LED_STATE_OFF;
            break;

        case LED_STATE_PRE_WARNING_5S:
            if (now - lastLedBlinkTimer >= 100) {
                lastLedBlinkTimer = now;
                ledToggleState = !ledToggleState;
                digitalWrite(LED_STATUS_PIN, ledToggleState ? HIGH : LOW);
            }
            if (now >= ledStateTimer) currentLedState = LED_STATE_OFF;
            break;

        case LED_STATE_ACTIVE_4S:
            digitalWrite(LED_STATUS_PIN, HIGH);
            if (now >= ledStateTimer) currentLedState = LED_STATE_OFF;
            break;
    }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    payload[length] = '\0';
    String message = (char*)payload;
    String topicStr = String(topic);

    Serial.print(F("[MQTT] Recebido em [")); Serial.print(topicStr); Serial.print(F("]: ")); Serial.println(message);

    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, message);

    // 1. Verificação de Mensagem no Tópico de Setup Inicial Seguro
    if (topicStr == topicSetupConfig) {
        if (!error) processProvisioningConfig(doc);
        return;
    }

    // 2. Comandos Operacionais Padrão
    if (topicStr.endsWith("/cmd/open")) {
        if (!error && doc.containsKey("box")) {
            if (doc["box"].is<const char*>() && String(doc["box"].as<const char*>()) == "all") {
                for (int b = 0; b < 4; b++) triggerBoxOpen(b, "MANUAL_ALL");
            } else {
                int b = doc["box"].as<int>() - 1;
                triggerBoxOpen(b, "MANUAL");
            }
        }
    } else if (topicStr.endsWith("/cmd/mode")) {
        if (!error) {
            if (doc.containsKey("modo")) modoAtivo = doc["modo"].as<String>();
            if (doc.containsKey("intervalo_minutos")) intervaloDelayMinutos = doc["intervalo_minutos"].as<int>();
            saveStoredPreferences();
            publishFullState();
        }
    } else if (topicStr.endsWith("/cmd/schedule")) {
        if (!error && doc.containsKey("box")) {
            int b = doc["box"].as<int>() - 1;
            if (b >= 0 && b < 4) {
                if (doc.containsKey("hora")) boxAgenda[b].hora = doc["hora"].as<int>();
                if (doc.containsKey("minuto")) boxAgenda[b].minuto = doc["minuto"].as<int>();
                if (doc.containsKey("ativo")) boxAgenda[b].ativo = doc["ativo"].as<bool>();
                publishFullState();
            }
        }
    } else if (topicStr.endsWith("/cmd/sequencia")) {
        if (!error && doc.containsKey("acao")) {
            String acao = doc["acao"].as<String>();
            if (acao == "START") {
                sequenciaEmExecucao = true;
                boxAtualSequencia = 0;
                proximaAberturaSequenciaMs = millis();
                publishEvent("SEQUENCE_STARTED", 0, "DELAY_MODE", "Sequencia diária iniciada.");
            } else if (acao == "STOP") {
                sequenciaEmExecucao = false;
                publishEvent("SEQUENCE_STOPPED", 0, "DELAY_MODE", "Sequencia diária cancelada.");
            }
            publishFullState();
        }
    } else if (topicStr.endsWith("/cmd/status_get")) {
        publishFullState();
    }
}

void processSequenceLogic() {
    if (!sequenciaEmExecucao) return;

    unsigned long now = millis();
    if (now >= proximaAberturaSequenciaMs) {
        if (boxAtualSequencia < 4) {
            triggerBoxOpen(boxAtualSequencia, "SEQUENCIA_AUTOMATICA");
            boxAtualSequencia++;
            if (boxAtualSequencia < 4) {
                proximaAberturaSequenciaMs = now + ((unsigned long)intervaloDelayMinutos * 60000);
            } else {
                sequenciaEmExecucao = false;
                publishEvent("SEQUENCE_COMPLETED", 0, "DELAY_MODE", "Todas as 4 boxes foram abertas.");
                publishFullState();
            }
        }
    }
}

void processAgendaLogic() {
    if (modoAtivo != "AGENDA") return;

    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) return;

    for (int i = 0; i < 4; i++) {
        if (boxAgenda[i].ativo && boxAgenda[i].hora == timeinfo.tm_hour && boxAgenda[i].minuto == timeinfo.tm_min) {
            if (!boxAgenda[i].abertaHoje) {
                triggerBoxOpen(i, "AGENDA_AUTOMATICA");
                boxAgenda[i].abertaHoje = true;
            }
        }
        if (timeinfo.tm_hour == 0 && timeinfo.tm_min == 0) {
            boxAgenda[i].abertaHoje = false;
        }
    }
}

void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println(F("\n=============================================="));
    Serial.println(F(" GallopIT Firmware v2.1 (Setup Seguro NVS)  "));
    Serial.println(F("==============================================\n"));

    pinMode(LED_STATUS_PIN, OUTPUT);
    digitalWrite(LED_STATUS_PIN, LOW);

    for (int i = 0; i < 4; i++) {
        pinMode(RELAY_PINS[i], OUTPUT);
        digitalWrite(RELAY_PINS[i], LOW);
    }

    loadStoredPreferences();
    setupMQTTTopics();

    if (connectToWiFi()) {
        client.setServer(DEFAULT_MQTT_SERVER, DEFAULT_MQTT_PORT);
        client.setCallback(mqttCallback);
        reconnectMQTT();
    }
}

void loop() {
    handleLedStateMachine();

    if (WiFi.status() == WL_CONNECTED) {
        if (!client.connected()) reconnectMQTT();
        client.loop();
    } else {
        connectToWiFi();
    }

    unsigned long now = millis();
    for (int i = 0; i < 4; i++) {
        if (relayStopTimes[i] > 0 && now >= relayStopTimes[i]) {
            digitalWrite(RELAY_PINS[i], LOW);
            relayStopTimes[i] = 0;
            Serial.print(F("[SOLENOIDE] Box ")); Serial.print(i + 1); Serial.println(F(" desligada (4s completos)."));
            publishFullState();
        }
    }

    processSequenceLogic();
    processAgendaLogic();
}
