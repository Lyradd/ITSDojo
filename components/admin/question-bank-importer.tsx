"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Search, Download, Loader2, ArrowLeft, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getQuestionPackages, getQuestionBankItems } from "@/actions/question-bank";

interface QuestionBankImporterProps {
  courseId: string;
  usageType?: "lesson" | "evaluation" | "duel";
  onSelectItems: (items: any[]) => void;
  onClose: () => void;
  singleSelection?: boolean; // If true, only one item can be selected (useful for Lesson)
}

export function QuestionBankImporter({ courseId, usageType, onSelectItems, onClose, singleSelection = false }: QuestionBankImporterProps) {
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchPackages = async () => {
      const res = await getQuestionPackages(courseId, usageType);
      if (res.success && res.data) {
        setPackages(res.data);
      }
      setLoadingPackages(false);
    };
    fetchPackages();
  }, [courseId, usageType]);

  const handleSelectPackage = async (pkg: any) => {
    setSelectedPackage(pkg);
    setLoadingItems(true);
    const res = await getQuestionBankItems(pkg.id);
    if (res.success && res.data) {
      setItems(res.data);
    }
    setLoadingItems(false);
  };

  const toggleItemSelection = (id: number) => {
    const newSelected = new Set(selectedItemIds);
    if (singleSelection) {
      newSelected.clear();
      newSelected.add(id);
    } else {
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    }
    setSelectedItemIds(newSelected);
  };
  
  const handleSelectAll = () => {
    if (singleSelection) return;
    if (selectedItemIds.size === items.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(items.map(i => i.id)));
    }
  };

  const handleImport = () => {
    const selectedItems = items.filter(i => selectedItemIds.has(i.id));
    onSelectItems(selectedItems);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Impor dari Bank Soal
              </h2>
              <p className="text-sm text-zinc-500">Pilih paket dan soal yang ingin dimasukkan</p>
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
            <div className="p-6 overflow-y-auto h-full">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Pilih Paket Soal</h3>
              
              {loadingPackages ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
              ) : packages.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
                  <Database className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="text-zinc-500">Tidak ada paket soal untuk kategori ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map(pkg => (
                    <Card 
                      key={pkg.id} 
                      className="p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all border-2 bg-white dark:bg-zinc-900"
                      onClick={() => handleSelectPackage(pkg)}
                    >
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-100 mb-1">{pkg.name}</h4>
                      <p className="text-xs text-zinc-500 line-clamp-2">{pkg.description || 'Tidak ada deskripsi'}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: SELECT ITEMS */
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 bg-white dark:bg-zinc-900">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedPackage(null); setSelectedItemIds(new Set()); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Paket
                </Button>
                <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />
                <span className="font-bold text-zinc-800 dark:text-zinc-100">{selectedPackage.name}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {loadingItems ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                ) : items.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500">Paket ini belum memiliki soal.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!singleSelection && (
                      <div className="flex justify-end mb-2">
                        <Button variant="outline" size="sm" onClick={handleSelectAll}>
                          {selectedItemIds.size === items.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                        </Button>
                      </div>
                    )}
                    
                    {items.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => toggleItemSelection(item.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex gap-4 bg-white dark:bg-zinc-900 ${
                          selectedItemIds.has(item.id) 
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-300'
                        }`}
                      >
                        <div className="pt-1">
                          <input 
                            type={singleSelection ? "radio" : "checkbox"} 
                            checked={selectedItemIds.has(item.id)}
                            readOnly
                            className="w-5 h-5 accent-blue-600"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded uppercase tracking-wider text-zinc-500 mb-2 inline-block">
                              {item.questionType.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-bold text-zinc-400">{item.points} Pts</span>
                          </div>
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200">{item.questionText}</p>
                          
                          {/* Snippet for options if exist */}
                          {item.options && item.options.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {item.options.slice(0, 4).map((opt: any, i: number) => (
                                <div key={i} className={`text-xs p-2 rounded border ${opt.isCorrect ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 font-bold' : 'bg-zinc-50 border-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700'}`}>
                                  {opt.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Batal</Button>
              <Button 
                onClick={handleImport} 
                disabled={selectedItemIds.size === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <Download className="w-4 h-4 mr-2" /> Impor Soal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
