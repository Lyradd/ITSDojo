import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { leaderboardCache } from '@/lib/leaderboard-cache';
import { INITIAL_LEADERBOARD } from '@/lib/evaluation-data';
import { LeaderboardEntry } from '@/lib/evaluation-store';

let io: SocketIOServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
      credentials: true,
    },
    path: '/api/socket',
  });

  // Initialize cache with mock data
  leaderboardCache.initialize(INITIAL_LEADERBOARD);

  io.on('connection', (socket: Socket) => {
    console.log('✅ Client connected:', socket.id);

    // Send initial leaderboard data
    socket.emit('leaderboard:initial', leaderboardCache.getAll());

    // Handle user score update
    socket.on('leaderboard:update-score', (data: { 
      userId: string; 
      score: number; 
      answeredQuestions: number;
    }) => {
      const updated = leaderboardCache.updateUserScore(
        data.userId, 
        data.score, 
        data.answeredQuestions
      );

      if (updated) {
        // Broadcast updated leaderboard to all clients
        io?.emit('leaderboard:update', leaderboardCache.getAll());
      }
    });

    // Handle new user entry
    socket.on('leaderboard:add-user', (entry: LeaderboardEntry) => {
      leaderboardCache.upsert(entry);
      io?.emit('leaderboard:update', leaderboardCache.getAll());
    });

    // Get current leaderboard
    socket.on('leaderboard:get', () => {
      socket.emit('leaderboard:update', leaderboardCache.getAll());
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  console.log('🚀 WebSocket server initialized');
  return io;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Broadcast leaderboard update to all connected clients
 */
export function broadcastLeaderboardUpdate(): void {
  if (io) {
    io.emit('leaderboard:update', leaderboardCache.getAll());
  }
}
