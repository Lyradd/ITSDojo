import { requireRole } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
    // Jika bukan mahasiswa, redirect ke dashboard mereka masing-masing
    // atau redirect ke login jika belum login
    if (authError.status === 401) {
      const headersList = await headers();
      const xUrl = headersList.get('x-url') || '';
      let relativePath = '';
      try {
        if (xUrl) {
          const parsed = new URL(xUrl);
          relativePath = parsed.pathname + parsed.search;
        }
      } catch {
        relativePath = xUrl;
      }
      const redirectTo = relativePath ? `?redirectTo=${encodeURIComponent(relativePath)}` : '';
      redirect(`/login${redirectTo}`);
    } else {
      // Karena kita tidak tahu role sebenarnya jika forbidden, redirect ke home sementara
      redirect('/dosen');
    }
  }

  return <ClientLayout>{children}</ClientLayout>;
}
