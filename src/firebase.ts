import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCTzcmiK_wgix5oVZi1wyej_ucfwEVFwho",
  authDomain: "womens-hackathon-92eef.firebaseapp.com",
  projectId: "womens-hackathon-92eef",
  storageBucket: "womens-hackathon-92eef.firebasestorage.app",
  messagingSenderId: "522904297920",
  appId: "1:522904297920:web:a01ab7b27c67186e13e825"
};


// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// 認証（ログイン）機能
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// データベース（Firestore）機能
export const db = getFirestore(app);