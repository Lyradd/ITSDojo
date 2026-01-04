const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory leaderboard cache (simple implementation)
const leaderboardCache = new Map();

// Mock initial data
const INITIAL_LEADERBOARD = [
  { userId: 'user-1', name: 'Sarah Kusuma', avatar: 'bg-pink-200 text-pink-700', score: 280, totalQuestions: 50, answeredQuestions: 35, accuracy: 95, rank: 1, lastUpdate: Date.now() },
  { userId: 'user-2', name: 'Ahmad Rizki', avatar: 'bg-blue-200 text-blue-700', score: 265, totalQuestions: 50, answeredQuestions: 35, accuracy: 88, rank: 2, lastUpdate: Date.now() },
  { userId: 'user-3', name: 'Dinda Pratiwi', avatar: 'bg-purple-200 text-purple-700', score: 245, totalQuestions: 50, answeredQuestions: 30, accuracy: 94, rank: 3, lastUpdate: Date.now() },
  { userId: 'user-4', name: 'Budi Santoso', avatar: 'bg-green-200 text-green-700', score: 230, totalQuestions: 50, answeredQuestions: 32, accuracy: 82, rank: 4, lastUpdate: Date.now() },
  { userId: 'user-5', name: 'Citra Dewi', avatar: 'bg-yellow-200 text-yellow-700', score: 215, totalQuestions: 50, answeredQuestions: 28, accuracy: 87, rank: 5, lastUpdate: Date.now() },
  { userId: 'user-6', name: 'Eko Prasetyo', avatar: 'bg-indigo-200 text-indigo-700', score: 195, totalQuestions: 50, answeredQuestions: 25, accuracy: 94, rank: 6, lastUpdate: Date.now() },
  { userId: 'user-7', name: 'Fitri Handayani', avatar: 'bg-red-200 text-red-700', score: 180, totalQuestions: 50, answeredQuestions: 27, accuracy: 80, rank: 7, lastUpdate: Date.now() },
  { userId: 'user-8', name: 'Gilang Ramadhan', avatar: 'bg-teal-200 text-teal-700', score: 160, totalQuestions: 50, answeredQuestions: 22, accuracy: 85, rank: 8, lastUpdate: Date.now() },
  { userId: 'user-9', name: 'Hana Safitri', avatar: 'bg-orange-200 text-orange-700', score: 145, totalQuestions: 50, answeredQuestions: 20, accuracy: 93, rank: 9, lastUpdate: Date.now() },
  { userId: 'user-10', name: 'Irfan Maulana', avatar: 'bg-cyan-200 text-cyan-700', score: 120, totalQuestions: 50, answeredQuestions: 18, accuracy: 78, rank: 10, lastUpdate: Date.now() },
];

// Initialize cache
INITIAL_LEADERBOARD.forEach(entry => leaderboardCache.set(entry.userId, entry));

function getAllLeaderboard() {
  const entries = Array.from(leaderboardCache.values());
  return entries.sort((a, b) => b.score - a.score).map((entry, index) => ({
    ...entry,
    previousRank: entry.rank,
    rank: index + 1,
  }));
}

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

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Send initial leaderboard data
    socket.emit('leaderboard:initial', getAllLeaderboard());

    // Handle user score update
    socket.on('leaderboard:update-score', (data) => {
      const entry = leaderboardCache.get(data.userId);
      if (entry) {
        const accuracy = data.answeredQuestions > 0 
          ? Math.round((data.score / (entry.totalQuestions * 10)) * 100) 
          : entry.accuracy;

        const updatedEntry = {
          ...entry,
          score: data.score,
          answeredQuestions: data.answeredQuestions,
          accuracy,
          lastUpdate: Date.now(),
        };

        leaderboardCache.set(data.userId, updatedEntry);
        io.emit('leaderboard:update', getAllLeaderboard());
      }
    });

    // Handle new user entry
    socket.on('leaderboard:add-user', (entry) => {
      leaderboardCache.set(entry.userId, {
        ...entry,
        lastUpdate: Date.now(),
      });
      io.emit('leaderboard:update', getAllLeaderboard());
    });

    // Get current leaderboard
    socket.on('leaderboard:get', () => {
      socket.emit('leaderboard:update', getAllLeaderboard());
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  console.log('🚀 WebSocket server initialized');

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

