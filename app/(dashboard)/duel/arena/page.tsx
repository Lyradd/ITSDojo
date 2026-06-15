"use client";

import { Card } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Swords, ArrowLeft, Copy, Users, Globe, Play, X, User } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";

type Topic = {
  id: string;
  subjectname: string;
  description?: string;
};

type Player = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

type LobbyRoom = {
  id: number;
  inviteCode: string;
  topicId: number;
  status: "waiting" | "started" | "ended" | "cancelled";
  players: Player[];
  hostId: string;
  subject?: Topic | null;
};

async function readJsonError(response: Response) {
  try {
    const data = await response.json();
    return typeof data?.error === "string" ? data.error : "Terjadi kesalahan.";
  } catch {
    return "Terjadi kesalahan.";
  }
}

function ArenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, name, email, role, avatarUrl, id } = useUserStore();

  const roomParam = searchParams.get("room");

  const [isMounted, setIsMounted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [creatingLobby, setCreatingLobby] = useState(false);

  const [roomId, setRoomId] = useState<string | null>(roomParam);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lobbyStatus, setLobbyStatus] = useState<LobbyRoom["status"]>("waiting");
  const [room, setRoom] = useState<LobbyRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [hasUserSelectedTopic, setHasUserSelectedTopic] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch topics
  useEffect(() => {
    setLoadingTopics(true);
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((item: any) => ({
          id: String(item.id),
          subjectname: item.subjectName ?? item.name ?? item.title ?? item.id,
          description: item.description ?? item.subjectDescription ?? item.topicDescription ?? "",
        }));
        setTopics(mapped);
      })
      .catch(() => setTopics([]))
      .finally(() => setLoadingTopics(false));
  }, []);

  // Guest flow: join the room automatically if logged in
  useEffect(() => {
    if (!isMounted || !isLoggedIn || !roomParam || joinAttempted) return;

    const joinRoom = async () => {
      setJoinAttempted(true);
      try {
        const response = await fetch(`/api/duel/arena/lobbies/${roomParam}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: email,
            playerEmail: email,
            playerName: name,
            playerAvatar: avatarUrl || "bg-green-200 text-green-700",
            playerRole: role,
          }),
        });

        if (!response.ok) {
          setError(await readJsonError(response));
        } else {
          setRoomId(roomParam);
          setInviteLink(`${window.location.origin}/duel/arena?room=${roomParam}`);
        }
      } catch (err) {
        setError("Gagal bergabung ke Arena lobby.");
      }
    };

    void joinRoom();
  }, [isMounted, isLoggedIn, roomParam, joinAttempted, email, name, avatarUrl, role]);

  // Host flow: Auto-create room when page loads if we are NOT a guest joining
  useEffect(() => {
    if (!isMounted || !isLoggedIn || roomParam || roomId || loadingTopics || topics.length === 0 || creatingLobby) return;

    const autoCreateRoom = async () => {
      setCreatingLobby(true);
      setError(null);
      // Pick first topic automatically in the database
      const defaultTopic = topics[0].id;
      try {
        const response = await fetch("/api/duel/arena/lobbies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId: defaultTopic,
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
        setRoomId(data.inviteCode);
        // Do not auto-select the topic in frontend state initially so no topic is pre-selected on load
        setInviteLink(`${window.location.origin}/duel/arena?room=${data.inviteCode}`);
        setLobbyStatus("waiting");
      } catch (err) {
        setError("Gagal membuat Arena lobby otomatis.");
      } finally {
        setCreatingLobby(false);
      }
    };

    void autoCreateRoom();
  }, [isMounted, isLoggedIn, roomParam, roomId, loadingTopics, topics, creatingLobby, email, name, role]);

  // Poll room / lobby details
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }

    let active = true;
    const syncLobby = async () => {
      try {
        const response = await fetch(`/api/duel/arena/lobbies/${encodeURIComponent(roomId)}?playerId=${encodeURIComponent(id)}`);
        if (!response.ok) {
          if (active) {
            setError(await readJsonError(response));
            setLobbyStatus("cancelled");
          }
          return;
        }

        const data = (await response.json()) as LobbyRoom;
        if (!active) return;

        setRoom(data);
        setLobbyStatus(data.status);
        setError(null);

        const isHost = data.hostId === id;
        if (data.topicId) {
          const currentTopicStr = String(data.topicId);
          if (selectedTopic !== currentTopicStr) {
            // If we are a guest, always sync selected topic. If host, only sync if explicitly selected.
            if (!isHost || hasUserSelectedTopic) {
              setSelectedTopic(currentTopicStr);
            }
          }
        }

        // Redirect if game has started
        if (data.status === "started") {
          router.push(`/duel/arena/${data.topicId}?room=${roomId}`);
        }
      } catch (err) {
        if (active) {
          setError("Gagal sinkronisasi data lobby.");
        }
      }
    };

    void syncLobby();
    const interval = window.setInterval(syncLobby, 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [roomId, selectedTopic, router, id, hasUserSelectedTopic]);

  // Change topic (Host only)
  const handleTopicSelect = async (topicId: string) => {
    if (!roomId || room?.hostId !== id) return;

    setError(null);
    try {
      const response = await fetch(`/api/duel/arena/lobbies/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });

      if (!response.ok) {
        setError(await readJsonError(response));
        return;
      }

      setSelectedTopic(topicId);
      setHasUserSelectedTopic(true);
    } catch {
      setError("Gagal mengubah topik Arena.");
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    if (!roomId || !selectedTopic) return;

    try {
      const response = await fetch(`/api/duel/arena/lobbies/${roomId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        setError(await readJsonError(response));
        return;
      }

      router.push(`/duel/arena/${selectedTopic}?room=${roomId}`);
    } catch (err) {
      setError("Gagal memulai Arena.");
    }
  };

  const handleLeaveLobby = async () => {
    if (roomId && email) {
      try {
        await fetch(`/api/duel/arena/lobbies/${roomId}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: email }),
        });
      } catch (err) {
        console.error("Error leaving lobby:", err);
      }
    }
    router.push("/duel");
  };

  // Login prompt for guest
  if (isMounted && !isLoggedIn && roomParam) {
    const loginUrl = `/login?redirectTo=${encodeURIComponent(window.location.href)}`;
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl min-h-screen flex items-center justify-center">
        <Card className="p-8 border border-zinc-200 dark:border-blue-900 bg-card/80 backdrop-blur-md shadow-2xl rounded-3xl text-center">
          <Globe className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold mb-3 text-zinc-800 dark:text-zinc-100">
            Bergabung ke Arena Multiplayer
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
            Anda diundang untuk bermain dalam Arena multiplayer. Silakan masuk terlebih dahulu untuk bergabung ke room ini.
          </p>
          <Button onClick={() => router.push(loginUrl)} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold cursor-pointer">
            Masuk Sekarang
          </Button>
        </Card>
      </div>
    );
  }

  if (!isMounted || !isLoggedIn) return null;

  const isHost = room ? room.hostId === id : true;
  const activeTopicId = hoveredTopic ?? selectedTopic;
  const activeTopicData = topics.find((topic) => topic.id === activeTopicId);
  const selectedTopicData = topics.find((topic) => topic.id === selectedTopic);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
              Multiplayer Arena
            </h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            {isHost
              ? "Kelola lobby Arena Anda dan undang pemain untuk bersaing bersama secara real-time."
              : "Menunggu host memulai Arena..."}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLeaveLobby} className="flex items-center gap-2 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
          <span>Keluar Arena</span>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
        {/* Left column: Topic list */}
        <section>
          <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-card/60 backdrop-blur-md rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                Pilih Topik Duel
              </h2>
              {isHost && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium px-2.5 py-0.5 rounded-full">
                  Host Control
                </span>
              )}
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
                      disabled={creatingLobby || !isHost}
                      className={`w-full justify-start text-left font-medium rounded-xl py-4 h-auto cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <span className="truncate">{topic.subjectname}</span>
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
          </Card>
        </section>

        {/* Right column: Room and player state */}
        <aside className="space-y-6">
          {/* Invite Code card */}
          {inviteLink && (
            <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-card/60 backdrop-blur-md rounded-2xl shadow-xl">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2">Undang Pemain</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Bagikan link ini agar teman-temanmu dapat bergabung dalam Arena ini secara real-time.
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

              <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                <p className="text-xs text-zinc-500">Topik Terpilih:</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedTopicData ? selectedTopicData.subjectname : "Belum memilih topik"}
                </p>
              </div>
            </Card>
          )}

          {/* Lobby participants */}
          <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-card/60 backdrop-blur-md rounded-2xl shadow-xl flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                Pemain Bergabung ({room?.players?.length || 0})
              </h3>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {room?.players && room.players.length > 0 ? (
                room.players.map((p) => {
                  const isUserHost = p.id === room.hostId;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('/') || p.avatar.startsWith('data:')) ? '' : p.avatar}`}>
                          {p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('/') || p.avatar.startsWith('data:')) ? (
                            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-xs uppercase">
                              {p.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                            {p.name}
                            {isUserHost && (
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded">
                                Host
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500 truncate max-w-[150px]">{p.email}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-zinc-500 text-center py-6">Belum ada pemain bergabung.</p>
              )}
            </div>

            {/* Start button for host */}
            {isHost && room && (
              <Button
                onClick={handleStartGame}
                disabled={!selectedTopic || room.players.length < 2}
                className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 fill-current" />
                {room.players.length < 2 ? "Butuh Minimal 2 Pemain" : "Mulai Arena"}
              </Button>
            )}

            {!isHost && (
              <div className="mt-6 p-3 bg-zinc-100 dark:bg-zinc-900/80 rounded-xl text-center border border-zinc-200 dark:border-zinc-800 animate-pulse">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Menunggu host memulai permainan...
                </span>
              </div>
            )}
          </Card>

          {/* Topic description details */}
          {activeTopicData && (
            <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-linear-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-xl">
              <h4 className="font-bold text-lg mb-2">{activeTopicData.subjectname}</h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                {activeTopicData.description || "Tidak ada deskripsi untuk topik ini."}
              </p>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen text-center py-20 text-zinc-500">Memuat halaman...</div>}>
      <ArenaContent />
    </Suspense>
  );
}
