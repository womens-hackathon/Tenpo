import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Routes, Route, Navigate } from 'react-router-dom';

// 各ページコンポーネントをインポート
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

//使うデータベースごとに変更
const APP_ID = 'first_app';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(false);

  useEffect(() => { //ログイン状態の管理
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, 'apps', APP_ID, 'tenpos', currentUser.uid);
        const docSnap = await getDoc(docRef);
        setHasStore(docSnap.exists());
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-10 text-center font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans text-black">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col border-x-4 border-black shadow-xl">
        <Routes>
          {/* 未ログインならログイン画面へ、ログイン済みならダッシュボードか登録画面へ */}
          <Route path="/" element={
            !user ? <Login /> : (hasStore ? <Navigate to="/dashboard" /> : <Navigate to="/register" />)
          } />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={user ? <Register setHasStore={setHasStore} user={user}/> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />

        </Routes>
      </div>
    </div>
  );
}

export default App;