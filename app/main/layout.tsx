// app/(main)/layout.tsx
import { Navbar } from "@/components/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar /> {/* Navbar hanya ada di sini */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}