/**
 * EquiLock Firmware v2.0 - ESP32
 * Sistema de Cavalariça Inteligente IoT
 * Framework: Arduino (PlatformIO)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "config.h"

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
String topicCmd;
String topicStatusPresence;
String topicStatusState;
String topicStatusEvent;

// Protótipos de funções
void setupMQTTTopics();
bool connectToWiFi();
void reconnectMQTT();
void publishFullState();
void publishEvent(String evento, int boxNum, String origem, String msg);
void triggerBoxOpen(int boxIndex, String origem);
void handleLedStateMachine();
void processSequenceLogic();
void processAgendaLogic();
void mqttCallback(char* topic, byte* payload, unsigned int length);

void setupMQTTTopics() {
    String base = "equilock/" + String(CLIENT_ID) + "/" + String(MACHINE_ID);
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
            Serial.print(F("[WiFi] Endereço IP: "));
            Serial.println(WiFi.localIP());

            // Configura o relógio NTP
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
        Serial.println(MQTT_SERVER);

        String clientId = "EquiLock-ESP32-" + String(MACHINE_ID) + "-" + String(random(0xffff), HEX);

        // Define o Last Will and Testament (LWT)
        if (client.connect(clientId.c_str(), topicStatusPresence.c_str(), 1, true, "offline")) {
            Serial.println(F("[MQTT] Ligado com sucesso!"));

            // Publica status de presenca online (retained)
            client.publish(topicStatusPresence.c_str(), "online", true);

            // Subscreve ao tópico de comandos
            client.subscribe(topicCmd.c_str());
            Serial.print(F("[MQTT] Subscrito em: "));
            Serial.println(topicCmd);

            // Sinal de pronto no LED (3s fixo)
            currentLedState = LED_STATE_READY_3S;
            ledStateTimer = millis() + 3000;

            // Publica estado completo do armário
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
    doc["client_id"] = CLIENT_ID;
    doc["machine_id"] = MACHINE_ID;
    doc["modo_ativo"] = modoAtivo;
    doc["intervalo_minutos"] = intervaloDelayMinutos;
    doc["sequencia_em_execucao"] = sequenciaEmExecucao;
    doc["box_atual_sequencia"] = boxAtualSequencia;
    doc["firmware"] = "2.0.0-ESP32";
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
            // Piscar lento (500ms)
            if (now - lastLedBlinkTimer >= 500) {
                lastLedBlinkTimer = now;
                ledToggleState = !ledToggleState;
                digitalWrite(LED_STATUS_PIN, ledToggleState ? HIGH : LOW);
            }
            break;

        case LED_STATE_READY_3S:
            digitalWrite(LED_STATUS_PIN, HIGH);
            if (now >= ledStateTimer) {
                currentLedState = LED_STATE_OFF;
            }
            break;

        case LED_STATE_PRE_WARNING_5S:
            // Piscar rápido (100ms)
            if (now - lastLedBlinkTimer >= 100) {
                lastLedBlinkTimer = now;
                ledToggleState = !ledToggleState;
                digitalWrite(LED_STATUS_PIN, ledToggleState ? HIGH : LOW);
            }
            if (now >= ledStateTimer) {
                currentLedState = LED_STATE_OFF;
            }
            break;

        case LED_STATE_ACTIVE_4S:
            digitalWrite(LED_STATUS_PIN, HIGH);
            if (now >= ledStateTimer) {
                currentLedState = LED_STATE_OFF;
            }
            break;
    }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    payload[length] = '\0';
    String message = (char*)payload;
    String topicStr = String(topic);

    Serial.print(F("[MQTT] Mensagem em ["));
    Serial.print(topicStr);
    Serial.print(F("]: "));
    Serial.println(message);

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);

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
                publishEvent("SEQUENCE_STARTED", 0, "DELAY_MODE", "Sequencia diaria iniciada.");
            } else if (acao == "STOP") {
                sequenciaEmExecucao = false;
                publishEvent("SEQUENCE_STOPPED", 0, "DELAY_MODE", "Sequencia diaria cancelada.");
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
        // Reseta a flag à meia-noite
        if (timeinfo.tm_hour == 0 && timeinfo.tm_min == 0) {
            boxAgenda[i].abertaHoje = false;
        }
    }
}

void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println(F("\n======================================"));
    Serial.println(F(" EquiLock Firmware v2.0 (PlatformIO)  "));
    Serial.println(F("======================================\n"));

    // Configura pinos dos relés e do LED
    pinMode(LED_STATUS_PIN, OUTPUT);
    digitalWrite(LED_STATUS_PIN, LOW);

    for (int i = 0; i < 4; i++) {
        pinMode(RELAY_PINS[i], OUTPUT);
        digitalWrite(RELAY_PINS[i], LOW);
    }

    setupMQTTTopics();

    if (connectToWiFi()) {
        client.setServer(MQTT_SERVER, MQTT_PORT);
        client.setCallback(mqttCallback);
        reconnectMQTT();
    }
}

void loop() {
    handleLedStateMachine();

    if (WiFi.status() == WL_CONNECTED) {
        if (!client.connected()) {
            reconnectMQTT();
        }
        client.loop();
    } else {
        connectToWiFi();
    }

    // Gestão do tempo de atuação seguro (4 segundos por relé)
    unsigned long now = millis();
    for (int i = 0; i < 4; i++) {
        if (relayStopTimes[i] > 0 && now >= relayStopTimes[i]) {
            digitalWrite(RELAY_PINS[i], LOW);
            relayStopTimes[i] = 0;
            Serial.print(F("[SOLENOIDE] Box "));
            Serial.print(i + 1);
            Serial.println(F(" desligada (4s completos)."));
            publishFullState();
        }
    }

    // Executa lógicas autónomas
    processSequenceLogic();
    processAgendaLogic();
}
