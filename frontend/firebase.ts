// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHV7mKBF3GqU_WxLIJeBaSPMear3t9oBs",
  authDomain: "redi-1c25e.firebaseapp.com",
  projectId: "redi-1c25e",
  storageBucket: "redi-1c25e.firebasestorage.app",
  messagingSenderId: "272234540869",
  appId: "1:272234540869:web:d39079c3a5cd5381fc182c"
};

// Initialize Firebase

export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_STORAGE = getStorage(FIREBASE_APP);

export const analytics = getAnalytics(FIREBASE_APP);