"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, History, Gem, Flame, Zap, ShieldCheck, Package } from "lucide-react";

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseHistory: { id: string, type: string, cost: number, date: string, itemName: string }[];
}

export function PurchaseHistoryModal({ isOpen, onClose, purchaseHistory }: PurchaseHistoryModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl relative border-2 border-zinc-100 dark:border-zinc-800 cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Semua Riwayat</h2>
                  <p className="text-sm text-zinc-500">Daftar lengkap transaksi Gems Anda di Dojo Store.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
               <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {purchaseHistory.map((log, index) => (
                     <motion.div 
                        key={log.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                     >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                              {log.type === 'freeze' ? <Flame className="w-6 h-6 text-orange-500" /> : 
                               log.type === 'multiplier' ? <Zap className="w-6 h-6 text-purple-500" /> :
                               log.type === 'shield-3x' ? <ShieldCheck className="w-6 h-6 text-green-500" /> :
                               <Package className="w-6 h-6 text-blue-500" />}
                           </div>
                           <div>
                              <p className="font-bold text-zinc-800 dark:text-zinc-100">{log.itemName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-zinc-400">{new Date(log.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                <p className="text-xs text-zinc-400">{new Date(log.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <div className="flex items-center gap-1 font-black text-red-500 text-lg">
                              <Gem className="w-4 h-4 fill-current" /> -{log.cost}
                           </div>
                           <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter mt-0.5">Berhasil</p>
                        </div>
                     </motion.div>
                  ))}
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <p className="text-xs font-medium text-zinc-500">
                Menampilkan total <span className="text-zinc-900 dark:text-zinc-100 font-bold">{purchaseHistory.length}</span> transaksi
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
