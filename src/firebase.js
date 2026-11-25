import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPTZVSJo_2o2Ic3VDDI3Ia9OTPd8nmsZU",
  authDomain: "://firebaseapp.com",
  projectId: "global-digi-campus",
  storageBucket: "global-digi-campus.firebasestorage.app",
  messagingSenderId: "197580109950",
  appId: "1:197580109950:web:a06eee2997c4467af6802f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
