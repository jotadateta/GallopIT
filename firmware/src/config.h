#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// --- Identificadores Multi-Tenant (EquiLock v2.0) ---
#define CLIENT_ID  "cliente_demo"
#define MACHINE_ID "eq_demo_01"

// --- Definições de Pinos do ESP32 ---
const int RELAY_PINS[4] = {18, 19, 21, 22}; // Pinos para as Boxes 1, 2, 3 e 4
const int LED_STATUS_PIN = 2;               // LED de sinalização de estado do armário

// --- Temporizações de Segurança ---
const unsigned long SOLENOID_PULSE_MS = 4000;   // 4 segundos exatos por abertura
const unsigned long PRE_WARNING_MS = 5000;       // 5 segundos de aviso prévio (LED pisca rápido)

// --- Configurações de Wi-Fi ---
struct ConfigRede {
    const char* ssid;
    const char* password;
};

const ConfigRede REDES[] = {
    {"MEO-5E3030", "123456789"},
    {"iPhone do jota", "jota1234"},
    {"Wokwi-GUEST", ""}
};
const int NUM_REDES = sizeof(REDES) / sizeof(REDES[0]);

// --- Configurações de MQTT ---
const char* MQTT_SERVER = "test.mosquitto.org";
const int MQTT_PORT = 1883;

// --- Servidor NTP para Agendamento Autónomo ---
const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 0;          // Ajustar conforme o fuso horário (ex: Lisboa GMT 0)
const int DAYLIGHT_OFFSET_SEC = 3600;   // Hora de Verão (+1h)

#endif // CONFIG_H
