#!/usr/bin/env python3
"""
 GallopIT - Terminal MQTT Tester & Validador de Hardware
 Este script permite testar todas as funcionalidades do sistema GallopIT (ESP32),
 incluindo anúncios de descoberta, setup seguro por secret_key e aberturas de boxes.
"""

import json
import time
import sys
import threading
import paho.mqtt.client as mqtt

# --- Configurações por Defeito ---
MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
PROVISIONING_SECRET = "GALLOPIT_SECURE_AUTH_KEY_2026"

DEFAULT_CLIENT_ID = "cliente_demo"
DEFAULT_MACHINE_ID = "eq_demo_01"

# Variáveis globais para armazenar dados detetados
last_discovered_mac = "88572178EF3C"
active_client_id = DEFAULT_CLIENT_ID
active_machine_id = DEFAULT_MACHINE_ID

# --- Cores no Terminal ---
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"{GREEN}[✓] Conetado com sucesso ao Broker MQTT: {MQTT_BROKER}:{MQTT_PORT}{RESET}")
        # Subscreve a toda a árvore de tópicos do GallopIT
        client.subscribe("gallopit/#")
        print(f"{CYAN}[i] A escutar todos os tópicos 'gallopit/#'...{RESET}\n")
    else:
        print(f"{RED}[✗] Falha na conexão ao MQTT. Código: {rc}{RESET}")

def on_message(client, userdata, msg):
    global last_discovered_mac, active_client_id, active_machine_id
    topic = msg.topic
    payload_str = msg.payload.decode('utf-8', errors='ignore')

    try:
        data = json.loads(payload_str)
        formatted_json = json.dumps(data, indent=2, ensure_ascii=False)
    except Exception:
        formatted_json = payload_str

    print(f"\n{YELLOW}==================== [ MENSAGEM MQTT RECEBIDA ] ===================={RESET}")
    print(f"{BOLD}Tópico:{RESET} {CYAN}{topic}{RESET}")

    if "discovery/announcement" in topic:
        print(f"{GREEN}{BOLD}🔔 [DESCOBERTA AUTOMÁTICA DETETADA]{RESET}")
        if isinstance(data, dict):
            if "mac_clean" in data:
                last_discovered_mac = data["mac_clean"]
                print(f"{GREEN} -> MAC Address da Máquina: {BOLD}{last_discovered_mac}{RESET}")
    elif "status/presence" in topic:
        status_color = GREEN if payload_str == "online" else RED
        print(f"{BOLD}Estado de Presença:{RESET} {status_color}{payload_str.upper()}{RESET}")
    elif "status/event" in topic:
        print(f"{YELLOW}⚡ [EVENTO EM TEMPO REAL]:{RESET} {formatted_json}")
    elif "status/state" in topic:
        print(f"{CYAN}📊 [ESTADO COMPLETO DA MÁQUINA]:{RESET}")
        print(formatted_json)

    print(f"{YELLOW}====================================================================={RESET}")

def send_mqtt(client, topic, payload, retain=False):
    if isinstance(payload, dict):
        payload_str = json.dumps(payload)
    else:
        payload_str = str(payload)

    print(f"\n{GREEN}[OUT] A enviar para {topic}:{RESET} {payload_str}")
    client.publish(topic, payload_str, retain=retain)

def print_menu():
    print(f"\n{BOLD}{CYAN}===== MENU DE TESTES E VALIDAÇÃO GALLOPIT ====={RESET}")
    print(f" {BOLD}1.{RESET} Enviar Setup Seguro (Provisionar MAC: {YELLOW}{last_discovered_mac}{RESET})")
    print(f" {BOLD}2.{RESET} Testar Abertura Manual da {GREEN}Box 1{RESET} (GPIO 18 - 4s)")
    print(f" {BOLD}3.{RESET} Testar Abertura Manual da {GREEN}Box 2{RESET} (GPIO 19 - 4s)")
    print(f" {BOLD}4.{RESET} Testar Abertura Manual da {GREEN}Box 3{RESET} (GPIO 21 - 4s)")
    print(f" {BOLD}5.{RESET} Testar Abertura Manual da {GREEN}Box 4{RESET} (GPIO 22 - 4s)")
    print(f" {BOLD}6.{RESET} Testar Abertura de {GREEN}TODAS as Boxes{RESET} (all - 4s)")
    print(f" {BOLD}7.{RESET} Pedir Estado Atual da Máquina (status_get)")
    print(f" {BOLD}8.{RESET} Alternar Modo de Operação (DELAY / AGENDA)")
    print(f" {BOLD}9.{RESET} Alterar IDs Alvo (Atual: Client={active_client_id}, Machine={active_machine_id})")
    print(f" {BOLD}0.{RESET} Sair")
    print(f"{CYAN}================================================={RESET}")

def main():
    global last_discovered_mac, active_client_id, active_machine_id

    client = mqtt.Client(client_id="GallopIT-Python-Tester")
    client.on_connect = on_connect
    client.on_message = on_message

    print(f"{BOLD}A ligar ao Broker MQTT {MQTT_BROKER}...{RESET}")
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
    except Exception as e:
        print(f"{RED}[✗] Erro de ligação: {e}{RESET}")
        sys.exit(1)

    # Inicia a escuta em segundo plano
    client.loop_start()
    time.sleep(1)

    while True:
        print_menu()
        opcao = input(f"{BOLD}Escolha uma opção (0-9): {RESET}").strip()

        if opcao == "1":
            mac = input(f"MAC Address para provisionar [{last_discovered_mac}]: ").strip() or last_discovered_mac
            c_id = input(f"ID do Cliente [{active_client_id}]: ").strip() or active_client_id
            m_id = input(f"ID da Máquina [{active_machine_id}]: ").strip() or active_machine_id

            setup_topic = f"gallopit/setup/{mac}/config"
            payload = {
                "secret_key": PROVISIONING_SECRET,
                "client_id": c_id,
                "machine_id": m_id
            }
            send_mqtt(client, setup_topic, payload)

            active_client_id = c_id
            active_machine_id = m_id
            print(f"{GREEN}[✓] Setup enviado para {setup_topic}!{RESET}")

        elif opcao in ["2", "3", "4", "5"]:
            box_num = int(opcao) - 1
            cmd_topic = f"gallopit/{active_client_id}/{active_machine_id}/cmd/open"
            send_mqtt(client, cmd_topic, {"box": box_num})

        elif opcao == "6":
            cmd_topic = f"gallopit/{active_client_id}/{active_machine_id}/cmd/open"
            send_mqtt(client, cmd_topic, {"box": "all"})

        elif opcao == "7":
            cmd_topic = f"gallopit/{active_client_id}/{active_machine_id}/cmd/status_get"
            send_mqtt(client, cmd_topic, {})

        elif opcao == "8":
            modo = input("Digite o modo pretendido (DELAY / AGENDA) [DELAY]: ").strip().upper() or "DELAY"
            cmd_topic = f"gallopit/{active_client_id}/{active_machine_id}/cmd/mode"
            send_mqtt(client, cmd_topic, {"modo": modo, "intervalo_minutos": 5})

        elif opcao == "9":
            active_client_id = input(f"Novo Client ID [{active_client_id}]: ").strip() or active_client_id
            active_machine_id = input(f"Novo Machine ID [{active_machine_id}]: ").strip() or active_machine_id
            print(f"{GREEN}[✓] Alvo alterado para: {active_client_id} / {active_machine_id}{RESET}")

        elif opcao == "0":
            print(f"{YELLOW}A encerrar o GallopIT Tester...{RESET}")
            client.loop_stop()
            client.disconnect()
            break

        time.sleep(1.5)

if __name__ == "__main__":
    main()
