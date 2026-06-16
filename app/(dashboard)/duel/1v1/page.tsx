"use client";

import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Swords, ArrowLeft, Copy, Users, Play, X, CircleQuestionMark } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type Topic = {
  id: string;
  subjectname: string;
  description?: string;
};

type LobbyRoom = {
  id: number;
  inviteCode: string;
  topicId: number;
  status: "waiting" | "joined" | "started" | "cancelled";
  host: { id: string; name: string; email: string; role: string; avatar?: string | null } | null;
  guest: { id: string; name: string; email: string; role: string; avatar?: string | null } | null;
};

const LOBBY_STATUS_TEXT: Record<LobbyRoom["status"], string> = {
  waiting: "Menunggu pemain lain bergabung...",
  joined: "Pemain kedua sudah bergabung.",
  started: "Duel sudah dimulai.",
  cancelled: "Lobby dibatalkan.",
};

async function readJsonError(response: Response) {
  try {
    const data = await response.json();
    return typeof data?.error === "string" ? data.error : "Terjadi kesalahan.";
  } catch {
    return "Terjadi kesalahan.";
  }
}

export default function DuelPage() {
  const router = useRouter();
  const { isLoggedIn, name, email, role, avatarUrl, id } = useUserStore();

  const [isMounted, setIsMounted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [creatingLobby, setCreatingLobby] = useState(false);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lobbyStatus, setLobbyStatus] = useState<LobbyRoom["status"]>("waiting");
  const [room, setRoom] = useState<LobbyRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push("/login");
    }
  }, [isMounted, isLoggedIn, router]);

  useEffect(() => {
    setLoadingTopics(true);

    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        setTopics(
          data.map((item: any) => ({
            id: item.id,
            subjectname: item.subjectName ?? item.name ?? item.title ?? item.id,
            description:
              item.description ??
              item.subjectDescription ??
              item.topicDescription ??
              "",
          }))
        );
      })
      .catch(() => setTopics([]))
      .finally(() => setLoadingTopics(false));
  }, []);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }

    let active = true;
    let retryCount = 0;
    const encodedRoomId = encodeURIComponent(roomId);

    const syncLobby = async () => {
      try {
        const response = await fetch(`/api/duel/lobbies/${encodedRoomId}`);

        if (!response.ok) {
          if (response.status === 404 && retryCount < 3) {
            retryCount += 1;
            window.setTimeout(() => {
              if (active) {
                void syncLobby();
              }
            }, 400);
            return;
          }

          if (active) {
            setError(await readJsonError(response));
            setLobbyStatus("cancelled");
          }
          return;
        }

        const data = (await response.json()) as LobbyRoom;

        if (!active) {
          return;
        }

        setRoom(data);
        setLobbyStatus(data.status);
        setError(null);

        if (data.topicId && !selectedTopic) {
          setSelectedTopic(String(data.topicId));
        }
      } catch {
        if (active) {
          setError("Gagal memuat status lobby.");
        }
      }
    };

    void syncLobby();
    const interval = window.setInterval(syncLobby, 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [roomId, selectedTopic]);

  const handleTopicSelect = async (topicId: string) => {
    setError(null);
    setCreatingLobby(true);

    if (roomId) {
      try {
        const response = await fetch(`/api/duel/lobbies/${roomId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topicId }),
        });

        if (!response.ok) {
          setError(await readJsonError(response));
          return;
        }

        setSelectedTopic(topicId);
      } catch {
        setError("Gagal mengubah topik duel.");
      } finally {
        setCreatingLobby(false);
      }
      return;
    }

    try {
      const response = await fetch("/api/duel/lobbies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicId,
          hostId: email,
          hostEmail: email,
          hostName: name,
          hostRole: role,
        }),
      });

      if (!response.ok) {
        setError(await readJsonError(response));
        return;
      }

      const data = await response.json();
      const newRoomId = data.inviteCode as string;

      setSelectedTopic(topicId);
      setRoomId(newRoomId);
      setInviteLink(`${window.location.origin}/duel/1v1/${topicId}?room=${newRoomId}`);
      setLobbyStatus("waiting");
      setRoom(null);
    } catch {
      setError("Gagal membuat lobby duel.");
    } finally {
      setCreatingLobby(false);
    }
  };

  if (!isMounted || !isLoggedIn) return null;

  const activeTopicId = hoveredTopic ?? selectedTopic;
  const activeTopicData = topics.find((topic) => topic.id === activeTopicId);



  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleStartDuel = async () => {
    if (!roomId || !selectedTopic) return;

    if (lobbyStatus !== "joined" && lobbyStatus !== "started") {
      setError("Tunggu lawan bergabung dulu.");
      return;
    }

    const response = await fetch(`/api/duel/lobbies/${roomId}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hostId: email, hostEmail: email }),
    });

    if (!response.ok) {
      setError(await readJsonError(response));
      return;
    }

    router.push(`/duel/1v1/${selectedTopic}?room=${roomId}`);
  };

  const handleCancelLobby = () => {
    if (roomId) {
      void fetch(`/api/duel/lobbies/${roomId}/cancel`, { method: "POST" });
    }

    setSelectedTopic(null);
    setRoomId(null);
    setInviteLink(null);
    setLobbyStatus("waiting");
    setRoom(null);
    setError(null);
  };

  const selectedTopicData = topics.find((topic) => topic.id === selectedTopic);

  const playersList: Array<{ id: string; name: string; email: string; avatar?: string | null; isHost: boolean }> = [];
  if (room) {
    if (room.host) {
      playersList.push({ ...room.host, isHost: true });
    }
    if (room.guest) {
      playersList.push({ ...room.guest, isHost: false });
    }
  } else if (inviteLink) {
    playersList.push({
      id: id || email,
      name: name || "",
      email: email || "",
      avatar: avatarUrl || "bg-blue-200 text-blue-700",
      isHost: true
    });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Swords className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
              Multiplayer Duel 1v1
            </h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Pilih topik, undang temanmu, dan buktikan siapa yang memiliki pengetahuan paling tajam secara real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowGuide(true)} className="flex items-center gap-2 cursor-pointer border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20">
            <CircleQuestionMark className="w-4 h-4" />
            <span>Cara Bermain</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/duel")} className="flex items-center gap-2 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
        {/* Left column: Topic list */}
        <section>
          <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-card/60 backdrop-blur-md rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                Pilih Topik Duel
              </h2>
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium px-2.5 py-0.5 rounded-full">
                Host Control
              </span>
            </div>

            {loadingTopics ? (
              <div className="py-8 text-center text-zinc-500">Memuat daftar topik...</div>
            ) : topics.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">Tidak ada topik tersedia.</div>
            ) : (
              <div className="grid gap-3">
                {topics.map((topic) => {
                  const isSelected = selectedTopic === topic.id;
                  return (
                    <Button
                      key={topic.id}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleTopicSelect(topic.id)}
                      onMouseEnter={() => setHoveredTopic(topic.id)}
                      onMouseLeave={() => setHoveredTopic(null)}
                      disabled={creatingLobby}
                      className={`w-full justify-start text-left font-medium rounded-xl py-4 h-auto cursor-pointer transition-all duration-200 ${isSelected
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                        : "hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-700 dark:hover:text-blue-300"
                        }`}
                    >
                      <span className="truncate">
                        {creatingLobby && selectedTopic === topic.id ? "Membuat lobby..." : topic.subjectname}
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
          </Card>
        </section>

        {/* Right column: Room and player state */}
        <aside className="space-y-6">
          {inviteLink && (
            <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-card/60 backdrop-blur-md rounded-2xl shadow-xl">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2">Undang Temanmu</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Bagikan link ini agar temanmu dapat bergabung dalam lobby ini.
              </p>

              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs font-mono outline-none"
                />
                <Button onClick={handleCopyLink} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer shrink-0">
                  <Copy className="w-4 h-4 mr-1" />
                  {copied ? "Tersalin" : "Salin"}
                </Button>
              </div>

              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl cursor-pointer text-xs" onClick={handleCancelLobby}>
                  Batalkan Lobby
                </Button>
              </div>

              <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                <p className="text-xs text-zinc-500">Topik Terpilih:</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedTopicData ? selectedTopicData.subjectname : "Belum memilih topik"}
                </p>
              </div>
            </Card>
          )}

          {inviteLink && (
            <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-card/60 backdrop-blur-md rounded-2xl shadow-xl flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                  Pemain Bergabung ({playersList.length}/2)
                </h3>
              </div>

              <div className="space-y-3">
                {playersList.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('/') || p.avatar.startsWith('data:')) ? '' : (p.avatar ?? 'bg-blue-200 text-blue-700')}`}>
                        {p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('/') || p.avatar.startsWith('data:')) ? (
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-xs uppercase">
                            {p.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          {p.name}
                          {p.isHost && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded">
                              Host
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500 truncate max-w-[150px]">{p.email}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {playersList.length < 2 && (
                  <p className="text-xs text-zinc-500 text-center py-4 italic">Menunggu pemain kedua bergabung...</p>
                )}
              </div>

              {lobbyStatus === "joined" && (
                <Button
                  onClick={handleStartDuel}
                  className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Mulai Duel 1v1
                </Button>
              )}
            </Card>
          )}

          <AnimatePresence mode="wait">
            {activeTopicData ? (
              <motion.div
                key={activeTopicData.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-linear-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-xl">
                  <h4 className="font-bold text-lg mb-2">{activeTopicData.subjectname}</h4>
                  <p className="text-xs text-blue-100 leading-relaxed">
                    {activeTopicData.description || "Tidak ada deskripsi untuk topik ini."}
                  </p>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-card/60 backdrop-blur-md rounded-2xl shadow-xl">
                  <h4 className="font-bold text-lg mb-2 text-zinc-800 dark:text-zinc-100">Silakan Pilih Topik Duel</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Arahkan kursor atau pilih salah satu topik di sebelah kiri untuk melihat deskripsi.
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guide Modal */}
          <AnimatePresence>
            {showGuide && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={() => setShowGuide(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative border-2 border-zinc-100 dark:border-zinc-800 text-zinc-850 dark:text-zinc-100"
                >
                  <button
                    onClick={() => setShowGuide(false)}
                    className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    title="Tutup"
                  >
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>

                  <div className="flex items-center gap-3 mb-6 border-b pb-4 border-zinc-100 dark:border-zinc-800">
                    <Swords className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-2xl font-black text-zinc-800 dark:text-white leading-tight">Cara Bermain Duel 1v1</h3>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Pilih Topik</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Pilih topik kuis di sebelah kiri untuk membuat lobby room baru.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Undang Teman</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Bagikan link undangan yang muncul di kolom kanan kepada teman Anda.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Mulai Duel</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Tunggu hingga lawan bergabung ke lobby, lalu klik "Mulai Duel" untuk bertanding.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        4
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Aturan Pertandingan</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Pertandingan terdiri dari minimal 3 ronde (masing-masing 3 soal). Pemain dengan jawaban benar dan tercepat mendapatkan poin tertinggi. Di akhir setiap ronde, pemain bergantian memilih topik ronde berikutnya.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-bold cursor-pointer"
                    onClick={() => setShowGuide(false)}
                  >
                    Saya Mengerti
                  </Button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}