import { useNavigate } from 'react-router-dom';

// 型定義
export type Candidate = {
  id: string;
  musicName: string;
  votes: number;
  previewUrl?: string;
};

type RankingViewProps = {
  candidates: Candidate[];
};

export function RankingView({ candidates }: RankingViewProps) {
  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);
  const maxVotes = Math.max(...candidates.map((c) => c.votes), 1);
  const medals = ["🥇", "🥈", "🥉"];
  const top5 = sortedCandidates.slice(0, 5);

  // SNSシェア機能
  const handleSNSShare = () => {
    const shopName = "Request the BGM";
    const rankingText = top5
      .map((c, idx) => `${idx + 1}位：${c.musicName}`)
      .join("\n");

    const message = `🎵 ${shopName} 本日のBGMランキング TOP5！\n\n${rankingText}\n\n#BGMリクエスト #ハッカソン`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    window.open(shareUrl, "_blank", "noreferrer");
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto w-full">
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#888", textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          🎵 BGM Ranking
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 900, textAlign: "center", color: "#111", marginTop: 4 }}>
          現在のランキング
        </h1>
      </div>

      {/* SNS投稿ボタン */}
      <button
        onClick={handleSNSShare}
        style={{
          width: "100%",
          background: "#1d9bf0",
          color: "#fff",
          border: "3px solid #111",
          borderRadius: 16,
          padding: "14px",
          fontSize: 16,
          fontWeight: 900,
          cursor: "pointer",
          boxShadow: "6px 6px 0px #111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 20 }}>🐦</span>
        TOP5をXでシェアする
      </button>

      <div style={{
        background: "#fff",
        border: "2.5px solid #111",
        borderRadius: 20,
        padding: "8px 0",
        boxShadow: "4px 4px 0px #111",
      }}>
        {sortedCandidates.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", padding: "32px 0", fontSize: 14 }}>
            まだ候補曲がありません
          </p>
        ) : (
          sortedCandidates.map((c, idx) => {
            const pct = Math.round((c.votes / maxVotes) * 100);
            return (
              <div key={c.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderBottom: idx < sortedCandidates.length - 1 ? "1.5px solid #eee" : "none",
              }}>
                <div style={{ width: 32, textAlign: "center", fontSize: idx < 3 ? 22 : 14, fontWeight: 900, color: "#111", flexShrink: 0 }}>
                  {idx < 3 ? medals[idx] : `${idx + 1}`}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>
                    {c.musicName}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#111", borderRadius: 99, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#888", flexShrink: 0 }}>
                      {c.votes}票
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Ranking() {
  const navigate = useNavigate();
  const dummy: Candidate[] = [
    { id: '1', musicName: '怪獣の花唄 / Vaundy', votes: 120 },
    { id: '2', musicName: 'アイドル / YOASOBI', votes: 98 },
    { id: '3', musicName: 'Subtitle / Official髭男dism', votes: 75 },
    { id: '4', musicName: 'ダンスホール / Mrs. GREEN APPLE', votes: 40 },
    { id: '5', musicName: '新時代 / Ado', votes: 35 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="p-4 border-b-4 border-black flex justify-between items-center bg-white sticky top-0 z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-black text-[#ff3344] border-2 border-[#ff3344] px-3 py-1 rounded-lg hover:bg-[#ff3344] hover:text-white transition-colors"
        >
          戻る
        </button>
        <h1 className="font-black italic text-xl tracking-tighter uppercase">Ranking</h1>
        <div className="w-12" />
      </header>
      <main className="flex-1 overflow-y-auto">
        <RankingView candidates={dummy} />
      </main>
    </div>
  );
}