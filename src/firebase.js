// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_VVIgMOtUQizZIUK7Gf3i29wGVXkz-ss",
  authDomain: "coep-hackathon-bhakti.firebaseapp.com",
  projectId: "coep-hackathon-bhakti",
  storageBucket: "coep-hackathon-bhakti.firebasestorage.app",
  messagingSenderId: "896215652449",
  appId: "1:896215652449:web:a0a44911c2a7a2b705b220",
  measurementId: "G-V97KVBG49M"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();