import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SkillTree } from "@/components/skilltree";
import { ChevronLeft } from "lucide-react";

// Mengambil parameter URL (Next.js 15/16)
export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Tombol Kembali */}
      <div className="mb-6">
        <Link href="/courses">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Kembali ke Daftar Kursus
          </Button>
        </Link>
      </div>

      {/* Header Kursus */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold capitalize">
            {courseId.replace('-', ' ')} Adventure
          </h1>
          <p className="text-zinc-500">Selesaikan node untuk membuka materi selanjutnya.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Lanjutkan Belajar
        </Button>
      </div>

      {/* Area Skill Tree */}
      <SkillTree />
    </div>
  );
}