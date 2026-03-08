import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// 1. 型定義
type ReservationStatus = "waiting" | "called" | "cancelled";

type Reservation = {
  id: string;
  userId: string;
  name: string;
  count: number;
  status: ReservationStatus;
};

type QueueItem = {
  id: string;
  userId: string;
  name?: string;
  count?: number;
  createdAt?: unknown;
};

type UserInfo = {
  status?: ReservationStatus;
  called?: boolean;
  nickname?: string;
};

const APP_ID = 'first_app';

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
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserInfo>>({});
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const userUnsubsRef = useRef<Record<string, () => void>>({});

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!uid) {
      setQueueItems([]);
      setUserMap({});
      setLoading(false);
      return;
    }

    const queueRef = collection(db, 'apps', APP_ID, 'general', uid, 'queue');
    const q = query(queueRef);
    const unsub = onSnapshot(q, (snap) => {
      const nextItems: QueueItem[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const userId =
          (typeof data.userId === "string" && data.userId) ||
          (typeof data.uid === "string" && data.uid) ||
          d.id;

        const name =
          (typeof data.nickname === "string" && data.nickname) ||
          (typeof data.name === "string" && data.name) ||
          undefined;

        const count =
          (typeof data.count === "number" && data.count) ||
          (typeof data.people === "number" && data.people) ||
          undefined;

        return {
          id: d.id,
          userId,
          name,
          count,
          createdAt: data.createdAt,
        };
      });

      setQueueItems(nextItems);
      setLoading(false);

      const nextUserIds = new Set(nextItems.map((i) => i.userId));
      const current = userUnsubsRef.current;

      // remove listeners for users no longer in queue
      Object.keys(current).forEach((userId) => {
        if (!nextUserIds.has(userId)) {
          current[userId]();
          delete current[userId];
          setUserMap((prev) => {
            const copy = { ...prev };
            delete copy[userId];
            return copy;
          });
        }
      });

      // add listeners for new users in queue
      nextUserIds.forEach((userId) => {
        if (current[userId]) return;
        const userRef = doc(db, 'apps', APP_ID, 'users', userId);
        current[userId] = onSnapshot(userRef, (userSnap) => {
          if (!userSnap.exists()) {
            setUserMap((prev) => ({ ...prev, [userId]: {} }));
            return;
          }
          const data = userSnap.data() as Record<string, unknown>;
          const rawStatus = data.status;
          const status: ReservationStatus | undefined =
            rawStatus === "called" || rawStatus === "cancelled" || rawStatus === "waiting"
              ? rawStatus
              : undefined;
          const called = data.called === true;
          const nickname =
            (typeof data.nickname === "string" && data.nickname) ||
            (typeof data.name === "string" && data.name) ||
            (typeof data.displayName === "string" && data.displayName) ||
            undefined;

          setUserMap((prev) => ({
            ...prev,
            [userId]: { status, called, nickname },
          }));
        });
      });
    });

    return () => {
      unsub();
      const current = userUnsubsRef.current;
      Object.keys(current).forEach((userId) => current[userId]());
      userUnsubsRef.current = {};
    };
  }, [uid]);

  const reservations = useMemo<Reservation[]>(() => {
    const list = queueItems.map((item) => {
      const userInfo = userMap[item.userId] || {};
      const statusFromUser = userInfo.status;
      const status: ReservationStatus =
        statusFromUser ??
        (userInfo.called === true ? "called" : "waiting");

      const name = item.name || userInfo.nickname || "ゲスト";
      const count = item.count ?? 1;

      return {
        id: item.id,
        userId: item.userId,
        name,
        count,
        status,
      };
    });

    // createdAtがある場合のみ安定ソート
    const withTime = queueItems.some((i) => i.createdAt);
    if (!withTime) return list;

    const timeMap = new Map<string, number>();
    queueItems.forEach((i) => {
      const v = i.createdAt as { toMillis?: () => number } | undefined;
      const t = v && typeof v.toMillis === "function" ? v.toMillis() : 0;
      timeMap.set(i.id, t);
    });

    return [...list].sort((a, b) => {
      return (timeMap.get(a.id) || 0) - (timeMap.get(b.id) || 0);
    });
  }, [queueItems, userMap]);

  // ステータスを順番に切り替える関数
  const toggleStatus = async (queueId: string, userId: string, current: ReservationStatus) => {
    if (!uid) return;
    const nextStatus: Record<ReservationStatus, ReservationStatus> = {
      waiting: "called",
      called: "cancelled",
      cancelled: "waiting"
    };
    try {
      const userRef = doc(db, 'apps', APP_ID, 'users', userId);
      const next = nextStatus[current];
      await updateDoc(userRef, {
        status: next,
        called: next === "called",
      });

      if (next === "cancelled") {
        const queueRef = doc(db, 'apps', APP_ID, 'general', uid, 'queue', queueId);
        await deleteDoc(queueRef);
      }
    } catch (e) {
      console.error("ステータス更新に失敗しました", e);
    }
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
          {loading ? (
            <p style={{ textAlign: "center", color: "#888", padding: "32px 0", fontSize: 14 }}>
              読み込み中...
            </p>
          ) : reservations.length === 0 ? (
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
                  onChange={() => toggleStatus(r.id, r.userId, r.status)} 
                />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
