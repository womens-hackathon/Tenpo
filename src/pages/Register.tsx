import { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { type User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

interface RegisterProps {
  user: User;
  setHasStore: (val: boolean) => void;
}

const APP_ID = 'first_app';

export default function Register({ user, setHasStore }: RegisterProps) {
  const [shopName, setShopName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const registerStore = async () => {
    if (!user || !shopName) return;
    
    setIsSubmitting(true);
    try {
      // 1. 店舗基本情報の作成
      const tenpoRef = doc(db, 'apps', APP_ID, 'tenpos', user.uid);
      await setDoc(tenpoRef, {
        id: user.uid,
        name: shopName,
        currentBgm: { title: "停止中", artist: "-" },
        createdAt: serverTimestamp(),
      });
      
      // 2. 管理者権限（オーナー）の設定
      const adminRef = doc(db, 'apps', APP_ID, 'tenpos', user.uid, 'admins', user.uid);
      await setDoc(adminRef, {
        role: 'owner',
        addedAt: serverTimestamp(),
      });

      // 親コンポーネントの状態を更新（これでApp.tsxがDashboardへ切り替える）
      setHasStore(true);
      
      // ダッシュボードへ遷移
      navigate('/dashboard');
    } catch (e) {
      console.error("登録エラー:", e);
      alert("登録に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-8 flex-1 flex flex-col justify-center space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tighter">WELCOME!</h2>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
          まずは店舗を登録しましょう
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
          ショップ名
        </label>
        <input 
          type="text" 
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="例：Tenpo Cafe"
          className="w-full p-4 border-4 border-black rounded-2xl focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg font-bold"
        />
      </div>

      <button 
        onClick={registerStore}
        disabled={!shopName || isSubmitting}
        className={`w-full py-4 font-black rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all
          ${!shopName || isSubmitting 
            ? 'bg-gray-200 cursor-not-allowed' 
            : 'bg-[#ff3344] text-white hover:bg-[#ff4455]'}`}
      >
        {isSubmitting ? '登録中...' : '登録して開始'}
      </button>
    </main>
  );
}