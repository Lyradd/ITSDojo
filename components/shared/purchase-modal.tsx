"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: {
    title: string;
    cost: number;
    icon: React.ReactNode;
  } | null;
}

export function PurchaseModal({ isOpen, onClose, onConfirm, item }: PurchaseModalProps) {
  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative border-2 border-zinc-100 dark:border-zinc-800 cursor-default"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
            
            <div className="flex flex-col items-center text-center mt-4">
               <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  {item.icon}
               </div>
               <h3 className="text-2xl font-black mb-2 text-zinc-800 dark:text-white">Konfirmasi</h3>
               <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                 Anda akan menukarkan <strong className="text-blue-500">{item.cost} Gems</strong> untuk membeli <strong className="text-zinc-800 dark:text-zinc-200">{item.title}</strong>. Lanjutkan?
               </p>
               
               <div className="flex gap-3 w-full">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-12 border-2"
                    onClick={onClose}
                  >
                    Batal
                  </Button>
                  <Button 
                    className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                    onClick={onConfirm}
                  >
                    Beli Sekarang
                  </Button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
