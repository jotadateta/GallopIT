# Firmware IoT do EquiLock

Esta pasta irá conter o código do microcontrolador (ex: ESP32 ou ESP8266) responsável pelo controlo físico das fechaduras (solenoides), dos LEDs e da lógica local de tempo.

## Regras Físicas do Hardware
* **Atuação Segura:** O solenoide de cada fechadura só deve receber energia por exatos **4 segundos**.
* **Prevenção de Cliques Duplos (Spam):** O firmware deve ignorar comandos repetidos num curto intervalo de tempo.
* **Comportamento do LED:**
  * *Piscar lento:* Procurando rede Wi-Fi / reconectando.
  * *Fixo por 3 segundos:* Sucesso na conexão.
  * *Piscar rápido (5s):* Aviso prévio de abertura iminente da porta.
  * *Fixo por 4 segundos:* Abertura em curso.
  * *Apagado:* Operação normal.

## Lógica Autónoma (Offline)
* O firmware deve guardar o modo de operação principal (`DELAY` ou `AGENDA`), os horários configurados para cada box e o tempo de intervalo da sequência na memória não-volátil (EEPROM/Preferences).
* Caso o sinal de internet caia, o microcontrolador deve continuar a executar as sequências ou agendamentos agendados recorrendo ao seu relógio interno (NTP com RTC interno/software timer).
