/**
 * GallopIT Firmware v2.1 - ESP32
 * Sistema de Cavalariça Inteligente IoT
 * PlatformIO Build - Compatible with ArduinoJson v7
 */

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <time.h>
#include "config.h"

// --- Instância de Memória Permanente (NVS Flash) ---
Preferences preferences;

// --- WebServer e DNS para o Modo AP Setup Wi-Fi ---
WebServer server(80);
DNSServer dnsServer;
bool isAPMode = false;

// --- Estados do LED de Sinalização ---
enum LedState {
    LED_STATE_OFF,
    LED_STATE_WIFI_CONNECTING,
    LED_STATE_READY_3S,
    LED_STATE_PRE_WARNING_5S,
    LED_STATE_ACTIVE_4S,
    LED_STATE_AP_MODE
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
String wifiSSID = DEFAULT_WIFI_SSID;
String wifiPass = DEFAULT_WIFI_PASS;
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
String topicDiscovery = "gallopit/discovery/announcement";
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
void startAPMode();
void handleAPRoot();
void handleAPSave();
void reconnectMQTT();
void publishDiscoveryAnnouncement();
void publishFullState();
void publishEvent(String evento, int boxNum, String origem, String msg);
void triggerBoxOpen(int boxIndex, String origem);
void handleLedStateMachine();
void processSequenceLogic();
void processAgendaLogic();
void processProvisioningConfig(JsonDocument& doc);
void mqttCallback(char* topic, byte* payload, unsigned int length);

void loadStoredPreferences() {
    preferences.begin("gallopit", false);
    wifiSSID = preferences.getString("wifi_ssid", DEFAULT_WIFI_SSID);
    wifiPass = preferences.getString("wifi_pass", DEFAULT_WIFI_PASS);
    clientId = preferences.getString("client_id", DEFAULT_CLIENT_ID);
    machineId = preferences.getString("machine_id", DEFAULT_MACHINE_ID);
    isProvisioned = preferences.getBool("provisioned", false);
    modoAtivo = preferences.getString("modo", "DELAY");
    intervaloDelayMinutos = preferences.getInt("delay_min", 5);
    preferences.end();

    Serial.println(F("[NVS] Configurações carregadas:"));
    Serial.print(F(" - Wi-Fi SSID: ")); Serial.println(wifiSSID);
    Serial.print(F(" - Client ID: ")); Serial.println(clientId);
    Serial.print(F(" - Machine ID: ")); Serial.println(machineId);
    Serial.print(F(" - Provisionado: ")); Serial.println(isProvisioned ? "SIM" : "NAO");
}

void saveStoredPreferences() {
    preferences.begin("gallopit", false);
    preferences.putString("wifi_ssid", wifiSSID);
    preferences.putString("wifi_pass", wifiPass);
    preferences.putString("client_id", clientId);
    preferences.putString("machine_id", machineId);
    preferences.putBool("provisioned", isProvisioned);
    preferences.putString("modo", modoAtivo);
    preferences.putInt("delay_min", intervaloDelayMinutos);
    preferences.end();
    Serial.println(F("[NVS] Configurações guardadas com sucesso!"));
}

void setupMQTTTopics() {
    String mac = WiFi.macAddress();
    mac.replace(":", "");
    macAddressClean = mac;

    topicSetupConfig = String(SYSTEM_PREFIX) + "/setup/" + macAddressClean + "/config";
    topicSetupStatus = String(SYSTEM_PREFIX) + "/setup/" + macAddressClean + "/status";

    String base = String(SYSTEM_PREFIX) + "/" + clientId + "/" + machineId;
    topicCmd = base + "/cmd/#";
    topicStatusPresence = base + "/status/presence";
    topicStatusState = base + "/status/state";
    topicStatusEvent = base + "/status/event";
}

bool connectToWiFi() {
    Serial.print(F("[WiFi] A tentar conectar a: "));
    Serial.println(wifiSSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(wifiSSID.c_str(), wifiPass.c_str());

    currentLedState = LED_STATE_WIFI_CONNECTING;
    int retries = 60; // 6 segundos

    while (WiFi.status() != WL_CONNECTED && retries > 0) {
        handleLedStateMachine();
        delay(100);
        retries--;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println(F("[WiFi] Conectado com sucesso!"));
        Serial.print(F("[WiFi] Endereço IP: ")); Serial.println(WiFi.localIP());
        Serial.print(F("[WiFi] MAC Address: ")); Serial.println(WiFi.macAddress());

        configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
        isAPMode = false;
        return true;
    }

    Serial.println(F("[WiFi] Falha ao conectar. Iniciando Portal de Setup AP Wi-Fi..."));
    startAPMode();
    return false;
}

void startAPMode() {
    isAPMode = true;
    currentLedState = LED_STATE_AP_MODE;

    String apName = String(AP_SETUP_SSID_PREFIX) + macAddressClean;
    WiFi.mode(WIFI_AP);
    WiFi.softAP(apName.c_str(), AP_SETUP_PASS);

    IPAddress apIP(192, 168, 4, 1);
    WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));

    dnsServer.start(53, "*", apIP);

    server.on("/", HTTP_GET, handleAPRoot);
    server.on("/save", HTTP_POST, handleAPSave);
    server.onNotFound(handleAPRoot);
    server.begin();

    Serial.println(F("[AP SETUP] Portal Wi-Fi ativo!"));
    Serial.print(F(" Redes Wi-Fi criadas: ")); Serial.println(apName);
    Serial.print(F(" Palavra-passe do AP: ")); Serial.println(AP_SETUP_PASS);
    Serial.println(F(" Aceda a http://192.168.4.1 no seu smartphone para configurar o Wi-Fi."));
}

void handleAPRoot() {
    String html = "<html><head><meta name='viewport' content='width=device-width, initial-scale=1'>"
                  "<style>body{font-family:Arial;background:#f4f6f9;padding:20px;color:#333}"
                  ".card{background:#fff;border-radius:12px;padding:24px;max-width:400px;margin:auto;box-shadow:0 4px 12px rgba(0,0,0,0.1)}"
                  "h2{color:#2d3748;margin-top:0}input{width:100%;padding:12px;margin:8px 0 16px;border:1px solid #ccc;border-radius:6px;box-sizing:border-box}"
                  "button{width:100%;background:#10b981;color:#fff;padding:12px;border:none;border-radius:6px;font-size:16px;font-weight:bold;cursor:pointer}"
                  "</style></head><body><div class='card'>"
                  "<h2>GallopIT - Setup Wi-Fi</h2>"
                  "<form action='/save' method='POST'>"
                  "<label>Nome da Rede Wi-Fi (SSID):</label>"
                  "<input type='text' name='ssid' value='" + wifiSSID + "' required>"
                  "<label>Palavra-passe do Wi-Fi:</label>"
                  "<input type='password' name='pass' value='" + wifiPass + "'>"
                  "<label>Chave Secreta de Auth (Secret Key):</label>"
                  "<input type='password' name='secret' value=''>"
                  "<label>ID do Cliente (Opcional):</label>"
                  "<input type='text' name='client' value='" + clientId + "'>"
                  "<label>ID da Máquina (Opcional):</label>"
                  "<input type='text' name='machine' value='" + machineId + "'>"
                  "<button type='submit'>Guardar e Reiniciar</button>"
                  "</form></div></body></html>";

    server.send(200, "text/html", html);
}

void handleAPSave() {
    if (server.hasArg("ssid")) wifiSSID = server.arg("ssid");
    if (server.hasArg("pass")) wifiPass = server.arg("pass");
    if (server.hasArg("client") && server.arg("client").length() > 0) clientId = server.arg("client");
    if (server.hasArg("machine") && server.arg("machine").length() > 0) machineId = server.arg("machine");

    if (server.hasArg("secret") && server.arg("secret") == String(PROVISIONING_SECRET)) {
        isProvisioned = true;
    }

    saveStoredPreferences();

    String html = "<html><body style='font-family:Arial;text-align:center;padding:40px'>"
                  "<h2>Configurações Guardadas!</h2>"
                  "<p>A ESP32 vai reiniciar e conectar-se à rede Wi-Fi configurada.</p>"
                  "</body></html>";
    server.send(200, "text/html", html);

    delay(2000);
    ESP.restart();
}

void publishDiscoveryAnnouncement() {
    JsonDocument doc;
    doc["evento"] = "NEW_DEVICE_ONLINE";
    doc["mac_address"] = WiFi.macAddress();
    doc["mac_clean"] = macAddressClean;
    doc["setup_topic"] = topicSetupConfig;
    doc["provisioned"] = isProvisioned;
    doc["firmware"] = "2.1.0-ESP32";

    String output;
    serializeJson(doc, output);
    client.publish(topicDiscovery.c_str(), output.c_str());
    Serial.println(F("[DISCOVERY] Anúncio enviado para gallopit/discovery/announcement!"));
}

void reconnectMQTT() {
    while (!client.connected() && WiFi.status() == WL_CONNECTED) {
        Serial.print(F("[MQTT] Conetando ao Broker: "));
        Serial.println(DEFAULT_MQTT_SERVER);

        String clientMqttId = "GallopIT-ESP32-" + macAddressClean;

        if (client.connect(clientMqttId.c_str(), topicStatusPresence.c_str(), 1, true, "offline")) {
            Serial.println(F("[MQTT] Ligado com sucesso!"));

            client.publish(topicStatusPresence.c_str(), "online", true);
            client.subscribe(topicSetupConfig.c_str());
            client.subscribe(topicCmd.c_str());

            currentLedState = LED_STATE_READY_3S;
            ledStateTimer = millis() + 3000;

            if (!isProvisioned) {
                publishDiscoveryAnnouncement();
            }

            publishFullState();
        } else {
            Serial.print(F("[MQTT] Erro rc=")); Serial.print(client.state());
            Serial.println(F(". Tentando em 5s..."));
            delay(5000);
        }
    }
}

void publishFullState() {
    JsonDocument doc;
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

    JsonArray boxesArr = doc["boxes"].to<JsonArray>();
    for (int i = 0; i < 4; i++) {
        JsonObject b = boxesArr.add<JsonObject>();
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
    JsonDocument doc;
    doc["evento"] = evento;
    doc["box"] = boxNum;
    doc["origem"] = origem;
    doc["mensagem"] = msg;
    doc["timestamp"] = millis();

    String output;
    serializeJson(doc, output);
    client.publish(topicStatusEvent.c_str(), output.c_str());
}

void processProvisioningConfig(JsonDocument& doc) {
    if (!doc["secret_key"].is<const char*>() && !doc["secret_key"].is<String>()) {
        Serial.println(F("[SECURITY WARNING] Setup rejeitado: Sem secret_key."));
        client.publish(topicSetupStatus.c_str(), "{\"status\":\"REJECTED_MISSING_KEY\"}");
        return;
    }

    String receivedSecret = doc["secret_key"].as<String>();
    if (receivedSecret != String(PROVISIONING_SECRET)) {
        Serial.println(F("[SECURITY WARNING] Setup REJEITADO: Secret Key incorreta!"));
        client.publish(topicSetupStatus.c_str(), "{\"status\":\"REJECTED_INVALID_SECRET\"}");
        return;
    }

    Serial.println(F("[SETUP] Autenticação com Secret Key bem-sucedida!"));

    if (doc["wifi_ssid"].is<const char*>() || doc["wifi_ssid"].is<String>()) wifiSSID = doc["wifi_ssid"].as<String>();
    if (doc["wifi_pass"].is<const char*>() || doc["wifi_pass"].is<String>()) wifiPass = doc["wifi_pass"].as<String>();
    if (doc["client_id"].is<const char*>() || doc["client_id"].is<String>()) clientId = doc["client_id"].as<String>();
    if (doc["machine_id"].is<const char*>() || doc["machine_id"].is<String>()) machineId = doc["machine_id"].as<String>();

    isProvisioned = true;
    saveStoredPreferences();

    setupMQTTTopics();
    client.subscribe(topicCmd.c_str());

    JsonDocument resDoc;
    resDoc["status"] = "PROVISIONED_SUCCESS";
    resDoc["client_id"] = clientId;
    resDoc["machine_id"] = machineId;
    resDoc["mac_address"] = WiFi.macAddress();
    String resStr;
    serializeJson(resDoc, resStr);

    client.publish(topicSetupStatus.c_str(), resStr.c_str());
    publishFullState();

    Serial.println(F("[SETUP] Provisionamento concluído com sucesso!"));
}

void triggerBoxOpen(int boxIndex, String origem) {
    if (boxIndex < 0 || boxIndex >= 4) return;

    Serial.print(F("[SOLENOIDE] Ativando Box ")); Serial.print(boxIndex + 1); Serial.println(F(" por 4s."));
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
        case LED_STATE_AP_MODE:
            if (now - lastLedBlinkTimer >= 300) {
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

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, message);

    if (topicStr == topicSetupConfig) {
        if (!error) processProvisioningConfig(doc);
        return;
    }

    if (topicStr.endsWith("/cmd/open")) {
        if (!error && doc["box"].is<int>()) {
            int b = doc["box"].as<int>() - 1;
            triggerBoxOpen(b, "MANUAL");
        } else if (!error && doc["box"].is<const char*>() && String(doc["box"].as<const char*>()) == "all") {
            for (int b = 0; b < 4; b++) triggerBoxOpen(b, "MANUAL_ALL");
        }
    } else if (topicStr.endsWith("/cmd/mode")) {
        if (!error) {
            if (doc["modo"].is<const char*>() || doc["modo"].is<String>()) modoAtivo = doc["modo"].as<String>();
            if (doc["intervalo_minutos"].is<int>()) intervaloDelayMinutos = doc["intervalo_minutos"].as<int>();
            saveStoredPreferences();
            publishFullState();
        }
    } else if (topicStr.endsWith("/cmd/schedule")) {
        if (!error && doc["box"].is<int>()) {
            int b = doc["box"].as<int>() - 1;
            if (b >= 0 && b < 4) {
                if (doc["hora"].is<int>()) boxAgenda[b].hora = doc["hora"].as<int>();
                if (doc["minuto"].is<int>()) boxAgenda[b].minuto = doc["minuto"].as<int>();
                if (doc["ativo"].is<bool>()) boxAgenda[b].ativo = doc["ativo"].as<bool>();
                publishFullState();
            }
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
    Serial.println(F(" GallopIT Firmware v2.1 (PlatformIO Build)   "));
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

    if (isAPMode) {
        dnsServer.processNextRequest();
        server.handleClient();
        return;
    }

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
