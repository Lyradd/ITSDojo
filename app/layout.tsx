import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "ITSDojo - Platform Belajar Coding & Gamifikasi",
    template: "%s | ITSDojo",
  },
  description: "ITSDojo menggabungkan pembelajaran coding intensif dengan elemen game yang adiktif. Tingkatkan level, raih lencana, dan taklukkan dunia pemrograman dengan cara yang menyenangkan.",
  keywords: ["Belajar Coding", "Gamifikasi", "ITSDojo", "Pemrograman", "Course Online", "React", "Next.js"],
  authors: [{ name: "ITSDojo Team" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://itsdojo.com",
    title: "ITSDojo - Platform Belajar Coding & Gamifikasi",
    description: "Belajar pemrograman terasa seperti bermain game RPG. Tingkatkan level, raih badge, dan pelajari materi dengan mudah di ITSDojo.",
    siteName: "ITSDojo",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ITSDojo Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ITSDojo - Platform Belajar Coding & Gamifikasi",
    description: "Belajar pemrograman terasa seperti bermain game RPG. Tingkatkan level, raih badge, dan pelajari materi dengan mudah di ITSDojo.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <main className="flex-1">
            {children}
          </main>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}