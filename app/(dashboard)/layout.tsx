import { requireRole } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import ClientLayout from "./client-layout";

export default async function DashboardServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // LAKUKAN VALIDASI ROLE DI SERVER-SIDE!
  // Dashboard Mahasiswa hanya boleh diakses oleh role 'mahasiswa'
  const authError = await requireRole(['mahasiswa']);

  if (authError) {
    // Jika bukan mahasiswa (misalnya admin atau dosen), redirect ke dashboard mereka masing-masing
    // atau redirect ke login jika belum login
    if (authError.status === 401) {
      redirect('/login');
    } else {
      // Karena kita tidak tahu role sebenarnya jika forbidden, redirect ke home sementara
      redirect('/dosen');
    }
  }

  return <ClientLayout>{children}</ClientLayout>;
}
