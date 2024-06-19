// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration for the primary project
const primaryFirebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "chat-app-3fbbd.firebaseapp.com",
  projectId: "chat-app-3fbbd",
  storageBucket: "chat-app-3fbbd.appspot.com",
  messagingSenderId: "2183294647",
  appId: "1:2183294647:web:362290527c909421426732"
};

// Your web app's Firebase configuration for the secondary project
const secondaryFirebaseConfig = {
  apiKey: import.meta.env.VITE_SECONDARY_API_KEY,
  authDomain: "backup-chat-app-8d073.firebaseapp.com",
  projectId: "backup-chat-app-8d073",
  storageBucket: "backup-chat-app-8d073.appspot.com",
  messagingSenderId: "662709984297",
  appId: "1:662709984297:web:0df72319b1adb9e0825038"
};

// Initialize Firebase for primary project
const primaryApp = initializeApp(primaryFirebaseConfig);
export const auth = getAuth(primaryApp);
export const db = getFirestore(primaryApp);
export const storage = getStorage(primaryApp);

// Initialize Firebase for secondary project
const secondaryApp = initializeApp(secondaryFirebaseConfig, "secondary");
export const secondaryAuth = getAuth(secondaryApp);
export const secondaryDb = getFirestore(secondaryApp);
export const secondaryStorage = getStorage(secondaryApp);

