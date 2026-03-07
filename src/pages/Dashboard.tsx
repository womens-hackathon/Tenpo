import { useState, useEffect } from 'react';
import { signOut, type User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

const APP_ID = 'first_app';

export default function Dashboard({ user }: { user: User }) {
  const [shopName, setShopName] = useState('');
  const [currentBgm, setCurrentBgm] = useState("");
  const navigate = useNavigate();

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
    await signOut(auth);
    navigate('/login');
  };

  const updateNowPlaying = async () => {
    const value = prompt("曲名を入力してください", currentBgm);
    if (value === null) return; // キャンセル時は何もしない

    try {
      const docRef = doc(db, 'apps', APP_ID, 'tenpos', user.uid);
      await updateDoc(docRef, { 
        currentBgm: value 
      });
      // stateの更新はonSnapshotが検知するのでここでのセットは不要です
    } catch (e) {
      console.error("更新に失敗しました", e);
    }
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

        {/* QRコードセクション */}
        <section className="bg-white p-6 border-4 border-black flex flex-col items-center rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
          print:shadow-none print:border-none print:fixed print:inset-0 print:flex print:flex-col print:justify-center print:items-center print:z-[9999]">
          
          <h2 className="hidden print:block print:text-[80px] print:font-black print:mb-12 text-center">{shopName}</h2>

          <div className="bg-white p-2 border-2 border-black rounded-xl">
            <QRCodeSVG
              // ※開発環境のIPアドレスに合わせて変更してください
              value={`http://172.16.201.240:5173/rooms/${user.uid}`}
              size={200}
              className="print:w-[500px] print:h-[500px]"
            />
          </div>

          <p className="mt-4 font-black text-xl print:mt-10 print:text-4xl">店舗用QRコード</p>
          <button
            onClick={() => window.print()}
            className="mt-2 text-xs font-bold text-gray-400 underline print:hidden hover:text-black transition-colors"
          >
            このQRコードを印刷する（A4対応）
          </button>
        </section>

        {/* ボタンアクション */}
        <div className="space-y-4 pt-4 print:hidden">
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
      </main>
    </>
  );
}