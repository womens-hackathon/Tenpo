import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // ログイン成功後、ルート（/）に飛ばすとApp.tsxの判定で
      // ダッシュボードか登録画面に自動振り分けされます
      navigate('/');
    } catch (error) {
      console.error("ログインエラー:", error);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-10">
      {/* ロゴ・アイコン部分 */}
      <div className="relative">
        <div className="text-9xl relative z-10 filter drop-shadow-[4px_4px_0px_#000]">
          🎧
        </div>
        <div className="absolute inset-0 text-9xl text-[#ffd500] translate-x-2 translate-y-2 -z-10">
          🎧
        </div>
      </div>

      {/* テキスト部分 */}
      <div className="text-center">
        <h1 className="text-5xl font-black italic tracking-tighter mb-2">
          TENPO APP
        </h1>
        <p className="font-bold text-gray-400 uppercase text-xs tracking-[0.3em]">
          BGM Selection System
        </p>
      </div>

      {/* ログインボタン */}
      <button
        onClick={handleLogin}
        className="w-full py-5 bg-black text-white font-black rounded-full shadow-[6px_6px_0px_0px_#ff3344] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-xl border-4 border-black"
      >
        GOOGLEでログイン
      </button>
    </main>
  );
}