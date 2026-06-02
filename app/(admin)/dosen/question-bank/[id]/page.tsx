import { db } from "@/db";
import { questionPackages, questionBankItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import QuestionPackageEditor from "../../../../../components/admin/question-package-editor";

export default async function QuestionPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const packageId = parseInt(id, 10);
  if (isNaN(packageId)) {
    return notFound();
  }

  // Fetch package metadata
  const pkg = await db.query.questionPackages.findFirst({
    where: eq(questionPackages.id, packageId),
  });

  if (!pkg) {
    return notFound();
  }

  // Fetch questions
  const items = await db.query.questionBankItems.findMany({
    where: eq(questionBankItems.packageId, packageId),
    orderBy: [questionBankItems.order],
  });

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <QuestionPackageEditor 
        pkg={pkg}
        initialItems={items}
      />
    </div>
  );
}
