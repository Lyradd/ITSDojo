import { LeaderboardEntry } from './evaluation-store';

/**
 * In-memory cache for leaderboard data
 * This prevents heavy database queries and enables real-time updates
 */
class LeaderboardCache {
  private static instance: LeaderboardCache;
  private cache: Map<string, LeaderboardEntry>;
  private lastUpdate: number;

  private constructor() {
    this.cache = new Map();
    this.lastUpdate = Date.now();
  }

  static getInstance(): LeaderboardCache {
    if (!LeaderboardCache.instance) {
      LeaderboardCache.instance = new LeaderboardCache();
    }
    return LeaderboardCache.instance;
  }

  /**
   * Initialize cache with initial data
   */
  initialize(entries: LeaderboardEntry[]): void {
    this.cache.clear();
    entries.forEach(entry => {
      this.cache.set(entry.userId, entry);
    });
    this.lastUpdate = Date.now();
  }

  /**
   * Get all leaderboard entries sorted by score
   */
  getAll(): LeaderboardEntry[] {
    const entries = Array.from(this.cache.values());
    return entries.sort((a, b) => b.score - a.score).map((entry, index) => ({
      ...entry,
      previousRank: entry.rank,
      rank: index + 1,
    }));
  }

  /**
   * Get top N entries
   */
  getTop(n: number): LeaderboardEntry[] {
    return this.getAll().slice(0, n);
  }

  /**
   * Update a single user's score
   */
  updateUserScore(userId: string, score: number, answeredQuestions: number): LeaderboardEntry | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;

    const accuracy = answeredQuestions > 0 
      ? Math.round((score / (entry.totalQuestions * 10)) * 100) 
      : entry.accuracy;

    const updatedEntry: LeaderboardEntry = {
      ...entry,
      score,
      answeredQuestions,
      accuracy,
      lastUpdate: Date.now(),
    };

    this.cache.set(userId, updatedEntry);
    this.lastUpdate = Date.now();

    return updatedEntry;
  }

  /**
   * Add or update an entry
   */
  upsert(entry: LeaderboardEntry): void {
    this.cache.set(entry.userId, {
      ...entry,
      lastUpdate: Date.now(),
    });
    this.lastUpdate = Date.now();
  }

  /**
   * Get specific user entry
   */
  getUser(userId: string): LeaderboardEntry | undefined {
    return this.cache.get(userId);
  }

  /**
   * Get last update timestamp
   */
  getLastUpdate(): number {
    return this.lastUpdate;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

export const leaderboardCache = LeaderboardCache.getInstance();
