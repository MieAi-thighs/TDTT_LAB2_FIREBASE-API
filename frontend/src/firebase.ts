import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Cấu hình được lấy từ file secrets.toml của bạn
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "test-firebase-3e2c7.firebaseapp.com",
  projectId: "test-firebase-3e2c7",
  storageBucket: "test-firebase-3e2c7.firebasestorage.app",
  messagingSenderId: "848751893244",
  appId: "1:848751893244:web:fbdd4d9b8af90a5d4a9579"
};


// Khởi tạo Firebase (Tránh lỗi khởi tạo nhiều lần trong Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
