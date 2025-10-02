// Import the functions you need from the SDKs you need
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyBYPE7SEA7Mj161lGtIl2iotJg7VvmmpAU',
  authDomain: 'redi-fb4ea.firebaseapp.com',
  projectId: 'redi-fb4ea',
  storageBucket: 'redi-fb4ea.firebasestorage.app',
  messagingSenderId: '827839734794',
  appId: '1:827839734794:web:ed5e0c0301b9b25b82ebf3',
  measurementId: 'G-5VS50PFWGZ',
};

// Initialize Firebase

export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_STORAGE = getStorage(FIREBASE_APP);

export const analytics = getAnalytics(FIREBASE_APP);
