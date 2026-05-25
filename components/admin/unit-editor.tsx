import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

export const UnitSchema = z.object({
  title: z.string().min(3, "Judul unit minimal 3 karakter"),
  description: z.string().min(3, "Deskripsi minimal 3 karakter"),
  order: z.number().min(1, "Urutan minimal 1"),
});

export type UnitFormValues = z.infer<typeof UnitSchema>;

interface UnitEditorProps {
  initialData: UnitFormValues;
  saving: boolean;
  onSubmit: (data: UnitFormValues) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export default function UnitEditor({
  initialData,
  saving,
  onSubmit,
  onCancel,
  isEditing
}: UnitEditorProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UnitFormValues>({
    resolver: zodResolver(UnitSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={
      isEditing 
        ? "flex-1 space-y-3 mr-4 p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-200 dark:border-zinc-800"
        : "space-y-4"
    }>
      <div className={isEditing ? "grid grid-cols-1 md:grid-cols-3 gap-3" : "grid grid-cols-1 md:grid-cols-3 gap-4"}>
        <div className="space-y-1">
          <Label className={isEditing ? "text-xs font-bold text-zinc-700 dark:text-zinc-300" : ""}>Judul Unit *</Label>
          <Input {...register("title")} className={isEditing ? "h-9" : "h-11"} placeholder="Unit 1: Pendahuluan" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className={isEditing ? "text-xs font-bold text-zinc-700 dark:text-zinc-300" : ""}>Deskripsi *</Label>
          <Input {...register("description")} className={isEditing ? "h-9" : "h-11"} placeholder="Konsep dasar pemrograman" />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className={isEditing ? "text-xs font-bold text-zinc-700 dark:text-zinc-300" : ""}>Urutan</Label>
          <Input type="number" {...register("order", { valueAsNumber: true })} className={isEditing ? "h-9" : "h-11"} min="1" />
          {errors.order && <p className="text-red-500 text-xs mt-1">{errors.order.message}</p>}
        </div>
      </div>
      <div className={isEditing ? "flex gap-2" : "flex gap-3"}>
        <Button type="submit" disabled={saving} size={isEditing ? "sm" : "default"} className={
          isEditing
            ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 text-xs rounded-md"
            : "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 font-bold"
        }>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {!saving && !isEditing && <Save className="w-4 h-4 mr-2" />}
          {isEditing ? 'Simpan' : 'Simpan Unit'}
        </Button>
        <Button type="button" variant="outline" size={isEditing ? "sm" : "default"} className={isEditing ? "h-8 px-3 text-xs rounded-md" : ""} onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  );
}
