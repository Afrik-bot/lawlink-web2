import { EventEmitter } from 'events';

interface WebSocketMessage {
  type: string;
  payload: any;
}

export class WebSocketService extends EventEmitter {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second delay
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private exponentialBackoff = true;
  private connectionQualityInterval: NodeJS.Timeout | null = null;
  private lastPingTime: number = 0;
  private pingInterval = 30000; // 30 seconds

  constructor(private url: string) {
    super();
  }

  connect() {
    try {
      this.socket = new WebSocket(this.url);
      this.setupEventListeners();
      this.startKeepAlive();
      this.startConnectionQualityMonitoring();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.stopKeepAlive();
      this.stopConnectionQualityMonitoring();
      this.handleReconnect();
      this.emit('disconnected');
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'offer':
        this.emit('offer', message.payload);
        break;
      case 'answer':
        this.emit('answer', message.payload);
        break;
      case 'ice-candidate':
        this.emit('ice-candidate', message.payload);
        break;
      case 'chat-message':
        this.emit('chat-message', message.payload);
        break;
      case 'file-shared':
        this.emit('file-shared', message.payload);
        break;
      case 'consultation-ended':
        this.emit('consultation-ended', message.payload);
        break;
      case 'pong':
        const latency = Date.now() - message.payload.timestamp;
        if (latency > 1000) { // More than 1 second latency
          this.emit('connectionQuality', { quality: 'poor', latency });
        } else if (latency > 500) { // More than 500ms latency
          this.emit('connectionQuality', { quality: 'degraded', latency });
        } else {
          this.emit('connectionQuality', { quality: 'good', latency });
        }
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    const delay = this.exponentialBackoff
      ? Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000) // Max 30 seconds
      : this.reconnectDelay;

    this.reconnectAttempts++;
    
    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      delay,
      maxAttempts: this.maxReconnectAttempts
    });

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startKeepAlive() {
    this.keepAliveInterval = setInterval(() => {
      this.send('ping', {});
    }, 30000); // Send ping every 30 seconds
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private startConnectionQualityMonitoring() {
    this.connectionQualityInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        const now = Date.now();
        this.lastPingTime = now;
        
        this.socket.send(JSON.stringify({ type: 'ping', timestamp: now }));
        
        // Set timeout for response
        setTimeout(() => {
          const latency = Date.now() - this.lastPingTime;
          if (latency > 1000) { // More than 1 second latency
            this.emit('connectionQuality', { quality: 'poor', latency });
          } else if (latency > 500) { // More than 500ms latency
            this.emit('connectionQuality', { quality: 'degraded', latency });
          } else {
            this.emit('connectionQuality', { quality: 'good', latency });
          }
        }, 2000);
      }
    }, this.pingInterval);
  }

  private stopConnectionQualityMonitoring() {
    if (this.connectionQualityInterval) {
      clearInterval(this.connectionQualityInterval);
      this.connectionQualityInterval = null;
    }
  }

  send(type: string, payload: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      this.emit('error', new Error('WebSocket is not connected'));
    }
  }

  disconnect() {
    this.stopKeepAlive();
    this.stopConnectionQualityMonitoring();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService(
  process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080'
);

export default websocketService;
