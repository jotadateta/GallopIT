import mqtt, { MqttClient } from 'mqtt';
import { Esp32FullStatePayload } from '../types';

declare global {
  interface Window {
    Paho?: any;
  }
}

export interface MqttServiceOptions {
  brokerHost?: string;
  brokerPort?: number;
  brokerPath?: string;
  useSSL?: boolean;
  clientId?: string;
  machineId?: string;
  onStatusChange?: (status: 'connecting' | 'online' | 'offline' | 'disconnected') => void;
  onLogMessage?: (msg: string, type: 'sent' | 'received' | 'sys' | 'err') => void;
  onPresenceChange?: (isOnline: boolean) => void;
  onStateReceived?: (state: Esp32FullStatePayload) => void;
  onEventReceived?: (eventData: any) => void;
  onPongReceived?: (latencyMs: number) => void;
}

export class GallopItMqttClient {
  private client: MqttClient | null = null;
  private pahoClient: any = null;
  private brokerHost: string = 'broker.emqx.io';
  private brokerPort: number = 8084;
  private brokerPath: string = '/mqtt';
  private useSSL: boolean = true;

  public clientId: string = 'haras_quinta_do_sol';
  public machineId: string = 'box_principal_01';

  private status: 'connecting' | 'online' | 'offline' | 'disconnected' = 'disconnected';
  private pingStartTime: number = 0;
  private options: MqttServiceOptions;

  constructor(options: MqttServiceOptions) {
    this.options = options;
    if (options.brokerHost) this.brokerHost = options.brokerHost;
    if (options.brokerPort) this.brokerPort = options.brokerPort;
    if (options.brokerPath) this.brokerPath = options.brokerPath;
    if (options.useSSL !== undefined) this.useSSL = options.useSSL;
    if (options.clientId) this.clientId = options.clientId;
    if (options.machineId) this.machineId = options.machineId;
  }

  public updateTarget(clientId: string, machineId: string) {
    const changed = this.clientId !== clientId || this.machineId !== machineId;
    this.clientId = clientId.trim() || 'haras_quinta_do_sol';
    this.machineId = machineId.trim() || 'box_principal_01';

    if (changed) {
      this.logSys(`Alvo alterado para Client: [${this.clientId}], Machine: [${this.machineId}]. A re-subscrever...`);
      if (this.isConnected()) {
        this.subscribeTopics();
        this.requestState();
      } else {
        this.connect();
      }
    }
  }

  public isConnected(): boolean {
    if (this.client) return this.client.connected;
    if (this.pahoClient) return this.pahoClient.isConnected();
    return false;
  }

  public connect() {
    this.disconnect();

    this.setStatus('connecting');
    const wsUrl = `${this.useSSL ? 'wss' : 'ws'}://${this.brokerHost}:${this.brokerPort}${this.brokerPath}`;
    this.logSys(`🔌 A conectar ao Broker MQTT: ${wsUrl}`);

    const uniqueConnId = `gallopit_web_${Math.random().toString(16).substring(2, 8)}`;

    // Try Paho MQTT first if present in window (CDN requirement), else fallback to mqtt npm package
    if (window.Paho && window.Paho.MQTT) {
      try {
        this.pahoClient = new window.Paho.MQTT.Client(
          this.brokerHost,
          Number(this.brokerPort),
          this.brokerPath,
          uniqueConnId
        );

        this.pahoClient.onConnectionLost = (responseObject: any) => {
          this.setStatus('offline');
          this.logErr(`Conexão Paho perdida: ${responseObject.errorMessage || 'Desconectado'}`);
        };

        this.pahoClient.onMessageArrived = (message: any) => {
          this.handleIncoming(message.destinationName, message.payloadString);
        };

        this.pahoClient.connect({
          useSSL: this.useSSL,
          timeout: 10,
          keepAliveInterval: 30,
          onSuccess: () => {
            this.setStatus('online');
            this.logSys(`⚡ Conetado via Paho MQTT (WSS) com sucesso!`);
            this.subscribeTopics();
            this.requestState();
          },
          onFailure: (err: any) => {
            this.setStatus('offline');
            this.logErr(`Falha ao conectar via Paho MQTT: ${err.errorMessage || JSON.stringify(err)}`);
            this.fallbackToMqttJs(wsUrl, uniqueConnId);
          }
        });
        return;
      } catch (err: any) {
        console.warn('Erro Paho MQTT, usando fallback MQTT.js:', err);
      }
    }

    this.fallbackToMqttJs(wsUrl, uniqueConnId);
  }

  private fallbackToMqttJs(wsUrl: string, uniqueConnId: string) {
    try {
      this.client = mqtt.connect(wsUrl, {
        clientId: uniqueConnId,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 4000
      });

      this.client.on('connect', () => {
        this.setStatus('online');
        this.logSys(`⚡ Conetado via WebSocket MQTT.js! Broker: ${wsUrl}`);
        this.subscribeTopics();
        this.requestState();
      });

      this.client.on('message', (topic, payload) => {
        this.handleIncoming(topic, payload.toString());
      });

      this.client.on('error', (err) => {
        this.setStatus('offline');
        this.logErr(`Erro de comunicação MQTT: ${err.message}`);
      });

      this.client.on('offline', () => {
        this.setStatus('offline');
      });

      this.client.on('close', () => {
        this.setStatus('disconnected');
      });
    } catch (err: any) {
      this.setStatus('disconnected');
      this.logErr(`Erro ao inicializar cliente MQTT.js: ${err.message}`);
    }
  }

  private subscribeTopics() {
    const baseTopic = `gallopit/${this.clientId}/${this.machineId}/status`;
    const presenceTopic = `${baseTopic}/presence`;
    const stateTopic = `${baseTopic}/state`;
    const eventTopic = `${baseTopic}/event`;

    this.logSys(`Subscrevendo aos tópicos:\n• ${presenceTopic}\n• ${stateTopic}\n• ${eventTopic}`);

    if (this.pahoClient && this.pahoClient.isConnected()) {
      this.pahoClient.subscribe(presenceTopic, { qos: 1 });
      this.pahoClient.subscribe(stateTopic, { qos: 1 });
      this.pahoClient.subscribe(eventTopic, { qos: 1 });
    } else if (this.client && this.client.connected) {
      this.client.subscribe(presenceTopic);
      this.client.subscribe(stateTopic);
      this.client.subscribe(eventTopic);
    }
  }

  private handleIncoming(topic: string, payloadStr: string) {
    this.options.onLogMessage?.(`RECEBIDO [${topic}]: ${payloadStr}`, 'received');

    const baseTopic = `gallopit/${this.clientId}/${this.machineId}/status`;

    // 1. Presence Topic
    if (topic === `${baseTopic}/presence`) {
      const isOnline = payloadStr.trim().toLowerCase() === 'online';
      this.options.onPresenceChange?.(isOnline);
      this.logSys(`Presença do Equipamento: ${isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
    }

    // 2. Full State Topic
    else if (topic === `${baseTopic}/state`) {
      try {
        const stateData: Esp32FullStatePayload = JSON.parse(payloadStr);
        this.options.onStateReceived?.(stateData);
      } catch (e) {
        this.logErr(`Erro ao interpretar JSON de estado: ${payloadStr}`);
      }
    }

    // 3. Event / Audit / Ping Topic
    else if (topic === `${baseTopic}/event`) {
      try {
        const evt = JSON.parse(payloadStr);
        if (evt.event === 'PONG' || evt.type === 'PONG') {
          const latency = Date.now() - this.pingStartTime;
          const latDisplay = latency > 0 ? latency : 12;
          this.options.onPongReceived?.(latDisplay);
          this.logSys(`🏓 PONG recebido do ESP32! Latência: ${latDisplay}ms`);
        }
        this.options.onEventReceived?.(evt);
      } catch (e) {
        // Plain string event
        if (payloadStr.includes('PONG')) {
          const latency = Date.now() - this.pingStartTime;
          this.options.onPongReceived?.(latency > 0 ? latency : 12);
        }
        this.options.onEventReceived?.(payloadStr);
      }
    }
  }

  // ==============================================================================
  // COMMAND PUBLISHING METHODS
  // ==============================================================================

  public openBox(box: number | 'all'): boolean {
    const topic = `gallopit/${this.clientId}/${this.machineId}/cmd/open`;
    const payload = JSON.stringify({ box });
    return this.publish(topic, payload);
  }

  public armBox(box: number | 'all'): boolean {
    const topic = `gallopit/${this.clientId}/${this.machineId}/cmd/arm`;
    const payload = JSON.stringify({ box });
    return this.publish(topic, payload);
  }

  public ping(): boolean {
    this.pingStartTime = Date.now();
    const topic = `gallopit/${this.clientId}/${this.machineId}/cmd/ping`;
    return this.publish(topic, '{}');
  }

  public setMode(modo: 'DELAY' | 'AGENDA', intervalo_minutos: number = 5): boolean {
    const topic = `gallopit/${this.clientId}/${this.machineId}/cmd/mode`;
    const payload = JSON.stringify({ modo, intervalo_minutos });
    return this.publish(topic, payload);
  }

  public setSchedule(box: number, hora: number, minuto: number, ativo: boolean = true): boolean {
    const topic = `gallopit/${this.clientId}/${this.machineId}/cmd/schedule`;
    const payload = JSON.stringify({ box, hora, minuto, ativo });
    return this.publish(topic, payload);
  }

  public startSequence(): boolean {
    const topic = `gallopit/${this.clientId}/${this.machineId}/cmd/start_sequence`;
    return this.publish(topic, '{}');
  }

  public stopSequence(): boolean {
    const topic = `gallopit/${this.clientId}/${this.machineId}/cmd/stop_sequence`;
    return this.publish(topic, '{}');
  }

  public setTimerMin(minutos: number): boolean {
    const topic = `gallopit/${this.clientId}/${this.machineId}/cmd/timer_min`;
    return this.publish(topic, String(minutos));
  }

  public setBoxScheduleDirect(box: number, timeStr: string): boolean {
    const topic = `gallopit/${this.clientId}/${this.machineId}/box/${box}/schedule`;
    return this.publish(topic, timeStr);
  }

  public requestState(): boolean {
    const topic = `gallopit/${this.clientId}/${this.machineId}/cmd/status_get`;
    return this.publish(topic, '{}');
  }

  public publishRaw(topic: string, payloadStr: string): boolean {
    return this.publish(topic, payloadStr);
  }

  private publish(topic: string, payload: string): boolean {
    if (!this.isConnected()) {
      this.logErr(`Tentativa de envio sem conexão MQTT. Tópico: ${topic}`);
      return false;
    }

    try {
      if (this.pahoClient && this.pahoClient.isConnected()) {
        const message = new window.Paho.MQTT.Message(payload);
        message.destinationName = topic;
        message.qos = 1;
        this.pahoClient.send(message);
      } else if (this.client && this.client.connected) {
        this.client.publish(topic, payload, { qos: 1 });
      }

      this.options.onLogMessage?.(`ENVIADO [${topic}]: ${payload}`, 'sent');
      return true;
    } catch (err: any) {
      this.logErr(`Falha ao publicar em ${topic}: ${err.message}`);
      return false;
    }
  }

  public disconnect() {
    try {
      if (this.pahoClient && this.pahoClient.isConnected()) {
        this.pahoClient.disconnect();
      }
    } catch (e) {}

    try {
      if (this.client) {
        this.client.end(true);
      }
    } catch (e) {}

    this.pahoClient = null;
    this.client = null;
    this.setStatus('disconnected');
  }

  private setStatus(status: 'connecting' | 'online' | 'offline' | 'disconnected') {
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  private logSys(msg: string) {
    this.options.onLogMessage?.(`[SISTEMA] ${msg}`, 'sys');
  }

  private logErr(msg: string) {
    this.options.onLogMessage?.(`[ERRO] ${msg}`, 'err');
  }
}
