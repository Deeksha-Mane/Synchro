// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbHbNo6QvLGqayw0BCld47dcKDrHco12o",
  authDomain: "ceop-hackathon-p2.firebaseapp.com",
  projectId: "ceop-hackathon-p2",
  storageBucket: "ceop-hackathon-p2.firebasestorage.app",
  messagingSenderId: "347073858321",
  appId: "1:347073858321:web:7b6eb5e2d4457b6bfedab0"
};




// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();