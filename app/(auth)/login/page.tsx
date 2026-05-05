"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, LogIn, GraduationCap, Users, Shield } from "lucide-react";
import dynamic from "next/dynamic";

// Lazy-load the Three.js scene (SSR disabled — Three needs browser/WebGL context)
const LoginScene = dynamic(
  () => import('@/components/three/login-scene').then(m => ({ default: m.LoginScene })),
  { ssr: false, loading: () => null }
);

export default function LoginPage() {
  const router = useRouter();
  const { login, setRole } = useUserStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'mahasiswa' | 'asdos' | 'dosen' | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [transitioningRole, setTransitioningRole] = useState<'mahasiswa' | 'asdos' | 'dosen' | null>(null);

  useEffect(() => {
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleRoleSelect = (role: 'mahasiswa' | 'asdos' | 'dosen') => {
    setSelectedRole(role);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    setIsLoading(true);

    setTimeout(() => {
      setRole(selectedRole);
      login();
      setIsLoading(false);
      setTransitioningRole(selectedRole); // Trigger full screen transition
      
      // Delay routing to let the full screen wipe finish and show the animation
      setTimeout(() => {
        if (selectedRole === 'dosen') {
          router.push('/dosen');
        } else if (selectedRole === 'asdos') {
          router.push('/asdos');
        } else {
          router.push('/learn');
        }
      }, 1500);
    }, 1000);
  };

  return (
    <>
      {/* Splash Screen Transition */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-white"
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.div
              className="flex items-center gap-3"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.4 } }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-blue-600">
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                  <path d="M22 10v6" />
                  <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                </svg>
              </motion.div>
              <div className="flex tracking-tight text-6xl font-bold text-blue-600 px-1">
                {"ITSDojo".split('').map((letter, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.4 + index * 0.1,
                      duration: 0.5,
                      type: "spring",
                      damping: 12,
                      stiffness: 100
                    }}
                    className="inline-block"
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 px-4 overflow-hidden">
      {/* 3D WebGL Background */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <LoginScene />
      </div>

      {/* Subtle light/dark gradient overlay to soften the 3D shapes */}
      <div className="fixed inset-0 z-[1] bg-white/40 dark:bg-transparent pointer-events-none" aria-hidden="true" />

      {/* Login Card — floats above the 3D scene */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl border-2 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-10 h-10 text-blue-600" />
            <CardTitle className="text-3xl font-bold text-blue-600">
              ITSDojo
            </CardTitle>
          </div>
          <CardDescription className="text-base">
            Platform Gamifikasi Pembelajaran Modern
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative overflow-hidden min-h-[360px]">
          <AnimatePresence mode="wait">
            {!selectedRole ? (
              // Role Selection
              <motion.div 
                key="role-selection"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2">
                    Pilih Role Anda
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Masuk sebagai mahasiswa atau dosen
                  </p>
                </div>

                <button
                  onClick={() => handleRoleSelect('mahasiswa')}
                  className="w-full p-6 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                      <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-lg text-zinc-800 dark:text-zinc-100">
                        Mahasiswa
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Akses pembelajaran & evaluasi
                      </div>
                    </div>
                    <div className="text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                      →
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('asdos')}
                  className="w-full p-6 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-xl group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                      <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-lg text-zinc-800 dark:text-zinc-100">
                        Asisten Dosen
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Monitoring & read-only access
                      </div>
                    </div>
                    <div className="text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                      →
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('dosen')}
                  className="w-full p-6 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/50 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                      <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-lg text-zinc-800 dark:text-zinc-100">
                        Dosen
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Dashboard admin & monitoring
                      </div>
                    </div>
                    <div className="text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                      →
                    </div>
                  </div>
                </button>

                {/* Developer Shortcut */}
                <div className="pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('admin');
                      login();
                      router.push('/admin');
                    }}
                    className="text-[10px] font-bold text-zinc-400 hover:text-blue-500 uppercase tracking-widest transition-colors flex items-center gap-1.5 opacity-50 hover:opacity-100"
                  >
                    <Shield className="w-3 h-3" />
                    Bypass to Super Admin (Dev Only)
                  </button>
                </div>
              </motion.div>
            ) : (
              // Login Form
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin} 
                className="space-y-4"
              >
              <div className={`mb-4 p-3 rounded-lg border flex items-center gap-2 text-sm ${
                selectedRole === 'mahasiswa' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 text-blue-800 dark:text-blue-300' :
                selectedRole === 'asdos' ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800 text-green-800 dark:text-green-300' :
                'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800 text-purple-800 dark:text-purple-300'
              }`}>
                <span className="font-medium text-zinc-600 dark:text-zinc-400">
                  Login sebagai:
                </span>
                <span className={`font-bold ${
                  selectedRole === 'mahasiswa' ? 'text-blue-600' :
                  selectedRole === 'asdos' ? 'text-green-600' :
                  'text-purple-600'
                }`}>
                  {selectedRole === 'mahasiswa' ? '👨‍🎓 Mahasiswa' : selectedRole === 'asdos' ? '👨‍🏫 Asisten Dosen' : '👨‍🏫 Dosen'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="ml-auto text-xs hover:underline opacity-80"
                >
                  Ganti
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={selectedRole === 'dosen' ? 'dosen@its.ac.id' : 'nrp@student.its.ac.id'}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password"
                  className="h-11"
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`w-4 h-4 rounded border-zinc-300 focus:ring-2 focus:ring-offset-0 cursor-pointer ${
                    selectedRole === 'mahasiswa' ? 'text-blue-600 focus:ring-blue-500' :
                    selectedRole === 'asdos' ? 'text-green-600 focus:ring-green-500' :
                    'text-purple-600 focus:ring-purple-500'
                  }`}
                />
                <Label 
                  htmlFor="remember-me" 
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Remember Me
                </Label>
              </div>
            
              <Button 
                className={`w-full h-11 font-bold ${
                  selectedRole === 'mahasiswa' ? 'bg-blue-600 hover:bg-blue-700' :
                  selectedRole === 'asdos' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-purple-600 hover:bg-purple-700'
                }`}
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Masuk
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                Demo mode - klik "Masuk" untuk melanjutkan
              </div>
            </motion.form>
          )}
          </AnimatePresence>
        </CardContent>

        {!selectedRole && (
          <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground border-t pt-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              💡 Pilih role untuk melihat fitur yang berbeda
            </p>
          </CardFooter>
        )}
      </Card>

      {/* Full Screen Login Transition */}
      <AnimatePresence>
        {transitioningRole && (
          <motion.div
            className={`fixed inset-0 z-100 flex items-center justify-center ${
              transitioningRole === 'mahasiswa' ? 'bg-blue-600' :
              transitioningRole === 'asdos' ? 'bg-green-600' :
              'bg-purple-600'
            }`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-white">
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                <path d="M22 10v6" />
                <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
              </svg>
              <div className="flex tracking-tight text-6xl font-bold px-1 text-white">
                {"ITSDojo".split('').map((letter, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.3 + index * 0.1,
                      duration: 0.5,
                      type: "spring",
                      damping: 12,
                      stiffness: 100
                    }}
                    className="inline-block"
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
