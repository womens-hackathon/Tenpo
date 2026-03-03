import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';

// Spotify API設定
const SPOTIFY_CLIENT_ID = "e7947c7274464a22be610498dcec6ce9";
const REDIRECT_URI = "http://127.0.0.1:5174"; // localhostではなくIPアドレス形式を使用
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "";
const SCOPES = ["user-read-currently-playing", "user-read-playback-state"];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewStore, setIsNewStore] = useState(false);
  const [shopName, setShopName] = useState('');
  const [currentBgm, setCurrentBgm] = useState('未接続');

  // SpotifyログインURL生成
  const handleSpotifyConnect = () => {
    const authUrl = `${AUTH_ENDPOINT}?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES.join(" "))}`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, 'first_app', currentUser.uid, 'stores', 'info');
        
        // リアルタイムで店名とBGMを監視
        onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setShopName(data.name || '');
            setCurrentBgm(data.currentBgm || '停止中');
            setIsNewStore(false);
          } else {
            setIsNewStore(true);
          }
        });
        
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Spotifyトークンの処理と曲情報の定期取得
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && user) {
      const token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token"))?.split("=")[1];
      if (token) {
        window.location.hash = ""; // URLを綺麗にする
        
        const interval = setInterval(async () => {
          try {
            const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.status === 200) {
              const data = await response.json();
              if (data.item) {
                const songName = `${data.item.name} / ${data.item.artists[0].name}`;
                // Firestoreの currentBgm だけを更新
                await setDoc(doc(db, 'first_app', user.uid, 'stores', 'info'), {
                  currentBgm: songName
                }, { merge: true });
              }
            }
          } catch (e) {
            console.error("Spotify取得エラー:", e);
          }
        }, 10000); // 10秒ごとにチェック

        return () => clearInterval(interval);
      }
    }
  }, [user]);

  const registerStore = async () => {
    if (!user || !shopName) return;
    try {
      await setDoc(doc(db, 'first_app', user.uid, 'stores', 'info'), {
        id: user.uid,
        name: shopName,
        currentBgm: "",
        createdAt: serverTimestamp(),
      });
      setIsNewStore(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-black">
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg flex flex-col">
        {user ? (
          isNewStore ? (
            <main className="p-8 flex-1 flex flex-col justify-center space-y-6">
              <h2 className="text-2xl font-black text-center">店舗情報の登録</h2>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">店舗名を入力してください</label>
                <input 
                  type="text" 
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="例：Cafe Tenpo"
                  className="w-full p-4 border-4 border-black rounded-xl focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
              <button 
                onClick={registerStore}
                className="w-full py-4 bg-black text-white font-black rounded-xl active:translate-y-1 transition-all"
              >
                登録してQRコードを作成
              </button>
            </main>
          ) : (
            <>
              <header className="p-4 border-b-4 border-black flex justify-between items-center bg-white">
                <h1 className="font-black italic">Admin Panel</h1>
                <button onClick={() => signOut(auth)} className="text-xs font-bold text-red-500 border-2 border-red-500 px-2 py-1 rounded-lg">Logout</button>
              </header>
              <main className="p-6 space-y-8 flex-1 overflow-y-auto">
                <section className="text-center">
                  <h2 className="text-3xl font-black">{shopName}</h2>
                  <p className="text-gray-500 font-bold">Welcome back!</p>
                </section>

            {/* 印刷用レイアウト：印刷時は画面全体を使い、真ん中に配置する */}
            <section className="bg-white p-6 border-4 border-black flex flex-col items-center rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
              print:shadow-none print:border-none print:fixed print:inset-0 print:flex print:flex-col print:justify-center print:items-center print:z-[9999] print:bg-white">
              
              {/* 店舗名：印刷時に大きく表示 */}
              <h2 className="hidden print:block print:text-[100px] print:font-black print:mb-20 print:text-center print:leading-tight">
                {shopName}
              </h2>

              <div className="bg-white p-2 border-2 border-black rounded-lg print:border-none print:p-0">
                {/* 印刷時はQRコードを少し大きく表示（sizeを調整） */}
                <QRCodeSVG 
                  value={`https://tenpo-app.web.app/rooms/${user.uid}`} 
                  size={256} 
                  className="print:w-[800px] print:h-[800px]" 
                />
              </div>

              <p className="mt-4 font-black text-xl print:text-3xl print:mt-8">店舗用QRコード</p>
              
              {/* 印刷ボタン：ブラウザの印刷ダイアログを呼び出す */}
              <button 
                onClick={() => window.print()} 
                className="mt-4 text-sm font-bold text-gray-500 underline print:hidden hover:text-black transition-colors"
              >
                このQRコードを印刷する（A4対応）
              </button>
            </section>
                
                <section className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => alert("ランキング画面へ（実装予定）")}
                    className="w-full py-4 bg-yellow-300 border-4 border-black font-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                  >
                    🏆 ランキングを見る
                  </button>

                  <button 
                    onClick={handleSpotifyConnect}
                    className="w-full py-4 bg-[#1DB954] border-4 border-black text-white font-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                  >
                    🎵 SpotifyでBGM再生
                  </button>
                </section>

                <section className="p-4 bg-gray-50 border-4 border-black rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-2xl animate-spin-slow shadow-lg">💿</div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Now Playing</p>
                    <p className="font-black text-sm truncate w-48">{currentBgm}</p>
                  </div>
                </section>
              </main>
            </>
          )
        ) : (
          <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
            <div className="text-8xl animate-bounce">🎧</div>
            <div className="text-center">
              <h1 className="text-4xl font-black italic tracking-tighter">Tenpo App</h1>
              <p className="font-bold text-gray-400 mt-2 uppercase text-xs tracking-widest">BGM Selection for Stores</p>
            </div>
            <button 
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="w-full py-5 bg-black text-white font-black rounded-full shadow-[0px_10px_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all text-lg"
            >
              Googleでログイン
            </button>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;