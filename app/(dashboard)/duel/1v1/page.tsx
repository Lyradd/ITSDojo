"use client";

import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Swords, ArrowLeft, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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
  const { isLoggedIn, name, email, role } = useUserStore();

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

  if (!isMounted || !isLoggedIn) return null;

  const activeTopicId = hoveredTopic ?? selectedTopic;
  const activeTopicData = topics.find((topic) => topic.id === activeTopicId);

  const handleTopicSelect = async (topicId: string) => {
    setError(null);
    setCreatingLobby(true);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            Pilih Topik Duel
          </h1>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          Pilih topik untuk membuat link undangan duel 1v1.
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/duel")}
        className="mb-4 flex items-center gap-2 cursor-pointer">
        <ArrowLeft className="w-5 h-5" />
        <span>Kembali</span>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
        <section>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Topik Tersedia</h2>

            {loadingTopics ? (
              <div>Loading topik...</div>
            ) : topics.length === 0 ? (
              <div className="text-sm text-zinc-500">
                Tidak ada topik tersedia saat ini.
              </div>
            ) : (
              <div className="grid gap-3">
                {topics.map((topic) => (
                  <Button
                    key={topic.id}
                    variant={selectedTopic === topic.id ? "default" : "outline"}
                    onClick={() => handleTopicSelect(topic.id)}
                    onMouseEnter={() => setHoveredTopic(topic.id)}
                    onMouseLeave={() => setHoveredTopic(null)}
                    disabled={creatingLobby}
                    className="w-full cursor-pointer"
                  >
                    {creatingLobby && selectedTopic === topic.id ? "Membuat lobby..." : topic.subjectname}
                  </Button>
                ))}
              </div>
            )}

            {inviteLink ? (
              <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-blue-800 bg-zinc-50 dark:bg-blue-950 p-4">
                <h3 className="text-lg font-semibold mb-3">Undang Temanmu</h3>
                <p className="mb-3 text-sm">
                  Bagikan link undangan ini agar temanmu bisa masuk ke lobby ini.
                </p>

                <input
                  readOnly
                  value={inviteLink}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm "
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={handleCopyLink} className="flex items-center gap-2 cursor-pointer">
                    <Copy className="w-4 h-4" />
                    {copied ? "Tersalin!" : "Salin Link"}
                  </Button>
                  <Button variant="outline" className="cursor-pointer" onClick={handleCancelLobby}>
                    Batalkan
                  </Button>
                </div>

                <div className="mt-4 rounded-2xl bg-blue-50 dark:bg-blue-900 p-4 text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold">
                    {LOBBY_STATUS_TEXT[lobbyStatus]}
                  </p>
                  {room?.guest ? (
                    <div className="mt-2 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${room.guest.avatar && (room.guest.avatar.startsWith('http') || room.guest.avatar.startsWith('/') || room.guest.avatar.startsWith('data:')) ? '' : (room.guest.avatar ?? 'bg-blue-200 text-blue-700')}`}>
                        {room.guest.avatar && (room.guest.avatar.startsWith('http') || room.guest.avatar.startsWith('/') || room.guest.avatar.startsWith('data:')) ? (
                          // Image avatar
                          <img src={room.guest.avatar} alt={room.guest.name} className="w-full h-full object-cover" />
                        ) : (
                          // Colored initials avatar
                          <span className="font-bold text-sm">
                            {room.guest.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-sm">Lawanmu</p>
                        <p className="font-semibold">{room.guest.name}</p>
                      </div>
                    </div>
                  ) : (
                    <p>Belum ada pemain kedua di room ini.</p>
                  )}
                </div>

                {lobbyStatus === "joined" && (
                  <Button className="mt-4 cursor-pointer" onClick={handleStartDuel}>
                    Mulai Duel
                  </Button>
                )}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </Card>
        </section>

        <aside>
          <Card className="p-6 bg-linear-to-br from-blue-400 to-blue-600 dark:from-blue-900 dark:to-blue-700 text-zinc-100">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">Detail Topik</h2>

            <div className="overflow-hidden rounded-2xl">
              <div
                className={`transition-all duration-300 ease-out overflow-hidden ${
                  activeTopicData
                    ? "max-h-0 opacity-0"
                    : "max-h-40 opacity-100 delay-100"
                }`}
              >
                <p className="text-sm text-zinc-100">
                  Arahkan kursor ke topik untuk melihat detail.
                </p>
              </div>

              <div
                className={`transition-all duration-300 ease-out overflow-hidden text-zinc-100 py-1 ${
                  activeTopicData
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0 delay-100"
                }`}
              >
                {activeTopicData ? (
                  <>
                    <h3 className="text-2xl font-bold mb-3">
                      {activeTopicData.subjectname}
                    </h3>
                    <p className="text-zinc-100">
                      {activeTopicData.description?.trim()
                        ? activeTopicData.description
                        : "Deskripsi tidak tersedia untuk topik ini."}
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}