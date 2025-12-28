"use client";

import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  LogOut,
  User,
  Bell,
  Moon,
  Globe,
  Shield,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { name, email, role, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          Kelola preferensi dan akun kamu
        </p>
      </div>

      {/* Account Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Account</h2>
        </div>
        <Separator className="mb-4" />
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-zinc-500 dark:text-zinc-400">Name</Label>
            <p className="font-semibold">{name}</p>
          </div>
          <div>
            <Label className="text-sm text-zinc-500 dark:text-zinc-400">Email</Label>
            <p className="font-semibold">{email}</p>
          </div>
          <div>
            <Label className="text-sm text-zinc-500 dark:text-zinc-400">Role</Label>
            <p className="font-semibold capitalize">{role}</p>
          </div>
        </div>
      </Card>

      {/* Preferences Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Preferences</h2>
        </div>
        <Separator className="mb-4" />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-zinc-500" />
              <div>
                <p className="font-semibold">Notifications</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Receive notifications about updates
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-zinc-500" />
              <div>
                <p className="font-semibold">Theme</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Light or dark mode
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              System
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-zinc-500" />
              <div>
                <p className="font-semibold">Language</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Choose your language
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Indonesia
            </Button>
          </div>
        </div>
      </Card>

      {/* Privacy & Security Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Privacy & Security</h2>
        </div>
        <Separator className="mb-4" />
        
        <div className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Privacy Settings
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Data & Privacy
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200 dark:border-red-900">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Tindakan yang tidak dapat dibatalkan
          </p>
        </div>
        <Separator className="mb-4" />
        
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="lg"
          className="w-full gap-2"
        >
          <LogOut className="w-5 h-5" />
          Logout dari Akun
        </Button>
      </Card>
    </div>
  );
}
