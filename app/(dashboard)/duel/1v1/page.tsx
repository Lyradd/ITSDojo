"use client";

import { Card } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { Swords } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { wsClient } from '@/lib/websocket-client';
import { LeaderboardEntry } from '@/lib/evaluation-store';

// TODO: Add to database instead
const TOPICS = [
  { id: "database", label: "Sistem Basis Data" },
  { id: "programming", label: "Programming" },
  { id: "operatingsystem", label: "Sistem Operasi" },
  { id: "trivia", label: "Trivia" },
];

type Friend = {
  name: string;
  username: string;
};

export default function DuelPage() {
  const router = useRouter();
  const { isLoggedIn, name, xp } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [step, setStep] = useState<"invite" | "topics" | "duel">("invite");
  const [friend, setFriend] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router, isMounted]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isMounted || !isLoggedIn) return;

    // Connect to WebSocket
    wsClient.connect();

    // Subscribe to connection status
    const unsubscribeStatus = wsClient.onConnectionStatus((connected) => {
      setIsConnected(connected);
    });

    // Subscribe to leaderboard updates
    const unsubscribeLeaderboard = wsClient.onLeaderboardUpdate((data) => {
      // Filter out current user from received data to prevent duplicates
      const otherUsers = data.filter(entry => entry.userId !== 'current-user');

      const allEntries = [...otherUsers];
      const sorted = allEntries.sort((a, b) => b.score - a.score);
      const ranked = sorted.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setLeaderboard(ranked);
    });

    // Wait a bit for connection then add user
    const timeout = setTimeout(() => {
      // wsClient.addUser(currentUserEntry);
    }, 500);

    // Cleanup
    return () => {
      clearTimeout(timeout);
      unsubscribeStatus();
      unsubscribeLeaderboard();
    };
  }, [isMounted, isLoggedIn, name, xp]);

  if (!isMounted || !isLoggedIn) return null;

  if (!isLoggedIn) {
    router.push('/login');
    return;
  }

  const handleInvite = () => {
    if (friend.trim()) {
      // TODO: Send invite logic here
      setStep("topics");
    }
  };

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    // TODO: Start duel logic here
    setStep("duel");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            1v1 Brain Duel
          </h1>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          Tantang teman-temanmu dalam duel otak yang seru dan lihat siapa yang keluar sebagai pemenang!
        </p>
      </div>

      {/* Invite Step */}
      {step === "invite" && (
        <Card className="p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Undang Teman</h2>
          <Input
            placeholder="Masukkan username atau email teman"
            value={friend}
            onChange={e => setFriend(e.target.value)}
            className="mb-4"
          />
          <Button variant={'default'} onClick={handleInvite} disabled={!friend.trim()} className="mb-6 cursor-pointer w-full">
            Kirim Undangan
          </Button>
          <div>
            <div className="font-bold mb-2 text-zinc-700">Atau pilih dari daftar teman:</div>
            <div className="flex flex-col gap-2">
              {leaderboard.map((entry, index) => (
                <Button
                  key={entry.name}
                  variant="outline"
                  className="justify-start"
                  onClick={() => setFriend(entry.name)}
                >
                  <span className="font-bold mr-2">{entry.name}</span>
                  <span className="text-zinc-400 text-xs">{entry.accuracy}% Akurasi</span>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Choose Topic */}
      {step === "topics" && (
        <Card className="p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Pilih Topik Pertanyaan</h2>
          <div className="grid gap-3">
            {TOPICS.map(topic => (
              <Button
                key={topic.id}
                variant={selectedTopic === topic.id ? "default" : "outline"}
                onClick={() => handleTopicSelect(topic.id)}
              >
                {topic.label}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Step 3: Duel Begins */}
      {step === "duel" && (
        <Card className="p-6 max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold mb-4">Duel Dimulai!</h2>
          <p>
            Melawan <span className="font-bold">{friend}</span> pada topik <span className="font-bold">{TOPICS.find(t => t.id === selectedTopic)?.label}</span>.
          </p>
          {/* TODO: Add duel question UI here */}
        </Card>
      )}
    </div>
  );
}