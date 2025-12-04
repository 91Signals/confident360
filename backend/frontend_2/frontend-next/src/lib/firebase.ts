import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "confi360-7c790.firebaseapp.com",
  projectId: "confi360-7c790",
  storageBucket: "confi360-7c790.firebasestorage.app",
  messagingSenderId: "266108283870",
  appId: "1:266108283870:web:03aea3d081de91badbcb4f"
};

let app: any;
let auth: any;
let googleProvider: any;

export function getFirebaseAuth() {
  if (typeof window === "undefined") return null;

  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  }

  return { auth, googleProvider };
}
