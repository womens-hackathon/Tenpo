import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import  { QRCodeSVG } from 'qrcode.react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 読み込み中判定
  const [isNewStore, setIsNewStore] = useState(false); // 新規登録が必要か
  const [shopName, setShopName] = useState(''); // 入力された店舗名

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // ログインしたら、まずFirestoreにデータがあるか確認
        const docRef = doc(db, 'stores', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // すでに登録済みなら、そのまま管理画面へ
          setIsNewStore(false);
        } else {
          // データがなければ、登録画面（店舗名入力）へ
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

  // 初回登録（店舗名を保存する）処理
  const registerStore = async () => {
    if (!user || !shopName) return;
    try {
      await setDoc(doc(db, 'stores', user.uid), {
        id: user.uid,
        name: shopName,
        currentBgm: "",
        createdAt: serverTimestamp(),
      });
      setIsNewStore(false); // 登録が終わったので管理画面へ
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg flex flex-col">
        
        {user ? (
          isNewStore ? (
            /* --- パターンA：初回ログイン（店舗名入力） --- */
            <main className="p-8 flex-1 flex flex-col justify-center space-y-6">
              <h2 className="text-2xl font-bold text-center">店舗情報の登録</h2>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">店舗名を入力してください</label>
                <input 
                  type="text" 
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="例：Cafe Tenpo"
                  className="w-full p-4 border-2 border-black rounded-xl focus:outline-none"
                />
              </div>
              <button 
                onClick={registerStore}
                className="w-full py-4 bg-black text-white font-bold rounded-xl active:scale-95 transition-all"
              >
                登録してQRコードを作成
              </button>
            </main>
          ) : (
            /* --- パターンB：2回目以降（管理画面） --- */
            <>
              <header className="p-4 border-b flex justify-between items-center">
                <h1 className="font-bold">Admin Panel</h1>
                <button onClick={() => signOut(auth)} className="text-xs text-red-500">Logout</button>
              </header>
              <main className="p-6 space-y-8">
                <section className="text-center">
                  <h2 className="text-xl font-bold">Welcome back!</h2>
                  <p className="text-gray-500">今日も一日頑張りましょう！</p>
                </section>

                <section className="bg-white p-6 border-2 border-black flex flex-col items-center rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <QRCodeSVG value={`https://tenpo-app.web.app/rooms/${user.uid}`} size={200} />
                  <p className="mt-4 font-black text-lg">店舗用QRコード</p>
                </section>
                
                {/* ここにSpotify連携などのボタン */}
              </main>
            </>
          )
        ) : (
          /* --- パターンC：未ログイン --- */
          <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
            <div className="text-6xl text-center">🎧</div>
            <div className="text-center">
              <h1 className="text-3xl font-black italic">Tenpo App</h1>
              <p className="text-gray-400 mt-2">BGM Selection for Stores</p>
            </div>
            <button 
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="w-full py-4 bg-black text-white font-bold rounded-full shadow-xl"
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