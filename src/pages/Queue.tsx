import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. 型定義
type ReservationStatus = "waiting" | "called" | "cancelled";

type Reservation = {
  id: string;
  name: string;
  count: number;
  status: ReservationStatus;
};

// 2. ステータスボタン用コンポーネント
function StatusButton({ 
  status, 
  onChange 
}: { 
  status: ReservationStatus, 
  onChange: () => void 
}) {
  const configs = {
    waiting: { label: "呼び出し前", color: "#fff", textColor: "#111" },
    called: { label: "呼び出し済", color: "#ffd500", textColor: "#111" },
    cancelled: { label: "キャンセル", color: "#eee", textColor: "#aaa" },
  };

  const config = configs[status];

  return (
    <button
      onClick={onChange}
      style={{
        background: config.color,
        color: config.textColor,
        border: "2px solid #111",
        borderRadius: 50,
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: status === "cancelled" ? "none" : "2px 2px 0px #111",
        whiteSpace: "nowrap",
        transition: "all 0.1s"
      }}
    >
      {config.label}
    </button>
  );
}

// 3. 待ち行列表示用コンポーネ article
export default function Queue() {
  const navigate = useNavigate();
  
  // 仮のデータ（本来はFirestoreから取得）
  const [reservations, setReservations] = useState<Reservation[]>([
    { id: '1', name: 'ヒラマツ様', count: 2, status: "waiting" },
    { id: '2', name: 'コハ様', count: 4, status: "called" },
    { id: '3', name: 'ナナ様', count: 1, status: "waiting" },
    { id: '4', name: 'キング様', count: 3, status: "cancelled" },
  ]);

  // ステータスを順番に切り替える関数
  const toggleStatus = (id: string) => {
    setReservations(prev => prev.map(r => {
      if (r.id !== id) return r;
      const nextStatus: Record<ReservationStatus, ReservationStatus> = {
        waiting: "called",
        called: "cancelled",
        cancelled: "waiting"
      };
      return { ...r, status: nextStatus[r.status] };
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* ヘッダー */}
      <header className="p-4 border-b-4 border-black flex justify-between items-center bg-white sticky top-0 z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-black text-[#ff3344] border-2 border-[#ff3344] px-3 py-1 rounded-lg hover:bg-[#ff3344] hover:text-white transition-colors"
        >
          戻る
        </button>
        <h1 className="font-black italic text-xl tracking-tighter uppercase text-center">
          Queue List
        </h1>
        <div className="w-12" />
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-md mx-auto w-full">
        {/* インフォメーション */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#888", textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            👥 Waiting Status
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 900, textAlign: "center", color: "#111", marginTop: 4 }}>
            順番待ちリスト
          </h2>
          <p style={{ fontSize: 13, color: "#888", textAlign: "center", marginTop: 4 }}>
            ステータスをタップして切り替えてください
          </p>
        </div>

        {/* リスト本体 */}
        <div style={{
          background: "#fff",
          border: "2.5px solid #111",
          borderRadius: 20,
          padding: "8px 0",
          boxShadow: "4px 4px 0px #111",
        }}>
          {reservations.length === 0 ? (
            <p style={{ textAlign: "center", color: "#888", padding: "32px 0", fontSize: 14 }}>
              現在、お待ちのお客様はいません
            </p>
          ) : (
            reservations.map((r, idx) => (
              <div key={r.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px",
                borderBottom: idx < reservations.length - 1 ? "1.5px solid #eee" : "none",
                opacity: r.status === "cancelled" ? 0.6 : 1,
              }}>
                {/* 順番番号 */}
                <div style={{
                  width: 32,
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#111",
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>

                {/* お客様情報 */}
                <div className="truncate" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: "#111",
                  }}>
                    {r.name}
                  </div>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: "#888",
                    marginTop: 2
                  }}>
                    <span style={{ color: "#ff3344", fontSize: 16 }}>{r.count}</span> 名様
                  </div>
                </div>

                {/* ステータス切替ボタン */}
                <StatusButton 
                  status={r.status} 
                  onChange={() => toggleStatus(r.id)} 
                />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}