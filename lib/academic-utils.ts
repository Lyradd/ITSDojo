/**
 * Utility functions for Academic calculations
 * Handles conversion between 'Semester' and 'Angkatan' based on current real-world time.
 */

/**
 * Menerjemahkan angka 'Semester' dari database menjadi 'Tahun Angkatan'
 * Berguna untuk merender UI Leaderboard tanpa perlu mengubah skema database.
 * 
 * @param semester Angka semester saat ini (contoh: 6)
 * @param currentDate Tanggal saat ini (opsional, default: waktu sistem)
 * @returns Tahun Angkatan (contoh: 2023)
 */
export function getAngkatanFromSemester(semester: number, currentDate = new Date()): number {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() is 0-indexed (0 = Jan, 11 = Dec)
  
  // Tahun akademik di Indonesia biasanya dimulai bulan Agustus (Bulan 8).
  // Jika sekarang sebelum Agustus (misal Mei), berarti kita masih di tahun akademik tahun lalu.
  // Contoh: Mei 2026 itu masuknya Tahun Akademik 2025/2026.
  const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1;
  
  // Logika pembagian tahun studi:
  // Semester 1 & 2 = Tahun ke-0 kuliah (0 years ago)
  // Semester 3 & 4 = Tahun ke-1 kuliah (1 year ago)
  // Semester 5 & 6 = Tahun ke-2 kuliah (2 years ago)
  const yearsOfStudy = Math.ceil(semester / 2) - 1;
  
  // Angkatan = Tahun Akademik yang sedang berjalan dikurangi lama dia kuliah
  return academicYear - yearsOfStudy;
}

/**
 * Menerjemahkan 'Tahun Angkatan' menjadi 'Semester' yang sedang berjalan.
 * Berguna jika form pendaftaran menggunakan input 'Angkatan' tapi DB butuh 'Semester'.
 * 
 * @param angkatan Tahun angkatan masuk (contoh: 2023)
 * @param currentDate Tanggal saat ini (opsional, default: waktu sistem)
 * @returns Angka semester yang seharusnya (contoh: 6)
 */
export function getSemesterFromAngkatan(angkatan: number, currentDate = new Date()): number {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1;
  const yearsDifference = academicYear - angkatan;
  
  if (yearsDifference < 0) return 1; // Mahasiswa baru dari masa depan (fallback)
  
  const baseSemester = yearsDifference * 2;
  
  // Semester Ganjil (Gasal): Agustus - Januari (Bulan 8-12, 1)
  // Semester Genap: Februari - Juli (Bulan 2-7)
  const isEvenSemester = currentMonth >= 2 && currentMonth <= 7;
  
  return baseSemester + (isEvenSemester ? 2 : 1);
}
