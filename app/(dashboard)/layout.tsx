import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      {/* SIDEBAR WRAPPER
        - Fixed position agar tidak ikut scroll
        - Width berubah: w-[88px] (icon only) -> w-[260px] (full text) di layar LG
        - Hidden di layar kecil (mobile) jika ingin navbar bawah (opsional), 
          tapi sesuai request "sidebar kiri", kita biarkan tampil.
      */}
      <aside className="fixed inset-y-0 left-0 z-50 w-[88px] lg:w-[260px] hidden md:block">
        <Sidebar />
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      {/* Margin left menyesuaikan lebar sidebar agar konten tidak tertutup */}
      <main className="flex-1 md:ml-[88px] lg:ml-[260px]">
        {children}
      </main>
      
      {/* (Opsional) MOBILE BOTTOM NAV bisa ditambahkan di sini jika perlu nanti */}
    </div>
  );
}