"use server";

import { db } from "@/db";
import { questionPackages, questionBankItems } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getQuestionPackageById(id: number) {
  try {
    const pkg = await db.query.questionPackages.findFirst({
      where: eq(questionPackages.id, id),
    });
    return { success: true, data: pkg };
  } catch (error) {
    console.error("Failed to fetch package:", error);
    return { success: false, error: "Database error" };
  }
}

export async function getQuestionPackages(courseId: string, usageType: "lesson" | "evaluation" | "duel") {
  try {
    const packages = await db.query.questionPackages.findMany({
      where: and(
        eq(questionPackages.courseId, courseId),
        eq(questionPackages.usageType, usageType)
      ),
      orderBy: [desc(questionPackages.createdAt)],
    });
    return { success: true, data: packages };
  } catch (error) {
    console.error("Failed to fetch packages:", error);
    return { success: false, error: "Database error" };
  }
}

export async function getQuestionBankItems(packageId: number) {
  try {
    const items = await db.query.questionBankItems.findMany({
      where: eq(questionBankItems.packageId, packageId),
      orderBy: [questionBankItems.order],
    });
    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch package items:", error);
    return { success: false, error: "Database error" };
  }
}

export async function createQuestionPackage(data: {
  courseId: string;
  usageType: "lesson" | "evaluation" | "duel";
  name: string;
  description?: string;
  createdBy?: string;
}) {
  try {
    const [newPackage] = await db.insert(questionPackages).values(data).returning();
    revalidatePath("/admin/evaluations/create");
    return { success: true, data: newPackage };
  } catch (error) {
    console.error("Failed to create package:", error);
    return { success: false, error: "Database error" };
  }
}

export async function createQuestionBankItem(data: {
  packageId: number;
  questionText: string;
  questionType: string;
  options?: any;
  correctAnswer?: string;
  puzzlePairs?: any;
  bloomLevel?: string;
  difficulty?: string;
  points?: number;
  timeLimit?: number;
  order?: number;
}) {
  try {
    const [newItem] = await db.insert(questionBankItems).values(data).returning();
    return { success: true, data: newItem };
  } catch (error) {
    console.error("Failed to create item:", error);
    return { success: false, error: "Database error" };
  }
}

export async function updateQuestionBankItem(id: number, data: Partial<typeof questionBankItems.$inferInsert>) {
  try {
    const [updatedItem] = await db.update(questionBankItems).set(data).where(eq(questionBankItems.id, id)).returning();
    return { success: true, data: updatedItem };
  } catch (error) {
    console.error("Failed to update item:", error);
    return { success: false, error: "Database error" };
  }
}

export async function deleteQuestionBankItem(id: number) {
  try {
    await db.delete(questionBankItems).where(eq(questionBankItems.id, id));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete item:", error);
    return { success: false, error: "Database error" };
  }
}

export async function deleteQuestionPackage(id: number) {
  try {
    await db.delete(questionPackages).where(eq(questionPackages.id, id));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete package:", error);
    return { success: false, error: "Database error" };
  }
}

export async function syncQuestionBankItems(packageId: number, items: Partial<typeof questionBankItems.$inferInsert>[]) {
  try {
    // Gunakan Transaction untuk mencegah data loss saat koneksi putus
    await db.transaction(async (tx) => {
      // 1. Delete existing
      await tx.delete(questionBankItems).where(eq(questionBankItems.packageId, packageId));
      
      // 2. Insert new
      if (items && items.length > 0) {
        await tx.insert(questionBankItems).values(
          items.map(item => ({
            ...item,
            packageId
          } as typeof questionBankItems.$inferInsert))
        );
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to sync items:", error);
    return { success: false, error: "Database error" };
  }
}
