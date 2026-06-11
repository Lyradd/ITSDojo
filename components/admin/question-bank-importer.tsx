"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Database, Search, Download, Loader2, ArrowLeft, X, ChevronLeft, ChevronRight,
  Terminal, CheckSquare, ToggleLeft, Type, Puzzle, AlertTriangle, Filter, PackageCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getQuestionPackagesWithCount, getQuestionBankItems } from "@/actions/question-bank";
import { cn } from "@/lib/utils";

// ==========================================
// Tipe Soal → Peruntukan Mapping
// ==========================================
const USAGE_ALLOWED_TYPES: Record<string, string[]> = {
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

const USAGE_TYPE_INFO: Record<string, { label: string; color: string; borderColor: string; bgColor: string }> = {
  lesson: { label: "Lesson", color: "text-blue-600 dark:text-blue-400", borderColor: "border-blue-200 dark:border-blue-800", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  evaluation: { label: "Evaluasi", color: "text-purple-600 dark:text-purple-400", borderColor: "border-purple-200 dark:border-purple-800", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  duel: { label: "Brain Duel", color: "text-amber-600 dark:text-amber-400", borderColor: "border-amber-200 dark:border-amber-800", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
};

function QuestionTypeBadge({ type }: { type: string }) {
  const meta = QUESTION_TYPE_META[type];
  if (!meta) return <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">{type}</span>;
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", meta.bgColor, meta.color, meta.borderColor)}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

// ==========================================
// Props
// ==========================================
interface QuestionBankImporterProps {
  courseId: string;
  usageType?: "lesson" | "evaluation" | "duel";
  onSelectItems: (items: any[]) => void;
  onClose: () => void;
  singleSelection?: boolean;
}

export function QuestionBankImporter({ courseId, usageType, onSelectItems, onClose, singleSelection = false }: QuestionBankImporterProps) {
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Determine allowed question types based on context
  const allowedTypes = usageType ? USAGE_ALLOWED_TYPES[usageType] : null;

  useEffect(() => { setCurrentPage(1); }, [selectedPackage, typeFilter, searchQuery]);

  // ==========================================
  // Fetch packages - context-aware filtering
  // ==========================================
  useEffect(() => {
    const fetchPackages = async () => {
      // Fetch all packages for this course (don't filter by usageType here)
      // We'll filter in the UI based on compatibility
      const res = await getQuestionPackagesWithCount(courseId);
      if (res.success && res.data) {
        let pkgs = res.data;

        // If we have a usageType context, only show packages whose items 
        // could potentially be compatible
        if (usageType && allowedTypes) {
          // Show packages that have the same usageType, OR packages whose items
          // contain at least some compatible question types.
          // For now, show packages matching usageType first, then others marked dimmed
          pkgs = pkgs.sort((a: any, b: any) => {
            const aMatch = a.usageType === usageType ? 0 : 1;
            const bMatch = b.usageType === usageType ? 0 : 1;
            return aMatch - bMatch;
          });
        }

        setPackages(pkgs);
      }
      setLoadingPackages(false);
    };
    fetchPackages();
  }, [courseId, usageType]);

  // ==========================================
  // Handle package selection
  // ==========================================
  const handleSelectPackage = async (pkg: any) => {
    setSelectedPackage(pkg);
    setLoadingItems(true);
    setSelectedItemIds(new Set());
    const res = await getQuestionBankItems(pkg.id);
    if (res.success && res.data) {
      setItems(res.data);
    }
    setLoadingItems(false);
  };

  // ==========================================
  // Filtered items (with type filter + search + compatibility)
  // ==========================================
  const filteredItems = useMemo(() => {
    let result = items;
    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter(i => i.questionType === typeFilter);
    }
    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.questionText.toLowerCase().includes(q));
    }
    return result;
  }, [items, typeFilter, searchQuery]);

  // Compatible items only
  const compatibleItems = useMemo(() => {
    if (!allowedTypes) return filteredItems;
    return filteredItems.filter(i => allowedTypes.includes(i.questionType));
  }, [filteredItems, allowedTypes]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // ==========================================
  // Selection handlers
  // ==========================================
  const isItemCompatible = (item: any) => {
    if (!allowedTypes) return true;
    return allowedTypes.includes(item.questionType);
  };

  const toggleItemSelection = (id: number) => {
    const item = items.find(i => i.id === id);
    if (item && !isItemCompatible(item)) return; // Can't select incompatible

    const newSelected = new Set(selectedItemIds);
    if (singleSelection) {
      newSelected.clear();
      newSelected.add(id);
    } else {
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
    }
    setSelectedItemIds(newSelected);
  };

  const handleSelectAll = () => {
    if (singleSelection) return;
    const selectableItems = compatibleItems;
    if (selectedItemIds.size === selectableItems.length && selectableItems.every(i => selectedItemIds.has(i.id))) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(selectableItems.map(i => i.id)));
    }
  };

  const handleImport = () => {
    const selectedItems = items.filter(i => selectedItemIds.has(i.id));
    onSelectItems(selectedItems);
  };

  // Count compatible items in a package
  const getPackageCompatibility = (pkg: any) => {
    if (!allowedTypes) return { compatible: true, label: "" };
    const isExactMatch = pkg.usageType === usageType;
    return {
      compatible: isExactMatch,
      label: isExactMatch ? "Kompatibel" : "Mungkin tidak kompatibel"
    };
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">

        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Impor dari Bank Soal
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-zinc-500">Pilih paket dan soal yang ingin dimasukkan</p>
                {usageType && (
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    USAGE_TYPE_INFO[usageType]?.bgColor,
                    USAGE_TYPE_INFO[usageType]?.color,
                    USAGE_TYPE_INFO[usageType]?.borderColor
                  )}>
                    Konteks: {USAGE_TYPE_INFO[usageType]?.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-zinc-50/30 dark:bg-zinc-950/30">
          {!selectedPackage ? (
            /* STEP 1: SELECT PACKAGE */
            <div className="p-5 overflow-y-auto h-full">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
                Pilih Paket Soal ({packages.length} paket)
              </h3>

              {loadingPackages ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
              ) : packages.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
                  <Database className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="text-zinc-500">Tidak ada paket soal untuk mata kuliah ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {packages.map(pkg => {
                    const compat = getPackageCompatibility(pkg);
                    const usageInfo = USAGE_TYPE_INFO[pkg.usageType];
                    return (
                      <Card
                        key={pkg.id}
                        className={cn(
                          "p-4 cursor-pointer hover:shadow-md transition-all border-2",
                          compat.compatible
                            ? "hover:border-blue-400 bg-white dark:bg-zinc-900"
                            : "opacity-60 hover:border-zinc-300 bg-zinc-50 dark:bg-zinc-900/50"
                        )}
                        onClick={() => handleSelectPackage(pkg)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm line-clamp-1">{pkg.name}</h4>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ml-2",
                            usageInfo?.bgColor, usageInfo?.color, usageInfo?.borderColor
                          )}>
                            {usageInfo?.label || pkg.usageType}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-1 mb-2">{pkg.description || 'Tidak ada deskripsi'}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                            {pkg._itemCount || 0} soal
                          </span>
                          {usageType && !compat.compatible && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {compat.label}
                            </span>
                          )}
                          {compat.compatible && usageType && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                              <PackageCheck className="w-3 h-3" />
                              {compat.label}
                            </span>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: SELECT ITEMS */
            <div className="flex flex-col h-full overflow-hidden">
              {/* Sub-header with back button and filters */}
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedPackage(null); setSelectedItemIds(new Set()); setTypeFilter("all"); setSearchQuery(""); }}>
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali
                  </Button>
                  <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
                  <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100 line-clamp-1">{selectedPackage.name}</span>
                </div>
                {/* Filters Row */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <Input
                      placeholder="Cari soal..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    <option value="all">Semua Tipe</option>
                    {Object.entries(QUESTION_TYPE_META).map(([key, meta]) => (
                      <option key={key} value={key} className="bg-white dark:bg-zinc-900 dark:text-white">
                        {meta.label}
                      </option>
                    ))}
                  </select>
                  {!singleSelection && (
                    <Button variant="outline" size="sm" onClick={handleSelectAll} className="text-xs h-8 whitespace-nowrap">
                      {selectedItemIds.size === compatibleItems.length && compatibleItems.length > 0 ? 'Batal Semua' : 'Pilih Semua'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingItems ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500 text-sm">Tidak ada soal ditemukan.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedItems.map(item => {
                      const compatible = isItemCompatible(item);
                      return (
                        <div
                          key={item.id}
                          onClick={() => compatible && toggleItemSelection(item.id)}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all flex gap-3",
                            !compatible && "opacity-40 cursor-not-allowed border-dashed",
                            compatible && "cursor-pointer",
                            compatible && selectedItemIds.has(item.id)
                              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                              : compatible
                                ? "border-zinc-200 dark:border-zinc-800 hover:border-blue-300 bg-white dark:bg-zinc-900"
                                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
                          )}
                        >
                          <div className="pt-0.5">
                            {compatible ? (
                              <input
                                type={singleSelection ? "radio" : "checkbox"}
                                checked={selectedItemIds.has(item.id)}
                                readOnly
                                className="w-4 h-4 accent-blue-600 cursor-pointer"
                              />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <QuestionTypeBadge type={item.questionType} />
                                {!compatible && (
                                  <span className="text-[9px] text-amber-600 font-bold">Tidak kompatibel</span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-zinc-400">{item.points} pts</span>
                            </div>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">{item.questionText}</p>

                            {/* MC Options Preview */}
                            {item.questionType === 'multiple_choice' && Array.isArray(item.options) && item.options.length > 0 && (
                              <div className="mt-2 grid grid-cols-2 gap-1.5">
                                {item.options.slice(0, 4).map((opt: any, i: number) => (
                                  <div key={i} className={cn(
                                    "text-[10px] p-1.5 rounded border",
                                    opt.isCorrect
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 font-bold"
                                      : "bg-zinc-50 border-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700"
                                  )}>
                                    {opt.text}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Metadata row */}
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500">
                              
                              <span>•</span>
                              <span className="capitalize">{item.difficulty}</span>
                              {item.timeLimit > 0 && (<><span>•</span><span>{item.timeLimit}s</span></>)}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-3 text-xs">
                        <div className="text-zinc-500">
                          Hal. <span className="font-semibold text-zinc-700 dark:text-zinc-200">{currentPage}</span>/<span className="font-semibold text-zinc-700 dark:text-zinc-200">{totalPages}</span> ({filteredItems.length} soal)
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-7 w-7 p-0">
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-7 w-7 p-0">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedPackage && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center">
            <div className="text-sm font-semibold text-zinc-500">
              {selectedItemIds.size} soal dipilih
              {allowedTypes && (
                <span className="text-xs font-normal text-zinc-400 ml-2">
                  (Hanya tipe {allowedTypes.map(t => QUESTION_TYPE_META[t]?.label).join(', ')} yang bisa diimpor)
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Batal</Button>
              <Button
                onClick={handleImport}
                disabled={selectedItemIds.size === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <Download className="w-4 h-4 mr-2" /> Impor {selectedItemIds.size} Soal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
