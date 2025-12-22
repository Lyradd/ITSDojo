"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRoot() {
  const router = useRouter();

  useEffect(() => {
    // Redirect langsung ke halaman Learn
    router.replace("/learn");
  }, [router]);

  return null;
}