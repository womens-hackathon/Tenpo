import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot, collection, query, getDocs } from 'firebase/firestore';

// 型定義
export type Music = {
  musicId: string;
  musicName: string;
  musicPoints: number;
  musicRank: number;
  previewUrl?: string;
};

type RankingData = {
  updatedAt: Date;
  musics: { [musicId: string]: Music };
};

type ITunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
};

const APP_ID = 'first-app';

export function RankingView(props: {
  musics: Music[];
  onTogglePreview: (music: Music) => void;
  playingId: string | null;
  onSelectSong: (track: ITunesTrack) => void;
  searchResults: ITunesTrack[];
  loading: boolean;
  searched: boolean;
  input: string;
  onInputChange: (value: string) => void;
}) {
  const { musics, onTogglePreview, playingId, onSelectSong: _onSelectSong, searchResults: _searchResults, loading: _loading, searched: _searched, input: _input, onInputChange: _onInputChange } = props;
  const sortedMusics = [...musics].sort((a, b) => b.musicPoints - a.musicPoints);
  const maxPoints = Math.max(...musics.map((m) => m.musicPoints), 1);
  const medals = ["🥇", "🥈", "🥉"];
  const top5 = sortedMusics.slice(0, 5);


  // SNSシェア機能
  const handleSNSShare = () => {
    const shopName = "Request the BGM";
    const rankingText = top5
      .map((m, idx) => `${idx + 1}位：${m.musicName}`)
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
        {sortedMusics.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", padding: "32px 0", fontSize: 14 }}>
            まだ候補曲がありません
          </p>
        ) : (
          sortedMusics.map((m, idx) => {
            const pct = Math.round((m.musicPoints / maxPoints) * 100);
            return (
              <div key={m.musicId} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderBottom: idx < sortedMusics.length - 1 ? "1.5px solid #eee" : "none",
              }}>
                <div style={{ width: 32, textAlign: "center", fontSize: idx < 3 ? 22 : 14, fontWeight: 900, color: "#111", flexShrink: 0 }}>
                  {idx < 3 ? medals[idx] : `${idx + 1}`}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>
                    {m.musicName}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#111", borderRadius: 99, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#888", flexShrink: 0 }}>
                      {m.musicPoints}ポイント
                    </span>
                  </div>
                </div>
                {m.previewUrl && (
                  <button
                    onClick={() => onTogglePreview(m)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "2px solid #111",
                      background: "#fff",
                      cursor: "pointer",
                      boxShadow: "2px 2px 0px #111",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    {playingId === m.musicId ? (
                      <svg width="19" height="19" viewBox="0 0 24 24">
                        <rect x="6" y="5" width="4" height="14" rx="1.5" fill="#111" />
                        <rect x="14" y="5" width="4" height="14" rx="1.5" fill="#111" />
                      </svg>
                    ) : (
                      <svg width="19" height="19" viewBox="0 0 24 24">
                        <path d="M8 5.5C8 4.7 8.9 4.2 9.6 4.6L19 10.3C19.7 10.7 19.7 11.7 19 12.1L9.6 17.8C8.9 18.2 8 17.7 8 16.9V5.5Z" fill="#111"/>
                      </svg>
                    )}
                  </button>
                )}
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
  const [musics, setMusics] = useState<Music[]>([]);
  const [input, setInput] = useState("");
  const [searchResults, setSearchResults] = useState<ITunesTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio] = useState(() => new Audio());

  const tenpoId = localStorage.getItem('tenpoId') || '';
  const rankingId = 'today'; // 例: today

  useEffect(() => {
    return () => {
      audio.pause();
    };
  }, [audio]);

  // Firestoreからランキングデータを取得
  useEffect(() => {
    const tenpoId = localStorage.getItem('tenpoId');
    if (!tenpoId) return;

    const rankingRef = doc(db, 'apps',  APP_ID, 'general', tenpoId, 'public_rankings', rankingId);
    const unsubscribe = onSnapshot(rankingRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RankingData;
        const musicsArray = Object.values(data.musics || {});
        setMusics(musicsArray);
      } else {
        setMusics([]);
      }
    });

    return () => unsubscribe();
  }, [tenpoId, rankingId]);

  const handleSearch = async (keyword: string) => {
    const q = keyword.trim();
    if (!q) {
      setSearchResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setSearched(true);

      // TODO: APIキーが発行されたら、ここにAPIキーを追加
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&country=JP&limit=10`
      );

      if (!res.ok) {
        throw new Error("検索に失敗しました");
      }

      const data = await res.json();
      setSearchResults(Array.isArray(data.results) ? data.results : []);

    } catch (error) {
      console.error(error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(trimmed);
    }, 350);

    return () => clearTimeout(timer);
  }, [input]);

  const handleSelectSong = async (track: ITunesTrack) => {
    if (!tenpoId) return;

    const musicId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const musicName = `${track.trackName} / ${track.artistName}`;
    const newMusic: Music = {
      musicId,
      musicName,
      musicPoints: 0,
      musicRank: musics.length + 1,
      previewUrl: track.previewUrl,
    };

    // Firestoreに保存
    const rankingRef = doc(db, 'apps', APP_ID, 'general', tenpoId, 'public_rankings', rankingId);
    const currentData = (await getDocs(query(collection(db, 'general', 'public_rankings', tenpoId, rankingId)))).docs[0]?.data() as RankingData | undefined;
    const updatedMusics = { ...currentData?.musics, [musicId]: newMusic };

    await setDoc(rankingRef, {
      updatedAt: new Date(),
      musics: updatedMusics,
    });

    setInput("");
    setSearchResults([]);
    setSearched(false);
  };

  const handleTogglePreview = (music: Music) => {
    if (!music.previewUrl) return;

    if (playingId === music.musicId) {
      audio.pause();
      audio.currentTime = 0;
      setPlayingId(null);
      return;
    }

    audio.pause();
    audio.src = music.previewUrl;
    audio.currentTime = 0;
    audio.play();

    setPlayingId(music.musicId);

    audio.onended = () => {
      setPlayingId(null);
    };
  };

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
        <RankingView 
          musics={musics} 
          onTogglePreview={handleTogglePreview}
          playingId={playingId}
          onSelectSong={handleSelectSong}
          searchResults={searchResults}
          loading={loading}
          searched={searched}
          input={input}
          onInputChange={setInput}
        />
      </main>
    </div>
  );
}