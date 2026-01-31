"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Loader2, LogIn, GraduationCap, Users } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, setRole } = useUserStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'mahasiswa' | 'asdos' | 'dosen' | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

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
      
      // Redirect based on role
      if (selectedRole === 'dosen') {
        router.push('/admin');
      } else if (selectedRole === 'asdos') {
        router.push('/admin'); // Asdos goes to admin but with read-only access
      } else {
        router.push('/learn');
      }
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 px-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
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
        
        <CardContent>
          {!selectedRole ? (
            // Role Selection
            <div className="space-y-4">
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
                  <div className="text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </div>
                </div>
              </button>
            </div>
          ) : (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">
                    Login sebagai:
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {selectedRole === 'mahasiswa' ? '👨‍🎓 Mahasiswa' : selectedRole === 'asdos' ? '👨‍🏫 Asisten Dosen' : '👨‍🏫 Dosen'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedRole(null)}
                    className="ml-auto text-xs text-blue-600 hover:underline"
                  >
                    Ganti
                  </button>
                </div>
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
                  className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
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
                  selectedRole === 'dosen' 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
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
            </form>
          )}
        </CardContent>

        {!selectedRole && (
          <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground border-t pt-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              💡 Pilih role untuk melihat fitur yang berbeda
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
