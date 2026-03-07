import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Login() {
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
const handleLogin = async () => {
  try {
    console.log("ログイン開始");
    setIsLoggingIn(true);
    
    //ポップアップでサインイン
    const result = await signInWithPopup(auth, googleProvider);
    console.log("ログイン成功:", result.user.displayName);
    
    navigate('/');

  } catch (error: any) {
    console.error("ログインエラー:", error);

    if (error.code === 'auth/cancelled-popup-request') {
       console.log("ユーザーが途中で閉じました");
    } else {
       alert("ログインに失敗しました。もう一度お試しください。");
    }
  } finally {
    setIsLoggingIn(false);
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
        disabled={isLoggingIn}
        className="w-full py-5 bg-black text-white font-black rounded-full shadow-[6px_6px_0px_0px_#ff3344] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-xl border-4 border-black disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoggingIn ? 'ログイン中...' : 'GOOGLEでログイン'}
      </button>
    </main>
  );
}