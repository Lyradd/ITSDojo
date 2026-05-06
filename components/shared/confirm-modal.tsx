"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Konfirmasi", 
  cancelText = "Batal",
  variant = 'warning'
}: ConfirmModalProps) {
  
  const iconColors = {
    danger: "bg-red-50 dark:bg-red-900/30 text-red-500",
    warning: "bg-orange-50 dark:bg-orange-900/30 text-orange-500",
    info: "bg-blue-50 dark:bg-blue-900/30 text-blue-500"
  };

  const confirmColors = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-orange-500 hover:bg-orange-600 text-white",
    info: "bg-blue-600 hover:bg-blue-700 text-white"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border-2 border-zinc-100 dark:border-zinc-800"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
            
            <div className="flex flex-col items-center text-center">
               <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${iconColors[variant]}`}>
                  <AlertTriangle className="w-10 h-10" />
               </div>
               <h3 className="text-2xl font-black mb-3 text-zinc-800 dark:text-white leading-tight">{title}</h3>
               <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
                 {message}
               </p>
               
               <div className="flex flex-col gap-3 w-full">
                  <Button 
                    className={`w-full rounded-2xl h-14 shadow-lg font-bold text-md transition-all active:scale-95 ${confirmColors[variant]}`}
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                  >
                    {confirmText}
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full rounded-2xl h-12 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-bold"
                    onClick={onClose}
                  >
                    {cancelText}
                  </Button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
