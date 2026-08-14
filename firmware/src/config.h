#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// --- Identificadores de Setup e Segurança (GallopIT v2.1) ---
#define SYSTEM_PREFIX       "gallopit"
#define PROVISIONING_SECRET "GALLOPIT_SECURE_AUTH_KEY_2026" // Chave secreta obrigatória para o setup inicial seguro

// Valores por omissão (antes do provisionamento)
#define DEFAULT_CLIENT_ID  "cliente_demo"
#define DEFAULT_MACHINE_ID "eq_demo_01"

// Credenciais Wi-Fi Padrão / Fallback
#define DEFAULT_WIFI_SSID  "MEO-5E3030"
#define DEFAULT_WIFI_PASS  "123456789"

// Nome do Ponto de Acesso (AP) para Setup Wi-Fi sem fios
#define AP_SETUP_SSID_PREFIX "GallopIT-Setup-"
#define AP_SETUP_PASS        "gallopit123"

// --- Definições de Pinos do ESP32 ---
const int RELAY_PINS[4] = {18, 19, 21, 22}; // Pinos das Boxes 1, 2, 3 e 4
const int LED_STATUS_PIN = 2;               // LED de sinalização de estado do armário

// --- Temporizações de Segurança ---
const unsigned long SOLENOID_PULSE_MS = 4000;   // 4 segundos exatos por abertura
const unsigned long PRE_WARNING_MS = 5000;       // 5 segundos de aviso prévio (LED pisca rápido)

// --- Configurações de MQTT ---
const char* DEFAULT_MQTT_SERVER = "test.mosquitto.org";
const int DEFAULT_MQTT_PORT = 1883;

// --- Servidor NTP para Agendamento Autónomo ---
const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 0;          // Ajustar conforme o fuso horário (ex: Lisboa GMT 0)
const int DAYLIGHT_OFFSET_SEC = 3600;   // Hora de Verão (+1h)

#endif // CONFIG_H
