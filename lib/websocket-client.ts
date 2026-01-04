import { io, Socket } from 'socket.io-client';
import { LeaderboardEntry } from './evaluation-store';

type LeaderboardUpdateCallback = (leaderboard: LeaderboardEntry[]) => void;
type ConnectionStatusCallback = (connected: boolean) => void;

class WebSocketClient {
  private static instance: WebSocketClient;
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private leaderboardCallbacks: Set<LeaderboardUpdateCallback> = new Set();
  private statusCallbacks: Set<ConnectionStatusCallback> = new Set();

  private constructor() {}

  static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('✅ Already connected to WebSocket');
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    
    this.socket = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyStatusChange(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.notifyStatusChange(false);
    });

    this.socket.on('leaderboard:initial', (data: LeaderboardEntry[]) => {
      console.log('📊 Received initial leaderboard:', data.length, 'entries');
      this.notifyLeaderboardUpdate(data);
    });

    this.socket.on('leaderboard:update', (data: LeaderboardEntry[]) => {
      console.log('🔄 Leaderboard updated:', data.length, 'entries');
      this.notifyLeaderboardUpdate(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after max attempts');
    });
  }

  /**
   * Subscribe to leaderboard updates
   */
  onLeaderboardUpdate(callback: LeaderboardUpdateCallback): () => void {
    this.leaderboardCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.leaderboardCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionStatus(callback: ConnectionStatusCallback): () => void {
    this.statusCallbacks.add(callback);
    
    // Immediately notify current status
    callback(this.isConnected);
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  private notifyLeaderboardUpdate(data: LeaderboardEntry[]): void {
    this.leaderboardCallbacks.forEach(callback => callback(data));
  }

  private notifyStatusChange(connected: boolean): void {
    this.statusCallbacks.forEach(callback => callback(connected));
  }

  /**
   * Update user score
   */
  updateScore(userId: string, score: number, answeredQuestions: number): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Cannot update score: not connected');
      return;
    }

    this.socket.emit('leaderboard:update-score', {
      userId,
      score,
      answeredQuestions,
    });
  }

  /**
   * Add new user to leaderboard
   */
  addUser(entry: LeaderboardEntry): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Cannot add user: not connected');
      return;
    }

    this.socket.emit('leaderboard:add-user', entry);
  }

  /**
   * Request current leaderboard
   */
  requestLeaderboard(): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Cannot request leaderboard: not connected');
      return;
    }

    this.socket.emit('leaderboard:get');
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyStatusChange(false);
    }
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

export const wsClient = WebSocketClient.getInstance();
