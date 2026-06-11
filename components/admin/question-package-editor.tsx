"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Save, Loader2, Database, Search, Plus, Trash2, GripVertical,
  Terminal, CheckSquare, ToggleLeft, Type, Puzzle, ChevronLeft, ChevronRight,
  Filter, PackagePlus, Info, AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getAllBankItemsByCourse, syncQuestionBankItems, deleteQuestionBankItem } from "@/actions/question-bank";

// ==========================================
// Mapping Tipe Soal → Peruntukan
// ==========================================
const USAGE_TYPE_ALLOWED_QUESTIONS: Record<string, string[]> = {
  lesson: ["coding"],
  evaluation: ["multiple_choice", "true_false", "short_answer", "puzzle"],
  duel: ["multiple_choice", "true_false"],
};

const QUESTION_TYPE_META: Record<string, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
  coding: { label: "Coding", icon: Terminal, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", borderColor: "border-emerald-200 dark:border-emerald-800" },
  multiple_choice: { label: "Pilihan Ganda", icon: CheckSquare, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950/30", borderColor: "border-blue-200 dark:border-blue-800" },
  true_false: { label: "Benar / Salah", icon: ToggleLeft, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950/30", borderColor: "border-amber-200 dark:border-amber-800" },
  short_answer: { label: "Jawaban Singkat", icon: Type, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-950/30", borderColor: "border-purple-200 dark:border-purple-800" },
  puzzle: { label: "Puzzle", icon: Puzzle, color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-50 dark:bg-rose-950/30", borderColor: "border-rose-200 dark:border-rose-800" },
};

function QuestionTypeBadge({ type }: { type: string }) {
  const meta = QUESTION_TYPE_META[type];
  if (!meta) return <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">{type}</span>;
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border", meta.bgColor, meta.color, meta.borderColor)}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

// ==========================================
// Props
// ==========================================
interface QuestionPackageEditorProps {
  pkg: any;
  initialItems: any[];
}

export default function QuestionPackageEditor({ pkg, initialItems }: QuestionPackageEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // RIGHT PANE: Soal dalam paket ini
  const [packageItems, setPackageItems] = useState<any[]>(initialItems);

  // LEFT PANE: Kolam soal dari seluruh bank soal mata kuliah ini
  const [poolItems, setPoolItems] = useState<any[]>([]);
  const [loadingPool, setLoadingPool] = useState(true);
  const [searchPool, setSearchPool] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Selected items from pool for batch add
  const [selectedPoolIds, setSelectedPoolIds] = useState<Set<number>>(new Set());

  // Pagination for pool
  const [poolPage, setPoolPage] = useState(1);
  const POOL_PER_PAGE = 8;

  // Allowed question types based on package usageType
  const allowedTypes = USAGE_TYPE_ALLOWED_QUESTIONS[pkg.usageType] || [];

  // Available filter options based on usageType
  const filterOptions = useMemo(() => {
    const allTypes = Object.keys(QUESTION_TYPE_META);
    // Show all types in filter dropdown but will mark incompatible ones
    return allTypes;
  }, []);

  // ==========================================
  // Fetch pool items on mount
  // ==========================================
  useEffect(() => {
    const fetchPool = async () => {
      setLoadingPool(true);
      const res = await getAllBankItemsByCourse(pkg.courseId);
      if (res.success && res.data) {
        // Exclude items already in this package (by matching questionText + questionType to avoid duplicates)
        const currentTexts = new Set(initialItems.map(i => `${i.questionText}::${i.questionType}`));
        const filtered = res.data.filter((item: any) => {
          // Don't show items from THIS package in the pool
          return item.packageId !== pkg.id;
        });
        setPoolItems(filtered);
      }
      setLoadingPool(false);
    };
    fetchPool();
  }, [pkg.courseId, pkg.id]);

  // ==========================================
  // Filtered & paginated pool
  // ==========================================
  const filteredPool = useMemo(() => {
    let result = poolItems;
    if (typeFilter !== "all") {
      result = result.filter(i => i.questionType === typeFilter);
    }
    if (searchPool.trim()) {
      const q = searchPool.toLowerCase();
      result = result.filter(i => i.questionText.toLowerCase().includes(q));
    }
    return result;
  }, [poolItems, typeFilter, searchPool]);

  const totalPoolPages = Math.ceil(filteredPool.length / POOL_PER_PAGE);
  const paginatedPool = useMemo(() => {
    const start = (poolPage - 1) * POOL_PER_PAGE;
    return filteredPool.slice(start, start + POOL_PER_PAGE);
  }, [filteredPool, poolPage]);

  // Reset page when filter changes
  useEffect(() => { setPoolPage(1); }, [typeFilter, searchPool]);

  // ==========================================
  // Check compatibility
  // ==========================================
  const isCompatible = (questionType: string) => allowedTypes.includes(questionType);

  // ==========================================
  // Add items from pool to package
  // ==========================================
  const handleAddToPackage = async (item: any) => {
    if (!isCompatible(item.questionType)) {
      toast.error(`Tipe "${QUESTION_TYPE_META[item.questionType]?.label || item.questionType}" tidak kompatibel dengan paket ${pkg.usageType}.`);
      return;
    }
    // Add to local state
    const newItem = {
      ...item,
      id: undefined, // Will be assigned by DB
      packageId: pkg.id,
      order: packageItems.length + 1,
      _isNew: true,
    };
    setPackageItems(prev => [...prev, newItem]);
    // Remove from pool view
    setPoolItems(prev => prev.filter(p => p.id !== item.id));
    setSelectedPoolIds(prev => { const n = new Set(prev); n.delete(item.id); return n; });
    toast.success("Soal ditambahkan ke paket!");
  };

  const handleBatchAdd = () => {
    const selected = poolItems.filter(i => selectedPoolIds.has(i.id));
    const incompatible = selected.filter(i => !isCompatible(i.questionType));
    if (incompatible.length > 0) {
      toast.error(`${incompatible.length} soal tidak kompatibel dan dilewati.`);
    }
    const compatible = selected.filter(i => isCompatible(i.questionType));
    if (compatible.length === 0) return;

    const newItems = compatible.map((item, idx) => ({
      ...item,
      id: undefined,
      packageId: pkg.id,
      order: packageItems.length + idx + 1,
      _isNew: true,
    }));
    setPackageItems(prev => [...prev, ...newItems]);
    // Remove added items from pool
    const addedIds = new Set(compatible.map(i => i.id));
    setPoolItems(prev => prev.filter(p => !addedIds.has(p.id)));
    setSelectedPoolIds(new Set());
    toast.success(`${compatible.length} soal ditambahkan ke paket!`);
  };

  // ==========================================
  // Remove item from package
  // ==========================================
  const handleRemoveFromPackage = (index: number) => {
    const item = packageItems[index];
    setPackageItems(prev => prev.filter((_, i) => i !== index));
    // If item existed in pool (has original id from another package), add it back
    if (item._isNew && item.id) {
      // was from pool, restore
    }
    toast.success("Soal dihapus dari paket");
  };

  // ==========================================
  // Save
  // ==========================================
  const handleSave = async () => {
    setSaving(true);
    try {
      const itemsToSync = packageItems.map((item, idx) => ({
        questionText: item.questionText,
        questionType: item.questionType,
        options: item.options,
        correctAnswer: item.correctAnswer,
        puzzlePairs: item.puzzlePairs,
        difficulty: item.difficulty || "medium",
        points: item.points || 10,
        timeLimit: item.timeLimit,
        order: idx + 1,
      }));

      const res = await syncQuestionBankItems(pkg.id, itemsToSync as any);
      if (!res.success) throw new Error(res.error || "Failed");

      toast.success("Paket soal berhasil disimpan!");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan paket soal");
    } finally {
      setSaving(false);
    }
  };

  // Toggle pool selection
  const togglePoolSelect = (id: number) => {
    setSelectedPoolIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // ==========================================
  // USAGE TYPE INFO
  // ==========================================
  const usageTypeInfo: Record<string, { label: string; desc: string; color: string }> = {
    lesson: { label: "Lesson (Latihan)", desc: "Hanya menerima soal tipe Coding", color: "text-blue-600 dark:text-blue-400" },
    evaluation: { label: "Evaluasi (Ujian)", desc: "Menerima: Pilihan Ganda, Benar/Salah, Jawaban Singkat, Puzzle", color: "text-purple-600 dark:text-purple-400" },
    duel: { label: "Brain Duel (PvP)", desc: "Hanya menerima: Pilihan Ganda, Benar/Salah", color: "text-amber-600 dark:text-amber-400" },
  };

  const currentUsageInfo = usageTypeInfo[pkg.usageType] || { label: pkg.usageType, desc: "", color: "" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1">
              <Database className="w-4 h-4" />
              Editor Paket Soal
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">{pkg.name}</h1>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Simpan Perubahan
        </Button>
      </div>

      {/* Usage Type Info Banner */}
      <Card className={cn("p-4 rounded-2xl border-2 flex items-start gap-3",
        pkg.usageType === 'lesson' && "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20",
        pkg.usageType === 'evaluation' && "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20",
        pkg.usageType === 'duel' && "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20",
      )}>
        <Info className={cn("w-5 h-5 mt-0.5 shrink-0", currentUsageInfo.color)} />
        <div>
          <div className={cn("font-bold text-sm", currentUsageInfo.color)}>{currentUsageInfo.label}</div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{currentUsageInfo.desc}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {allowedTypes.map(t => <QuestionTypeBadge key={t} type={t} />)}
          </div>
        </div>
      </Card>

      {/* ==========================================
          SPLIT-PANE LAYOUT
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ===================== LEFT PANE: KOLAM SOAL ===================== */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Kolam Soal
              <span className="text-xs font-normal text-zinc-500 ml-1">({filteredPool.length} soal)</span>
            </h2>
            {selectedPoolIds.size > 0 && (
              <Button size="sm" onClick={handleBatchAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8">
                <PackagePlus className="w-3.5 h-3.5 mr-1.5" />
                Tambah {selectedPoolIds.size} Soal
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Cari soal..."
                value={searchPool}
                onChange={(e) => setSearchPool(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              <option value="all">Semua Tipe</option>
              {filterOptions.map(t => (
                <option key={t} value={t} className="bg-white dark:bg-zinc-900 dark:text-white">
                  {QUESTION_TYPE_META[t]?.label || t}
                </option>
              ))}
            </select>
          </div>

          {/* Pool List */}
          <Card className="flex-1 border-2 rounded-2xl overflow-hidden bg-white/50 dark:bg-zinc-900/50">
            <div className="overflow-y-auto max-h-[55vh] p-3 space-y-2">
              {loadingPool ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : paginatedPool.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                  <p className="text-sm text-zinc-500">Tidak ada soal ditemukan.</p>
                </div>
              ) : (
                paginatedPool.map(item => {
                  const compatible = isCompatible(item.questionType);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all group",
                        !compatible && "opacity-50 border-dashed border-zinc-200 dark:border-zinc-800",
                        compatible && selectedPoolIds.has(item.id) && "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20",
                        compatible && !selectedPoolIds.has(item.id) && "border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {compatible && (
                          <input
                            type="checkbox"
                            checked={selectedPoolIds.has(item.id)}
                            onChange={() => togglePoolSelect(item.id)}
                            className="w-4 h-4 mt-1 accent-blue-600 shrink-0 cursor-pointer"
                          />
                        )}
                        {!compatible && (
                          <AlertTriangle className="w-4 h-4 mt-1 text-zinc-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <QuestionTypeBadge type={item.questionType} />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">
                              dari: {item._packageName}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">{item.questionText}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500">
                            <span>{item.points} pts</span>
                            <span>•</span>
                            
                            <span>•</span>
                            <span className="capitalize">{item.difficulty}</span>
                          </div>
                        </div>
                        {compatible && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleAddToPackage(item); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 shrink-0"
                            title="Tambahkan ke paket"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {!compatible && (
                        <div className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Tidak kompatibel dengan paket {pkg.usageType}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pool Pagination */}
            {totalPoolPages > 1 && (
              <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  Hal. {poolPage}/{totalPoolPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setPoolPage(p => Math.max(1, p - 1))} disabled={poolPage === 1} className="h-7 w-7 p-0">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPoolPage(p => Math.min(totalPoolPages, p + 1))} disabled={poolPage === totalPoolPages} className="h-7 w-7 p-0">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ===================== RIGHT PANE: ISI PAKET ===================== */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-emerald-500" />
              Isi Paket
              <span className="text-xs font-normal text-zinc-500 ml-1">({packageItems.length} soal)</span>
            </h2>
          </div>

          <Card className="flex-1 border-2 rounded-2xl overflow-hidden bg-white/50 dark:bg-zinc-900/50">
            <div className="overflow-y-auto max-h-[55vh] p-3 space-y-2">
              {packageItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
                  <PackagePlus className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                  <p className="text-sm text-zinc-500 mb-1">Paket ini belum memiliki soal.</p>
                  <p className="text-xs text-zinc-400">Pilih soal dari Kolam Soal di sebelah kiri untuk menambahkannya.</p>
                </div>
              ) : (
                packageItems.map((item, index) => (
                  <div
                    key={`pkg-${index}-${item.questionText?.slice(0, 20)}`}
                    className="p-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 group hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <QuestionTypeBadge type={item.questionType} />
                          <span className="text-[10px] font-bold text-zinc-400">{item.points} pts</span>
                        </div>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">{item.questionText}</p>
                        
                        {/* Preview for MC options */}
                        {item.questionType === 'multiple_choice' && Array.isArray(item.options) && item.options.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            {item.options.slice(0, 4).map((opt: any, i: number) => (
                              <div key={i} className={cn(
                                "text-[10px] px-2 py-1 rounded border",
                                opt.isCorrect 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 font-bold" 
                                  : "bg-zinc-50 border-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700"
                              )}>
                                {opt.text}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Preview for TF */}
                        {item.questionType === 'true_false' && item.correctAnswer && (
                          <div className="mt-1.5 text-[10px] text-zinc-500">
                            Jawaban: <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.correctAnswer === 'true' ? 'Benar' : 'Salah'}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveFromPackage(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                        title="Hapus dari paket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Package Stats Footer */}
            {packageItems.length > 0 && (
              <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-zinc-500">
                  <span>Total: <span className="font-bold text-zinc-700 dark:text-zinc-200">{packageItems.reduce((sum, i) => sum + (i.points || 0), 0)} pts</span></span>
                  <span>•</span>
                  <span>{packageItems.length} soal</span>
                </div>
                <div className="flex gap-1.5">
                  {[...new Set(packageItems.map(i => i.questionType))].map(t => (
                    <QuestionTypeBadge key={t} type={t} />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
