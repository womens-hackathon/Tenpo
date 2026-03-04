import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewStore, setIsNewStore] = useState(false);
  const [shopName, setShopName] = useState('');
  const [currentBgm, setCurrentBgm] = useState('停止中');

  const APP_ID = 'first_app';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {

        const docRef = doc(db, 'apps', APP_ID, 'tenpos', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setShopName(data.name);
          setCurrentBgm(data.currentBgm || '停止中');
          setIsNewStore(false);
        } else {
          setIsNewStore(true);
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const registerStore = async () => {
    if (!user || !shopName) return;
    try {
      const tenpoRef = doc(db, 'apps', APP_ID, 'tenpos', user.uid);
      await setDoc(tenpoRef, {
        id: user.uid,
        name: shopName,
        currentBgm: "停止中",
        createdAt: serverTimestamp(),
      });
      
      const adminRef = doc(db, 'apps', APP_ID, 'tenpos', user.uid, 'admins', user.uid);
      await setDoc(adminRef, {
        role: 'owner',
        addedAt: serverTimestamp(),
      });

      setIsNewStore(false);
    } catch (e) {
      console.error(e);
    }
  };

  const updateNowPlaying = async () => {
    const newBgm = prompt("現在流れているBGMを入力してください", currentBgm);
    if (newBgm === null || !user) return;
    
    try {
      const docRef = doc(db, 'apps', APP_ID, 'tenpos', user.uid);
      await updateDoc(docRef, { currentBgm: newBgm });
      setCurrentBgm(newBgm);
    } catch (e) {
      console.error("更新に失敗しました", e);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold font-sans">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans text-black">

      <div className="w-full max-w-md bg-white min-h-screen flex flex-col border-x-4 border-black shadow-xl">
        {user ? (
          isNewStore ? (
            <main className="p-8 flex-1 flex flex-col justify-center space-y-6">
              <h2 className="text-2xl font-black text-center">店舗登録</h2>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">ショップ名</label>
                <input 
                  type="text" 
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="例：Tenpo Cafe"
                  className="w-full p-4 border-4 border-black rounded-2xl focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
              <button 
                onClick={registerStore}
                className="w-full py-4 bg-[#ff3344] text-white font-black rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                登録して開始
              </button>
            </main>
          ) : (
            <>
              <header className="p-4 border-b-4 border-black flex justify-between items-center bg-white sticky top-0 z-50">
                <h1 className="font-black italic text-xl tracking-tighter">ADMIN PANEL</h1>
                <button 
                  onClick={() => signOut(auth)} 
                  className="text-xs font-black text-[#ff3344] border-2 border-[#ff3344] px-3 py-1 rounded-lg hover:bg-[#ff3344] hover:text-white transition-colors"
                >
                  LOGOUT
                </button>
              </header>

              <main className="p-6 space-y-6 flex-1 overflow-y-auto">
                <section className="text-center py-4">
                  <h2 className="text-4xl font-black mb-1 tracking-tighter">{shopName}</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Welcome back!</p>
                </section>

                {/* QRコードセクション */}
                <section className="bg-white p-6 border-4 border-black flex flex-col items-center rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
                  print:shadow-none print:border-none print:fixed print:inset-0 print:flex print:flex-col print:justify-center print:items-center print:z-[9999]">
                  
                  <h2 className="hidden print:block print:text-[80px] print:font-black print:mb-12 text-center">{shopName}</h2>

                  <div className="bg-white p-2 border-2 border-black rounded-xl">
                    <QRCodeSVG 
                      value={`https://tenpo-app.web.app/rooms/${user.uid}`} 
                      size={200} 
                      className="print:w-[500px] print:h-[500px]" 
                    />
                  </div>

                  <p className="mt-4 font-black text-xl">店舗用QRコード</p>
                  <button 
                    onClick={() => window.print()} 
                    className="mt-2 text-xs font-bold text-gray-400 underline print:hidden hover:text-black transition-colors"
                  >
                    このQRコードを印刷する（A4対応）
                  </button>
                </section>
                
                {/* ボタンアクション */}
                <div className="space-y-4 pt-4">
                  <button 
                    onClick={() => alert("ランキング表示（実装中）")}
                    className="w-full py-4 bg-[#ffd500] border-4 border-black font-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                  >
                    🏆 ランキングを見る
                  </button>

                  <button 
                    onClick={updateNowPlaying}
                    className="w-full py-4 bg-[#ff3344] text-white border-4 border-black font-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                  >
                    🎵 Now Playingを設定
                  </button>
                </div>

                {/* ステータスバー */}
                <section className="p-4 bg-white border-4 border-black rounded-2xl flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-2xl shadow-lg">
                    <span className="animate-spin-slow">💿</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Now Playing</p>
                    <p className="font-black text-lg truncate text-[#ff3344] tracking-tight">{currentBgm}</p>
                  </div>
                </section>
              </main>
            </>
          )
        ) : (
          <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-10">
            <div className="relative">
                <div className="text-9xl relative z-10 filter drop-shadow-[4px_4px_0px_#000]">🎧</div>
                <div className="absolute inset-0 text-9xl text-[#ffd500] translate-x-2 translate-y-2 -z-10">🎧</div>
            </div>
            <div className="text-center">
              <h1 className="text-5xl font-black italic tracking-tighter mb-2">TENPO APP</h1>
              <p className="font-bold text-gray-400 uppercase text-xs tracking-[0.3em]">BGM Selection System</p>
            </div>
            <button 
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="w-full py-5 bg-black text-white font-black rounded-full shadow-[6px_6px_0px_0px_#ff3344] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-xl border-4 border-black"
            >
              GOOGLEでログイン
            </button>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;