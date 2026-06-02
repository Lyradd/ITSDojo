const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const { getLobbyState, lobbyRoomKey, setLobbyBroadcaster, upsertLobbyState } = require('./lib/lobby-bus');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize WebSocket server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: dev ? ['http://localhost:3000'] : false,
      credentials: true,
    },
    path: '/api/socket',
  });

  // Expose io to Next.js API routes via globalThis. The /api/leaderboard/broadcast
  // route uses this to push fresh DB data to all connected clients after submitEvaluationResult.
  globalThis.__io = io;
  setLobbyBroadcaster((state) => {
    io.to(lobbyRoomKey(state.inviteCode)).emit('lobby:state', state);
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Saat client connect, mereka tinggal subscribe — data leaderboard akan dikirim
    // lewat event 'leaderboard:update' setiap kali ada perubahan dari server (POST broadcast).
    // Client juga bisa request initial fetch via getLeaderboardData() dari sisi mereka.

    socket.on('lobby:join-room', (payload = {}) => {
      const { roomId } = payload;
      if (!roomId) return;
      socket.join(lobbyRoomKey(roomId));

      const cached = getLobbyState(roomId);
      if (cached) {
        socket.emit('lobby:state', cached);
      }
    });

    socket.on('lobby:leave-room', (payload = {}) => {
      const { roomId } = payload;
      if (!roomId) return;
      socket.leave(lobbyRoomKey(roomId));
    });

    socket.on('lobby:upsert', (payload = {}) => {
      const { state } = payload;
      upsertLobbyState(state);
    });

    socket.on('lobby:request', (payload = {}) => {
      const { roomId } = payload;
      if (!roomId) return;

      const cached = getLobbyState(roomId);
      if (cached) {
        socket.emit('lobby:state', cached);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('WebSocket server initialized (global.__io set)');

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
