"use client";

import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Swords, ArrowLeft, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

function generateRoomId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

export default function DuelPage() {
  const router = useRouter();
  const { isLoggedIn } = useUserStore();

  const [isMounted, setIsMounted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<
    { id: string; subjectname: string; description?: string }[]
  >([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lobbyStatus, setLobbyStatus] = useState<"idle" | "waiting" | "joined">("idle");
  const [opponentName, setOpponentName] = useState<string | null>(null);
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

  if (!isMounted || !isLoggedIn) return null;

  const activeTopicId = hoveredTopic ?? selectedTopic;
  const activeTopicData = topics.find((topic) => topic.id === activeTopicId);

  const handleTopicSelect = async (topicId: string) => {
    setError(null);

    const newRoomId = generateRoomId();
    const newInviteLink = `${window.location.origin}/duel/1v1/${topicId}?room=${newRoomId}`;

    setSelectedTopic(topicId);
    setRoomId(newRoomId);
    setInviteLink(newInviteLink);
    setLobbyStatus("waiting");

    setTimeout(() => {
      setOpponentName("Wri Ting");
      setLobbyStatus("joined");
    }, 1500);
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleStartDuel = async () => {
    if (!roomId || !selectedTopic) return;
    router.push(`/duel/1v1/${selectedTopic}?room=${roomId}`);
  };

  const handleCancelLobby = () => {
    setSelectedTopic(null);
    setRoomId(null);
    setInviteLink(null);
    setLobbyStatus("idle");
    setOpponentName(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Kembali</span>
      </Button>

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
                    className="w-full cursor-pointer"
                  >
                    {topic.subjectname}
                  </Button>
                ))}
              </div>
            )}

            {inviteLink ? (
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="text-lg font-semibold mb-3">Undang Temanmu</h3>
                <p className="mb-3 text-sm text-zinc-600">
                  Bagikan link undangan ini agar temanmu bisa bergabung.
                </p>

                <input
                  readOnly
                  value={inviteLink}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
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

                <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-semibold">
                    {lobbyStatus === "waiting"
                      ? "Menunggu pemain lain bergabung..."
                      : "Pemain sudah bergabung."}
                  </p>
                  {opponentName ? (
                    <p>Opponent: {opponentName}</p>
                  ) : (
                    <p>Temanmu membuka link untuk join ke lobby.</p>
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
          <Card className="p-6 bg-linear-to-br from-blue-400 to-blue-600">
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
                    : "max-h-0 opacity-0 delay-200"
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