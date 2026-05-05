"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon: React.ReactNode;
}

export function AlertModal({ isOpen, onClose, title, message, icon }: AlertModalProps) {
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
               <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-500">
                  {icon}
               </div>
               <h3 className="text-2xl font-black mb-2 text-zinc-800 dark:text-white">{title}</h3>
               <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                 {message}
               </p>
               
               <div className="w-full">
                  <Button 
                    className="w-full rounded-xl h-12 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white shadow-md font-bold"
                    onClick={onClose}
                  >
                    Mengerti
                  </Button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
