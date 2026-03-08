import { useState, useEffect } from 'react';
import { signOut, type User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

type ITunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
};


const APP_ID = 'first_app';

export default function Dashboard({ user }: { user: User }) {
  const [shopName, setShopName] = useState('');
  const [currentBgm, setCurrentBgm] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<ITunesTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handlePrint = () => {
    setIsPrinting(true);
    
    // ユーザーに「変わった」ことを認識させるため、ほんの一瞬だけ遅らせて印刷を開始
    setTimeout(() => {
      window.print();
      
      // 印刷ダイアログが閉じた後にボタンを元に戻す
      // ※window.print() はダイアログを閉じるまで処理が止まるので、
      // 閉じた瞬間にここが実行されます。
      setIsPrinting(false);
    }, 100);
  };

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'apps', APP_ID, 'tenpos', user.uid);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setShopName(data.name);
        setCurrentBgm(data.currentBgm || '停止中');
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      console.log("ログアウト処理開始");
      await signOut(auth);
      console.log("ログアウト完了、ページリロード");
      
      // ページを完全にリロード
      /*setTimeout(() => {
        window.location.reload();
      }, 300);*/
    } catch (error) {
      console.error("ログアウトエラー:", error);
      // エラー時もリロード
      window.location.reload();
    }
  };

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
    const trimmed = searchInput.trim();
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
  }, [searchInput]);

  const handleSelectSong = async (track: ITunesTrack) => {
    const musicName = `${track.trackName} / ${track.artistName}`;
    try {
      const docRef = doc(db, 'apps', APP_ID, 'tenpos', user.uid);
      await updateDoc(docRef, { 
        currentBgm: musicName 
      });
      setShowSearch(false);
      setSearchInput("");
      setSearchResults([]);
      setSearched(false);
    } catch (e) {
      console.error("更新に失敗しました", e);
    }
  };

  const updateNowPlaying = () => {
    setShowSearch(true);
  };

  return (
    <>
      <header className="p-4 border-b-4 border-black flex justify-between items-center bg-white sticky top-0 z-50 print:hidden">
        <h1 className="font-black italic text-xl tracking-tighter">ADMIN PANEL</h1>
        <button
          onClick={handleLogout}
          className="text-xs font-black text-[#ff3344] border-2 border-[#ff3344] px-3 py-1 rounded-lg hover:bg-[#ff3344] hover:text-white transition-colors"
        >
          LOGOUT
        </button>
      </header>

      <main className="p-6 space-y-6 flex-1 overflow-y-auto">
        <section className="text-center py-4 print:hidden">
          <h2 className="text-4xl font-black mb-1 tracking-tighter">{shopName}</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Welcome back!</p>
        </section>

 {/* QRコードセクション：この「四角いカード」をそのまま印刷対象にする */}
<section className="bg-white p-8 border-4 border-black flex flex-col items-center rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] print:shadow-none print:border-[12px] print:rounded-[60px]">
  
  {/* 印刷時のみ表示される大きな店名 */}
  <h2 className="hidden print:block print:text-[60px] print:font-black print:mb-12 print:text-center print:leading-none">
    {shopName}
  </h2>

  <div className="bg-white p-4 border-2 border-black rounded-2xl print:border-[4px]">
    <QRCodeSVG
      value={`https://womens-hackathon-92eef.web.app/rooms/${user.uid}`}
      size={256}
      level="H"
      className="print:w-[120mm] print:h-[120mm]"
    />
  </div>

  <p className="mt-6 font-black text-xl print:text-[40px] print:mt-10">
    店舗用QRコード
  </p>
  
  {/* 画面上だけで見える印刷ボタン */}
  <button
    onClick={handlePrint}
    disabled={isPrinting} // 生成中は押せないようにする
    className={`mt-2 text-xs font-bold underline print:hidden p-6 transition-all ${
      isPrinting ? 'text-orange-500 animate-pulse' : 'text-gray-400 hover:text-black'
    }`}
  >
    {isPrinting ? '印刷データ生成中...' : 'このQRコードを印刷する'}
  </button>
</section>

<style>{`
  /* 印刷時のみ、一瞬でレイアウトを組み替える */
  @media print {
    @page { size: A4; margin: 0; }
    
    html, body {
      height: 100%;
      overflow: hidden;
    }

    /* 印刷したいカード（section）を無理やり中央へ */
    main > section {
      position: absolute !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 180mm !important;
      margin: 0 !important;
      z-index: 9999;
      background: white !important;
    }

    /* それ以外を全部消す */
    header, .print\:hidden, button {
      display: none !important;
    }
  }

  /* 通常時の動作を軽くする */
  @media screen {
    section {
      /* 重い計算をさせない */
      transform: none !important;
      position: relative !important;
    }
  }
`}</style>

        {/* ステータスバー */}
        <section className="p-4 bg-white border-4 border-black rounded-2xl flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] print:hidden">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-2xl shadow-lg">
            <span className="animate-spin-slow">💿</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Now Playing</p>
              <>
              <p className="font-black text-lg truncate text-[#ff3344] tracking-tight">
                {currentBgm}
                </p>
              </>
          </div>
        </section>

        {/* ボタンアクション */}
        <div className="space-y-4 pt-4 print:hidden">
          <button
            onClick={() => navigate('/ranking')}
            className="w-full py-4 bg-[#ffd500] border-4 border-black font-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            🏆 ランキングを見る
          </button>

          <button
            onClick={() => navigate('/queue')}
            className="w-full py-4 bg-[#ffd500] border-4 border-black font-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            🕒 順番待ちを見る
          </button>

          <button
            onClick={updateNowPlaying}
            className="w-full py-4 bg-[#ff3344] text-white border-4 border-black font-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            🎵 Now Playingを選択
          </button>
        </div>

        {/* 音楽検索モーダル */}
        {showSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
            <div className="bg-white border-4 border-black rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-lg">曲を選択</h3>
                <button
                  onClick={() => setShowSearch(false)}
                  className="text-gray-400 hover:text-black text-2xl"
                >
                  ×
                </button>
              </div>

              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="曲名やアーティスト名を入力"
                className="w-full border-2 border-black rounded-lg p-3 mb-4 font-bold"
              />

              {loading && (
                <p className="text-gray-500 mb-4">検索しています...</p>
              )}

              {!loading && searched && searchResults.length === 0 && searchInput.trim() && (
                <p className="text-gray-500 mb-4">該当する曲がありません</p>
              )}

              {!loading && searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((track) => (
                    <button
                      key={track.trackId}
                      onClick={() => handleSelectSong(track)}
                      className="w-full flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-black transition-colors text-left"
                    >
                      <img
                        src={track.artworkUrl100 || ""}
                        alt={track.trackName}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{track.trackName}</div>
                        <div className="text-sm text-gray-600 truncate">{track.artistName}</div>
                      </div>
                      <div className="text-red-500 font-bold text-sm border border-red-500 rounded-full px-3 py-1">
                        選択
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}