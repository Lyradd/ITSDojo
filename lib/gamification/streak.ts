import { users } from "@/db/schema";

export interface StreakEvaluationResult {
  streak: number;
  lastActiveDate: string;
  freezeCount: number;
  freezeUsed: number;
  isReset: boolean;
}

/**
 * Helper sentral untuk mengevaluasi logika Streak harian pengguna.
 * Pure function ini tidak melakukan operasi database, sehingga aman dipanggil
 * di dalam transaction atau retry loop (OCC).
 * 
 * Aturan Bisnis:
 * 1. Jika diff === 0: Sudah klaim hari ini, kembalikan nilai apa adanya.
 * 2. Jika diff === 1: Lanjut belajar dari kemarin, tambah streak + 1.
 * 3. Jika diff > 1 (Bolong):
 *    - Jika punya streak_freeze: Konsumsi freeze sejumlah hari bolong (jika cukup). Pertahankan streak, lalu tambah + 1.
 *    - Jika tidak punya/kurang: Streak hangus, reset ke 1.
 * 
 * @param currentStreak Streak saat ini
 * @param lastActiveDate Tanggal terakhir aktif (YYYY-MM-DD)
 * @param freezeCount Jumlah item Streak Freeze yang dimiliki
 * @param timezoneOffsetMinutes Offset zona waktu lokal pengguna dari UTC (opsional). Jika tidak diberikan, gunakan UTC server.
 */
export function evaluateStreak(
  currentStreak: number,
  lastActiveDate: string | null | undefined,
  freezeCount: number,
  timezoneOffsetMinutes?: number
): StreakEvaluationResult {
  const now = new Date();
  
  // Normalisasi ke tanggal lokal pengguna (atau fallback ke UTC)
  let todayStr: string;
  if (timezoneOffsetMinutes !== undefined) {
    const localTime = new Date(now.getTime() - timezoneOffsetMinutes * 60000);
    todayStr = localTime.toISOString().split('T')[0];
  } else {
    // Fallback yang konsisten: YYYY-MM-DD dalam UTC
    todayStr = now.toISOString().split('T')[0];
  }

  if (!lastActiveDate || lastActiveDate === '') {
    return { streak: 1, lastActiveDate: todayStr, freezeCount, freezeUsed: 0, isReset: false };
  }

  // Corrupted state fix: If streak is 0 but lastActiveDate is today, it's a new streak
  if (lastActiveDate === todayStr && currentStreak === 0) {
    return { streak: 1, lastActiveDate: todayStr, freezeCount, freezeUsed: 0, isReset: false };
  }

  if (lastActiveDate === todayStr) {
    // Sudah klaim hari ini
    return { streak: currentStreak, lastActiveDate: todayStr, freezeCount, freezeUsed: 0, isReset: false };
  }

  // Helper normalisasi tengah malam UTC untuk kalkulasi hari
  const normalizeToMidnightUTC = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  };

  const todayMidnight = normalizeToMidnightUTC(todayStr);
  const lastActiveMidnight = normalizeToMidnightUTC(lastActiveDate);
  const diffMs = todayMidnight.getTime() - lastActiveMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let newStreak = currentStreak;
  let newFreezeCount = freezeCount;
  let freezeUsed = 0;
  let isReset = false;

  if (diffDays === 1) {
    newStreak += 1;
  } else if (diffDays > 1) {
    // Pengguna bolong / absen!
    let missedDays = diffDays - 1;

    // Konsumsi freeze
    if (newFreezeCount > 0) {
      const freezeToConsume = Math.min(newFreezeCount, missedDays);
      newFreezeCount -= freezeToConsume;
      missedDays -= freezeToConsume;
      freezeUsed = freezeToConsume;
    }

    if (missedDays > 0) {
      // Freeze tidak cukup, streak hangus
      newStreak = 1;
      isReset = true;
    } else {
      // Freeze berhasil menutupi bolong, streak dipertahankan dan ditambah hari ini
      newStreak += 1;
    }
  } else {
     // Time travel (tanggal mundur) fallback
     newStreak = 1;
  }

  return {
    streak: newStreak,
    lastActiveDate: todayStr,
    freezeCount: newFreezeCount,
    freezeUsed,
    isReset
  };
}
