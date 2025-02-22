import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBbHXybRof00j3xwSHuqIBh6ZrAflwvlzs",
  authDomain: "soundshift-46120.firebaseapp.com",
  projectId: "soundshift-46120",
  storageBucket: "soundshift-46120.firebasestorage.app",
  messagingSenderId: "69978835123",
  appId: "1:69978835123:web:f9d3723a801501771bc8c6",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
