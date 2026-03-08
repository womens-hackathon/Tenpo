import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
// getDoc を追加
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

// 型定義
export type Music = {
  musicId: string;
  musicName: string;
  musicPoints: number;
  musicRank: number;
  previewUrl?: string;
};

type RankingData = {
  updatedAt: any; // Date型だとFirebaseのTimestampと衝突することがあるため any
  musics: { [musicId: string]: Music };
};

type ITunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
};

// APP_IDがVotePageと一致しているか確認してください
const APP_ID = 'first_app'; 

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
  const { musics, onTogglePreview, playingId } = props;
  
  // ポイント順にソート
  const sortedMusics = [...musics].sort((a, b) => (b.musicPoints || 0) - (a.musicPoints || 0));
  const maxPoints = Math.max(...musics.map((m) => m.musicPoints || 0), 1);
  const medals = ["🥇", "🥈", "🥉"];
  const top5 = sortedMusics.slice(0, 5);

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
      <div className="text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">🎵 BGM Ranking</p>
        <h1 className="text-3xl font-black text-gray-900 mt-1">現在のランキング</h1>
      </div>

      <button
        onClick={handleSNSShare}
        className="w-full bg-[#1d9bf0] text-white border-4 border-black rounded-2xl py-4 text-lg font-black shadow-[6px_6px_0px_#000] flex items-center justify-center gap-2 active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
      >
        <span>🐦</span> TOP5をXでシェアする
      </button>

      <div className="bg-white border-4 border-black rounded-[2rem] py-2 shadow-[8px_8px_0px_#000] overflow-hidden">
        {sortedMusics.length === 0 ? (
          <p className="text-center text-gray-400 py-12 font-bold">まだ候補曲がありません</p>
        ) : (
          sortedMusics.map((m, idx) => {
            const pct = Math.round(((m.musicPoints || 0) / maxPoints) * 100);
            return (
              <div key={m.musicId} className={`flex items-center gap-4 p-4 ${idx < sortedMusics.length - 1 ? 'border-b-2 border-gray-100' : ''}`}>
                <div className="w-10 text-center text-2xl font-black flex-shrink-0">
                  {idx < 3 ? medals[idx] : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-black text-gray-900">{m.musicName}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-3 bg-gray-100 rounded-full border-2 border-black overflow-hidden">
                      <div 
                        style={{ width: `${pct}%` }} 
                        className="h-full bg-yellow-400 border-r-2 border-black transition-all duration-500" 
                      />
                    </div>
                    <span className="text-xs font-black text-gray-500 flex-shrink-0">
                      {m.musicPoints || 0}pt
                    </span>
                  </div>
                </div>
                {m.previewUrl && (
                  <button
                    onClick={() => onTogglePreview(m)}
                    className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] active:shadow-none ${playingId === m.musicId ? 'bg-red-400' : 'bg-white'}`}
                  >
                    {playingId === m.musicId ? '■' : '▶'}
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
  const rankingId = 'today';

  useEffect(() => {
    return () => { audio.pause(); };
  }, [audio]);

  // 1. 取得時のパスをVotePageと完全に一致させる
  useEffect(() => {
    if (!tenpoId) return;

    // パス: apps / APP_ID / general / tenpoId / public_rankings / rankingId
    const rankingRef = doc(db, 'apps', APP_ID, 'general', tenpoId, 'public_rankings', rankingId);
    
    const unsubscribe = onSnapshot(rankingRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RankingData;
        const musicsArray = Object.values(data.musics || {});
        setMusics(musicsArray);
      } else {
        setMusics([]);
      }
    }, (error) => {
      console.error("Firestore Listen Error:", error);
    });

    return () => unsubscribe();
  }, [tenpoId]);

  // 検索ロジック (省略なし)
  const handleSearch = async (keyword: string) => {
    const q = keyword.trim();
    if (!q) { setSearchResults([]); setSearched(false); return; }
    try {
      setLoading(true); setSearched(true);
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&country=JP&limit=10`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => { if(input) handleSearch(input) }, 350);
    return () => clearTimeout(timer);
  }, [input]);

  // 2. 保存時のロジックを修正
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

    // ドキュメントを直接取得して更新する方式に変更
    const rankingRef = doc(db, 'apps', APP_ID, 'general', tenpoId, 'public_rankings', rankingId);
    
    try {
      const docSnap = await getDoc(rankingRef);
      let currentMusics = {};
      
      if (docSnap.exists()) {
        currentMusics = docSnap.data().musics || {};
      }

      await setDoc(rankingRef, {
        updatedAt: new Date(),
        musics: { ...currentMusics, [musicId]: newMusic },
      }, { merge: true }); // merge: true を入れるのが安全

      setInput("");
      setSearchResults([]);
      setSearched(false);
    } catch (e) {
      console.error("保存失敗:", e);
    }
  };

  const handleTogglePreview = (music: Music) => {
    if (!music.previewUrl) return;
    if (playingId === music.musicId) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.src = music.previewUrl;
      audio.play();
      setPlayingId(music.musicId);
      audio.onended = () => setPlayingId(null);
    }
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