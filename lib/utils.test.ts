import { describe, it, expect } from 'vitest';
import { formatLocalDate } from './utils';

describe('formatLocalDate', () => {
  it('seharusnya mengembalikan format YYYY-MM-DD untuk tanggal awal tahun', () => {
    // 1 Januari 2026
    const date = new Date(2026, 0, 1);
    expect(formatLocalDate(date)).toBe('2026-01-01');
  });

  it('seharusnya mengembalikan format YYYY-MM-DD untuk tanggal akhir tahun', () => {
    // 31 Desember 2026
    const date = new Date(2026, 11, 31);
    expect(formatLocalDate(date)).toBe('2026-12-31');
  });

  it('seharusnya menambahkan angka 0 di depan bulan dan hari yang bernilai satuan', () => {
    // 5 Mei 2026 (Bulan ke-4 secara index)
    const date = new Date(2026, 4, 5);
    expect(formatLocalDate(date)).toBe('2026-05-05');
  });

  it('seharusnya tidak menambahkan angka 0 jika nilai bulan dan hari sudah puluhan', () => {
    // 15 November 2026 (Bulan ke-10 secara index)
    const date = new Date(2026, 10, 15);
    expect(formatLocalDate(date)).toBe('2026-11-15');
  });
});
