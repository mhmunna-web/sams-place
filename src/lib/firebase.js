import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA79vs098Tr4Z13MiXqsNIVMHfZjvWB9Y0",
  authDomain: "sams-place-emergency.firebaseapp.com",
  projectId: "sams-place-emergency",
  storageBucket: "sams-place-emergency.firebasestorage.app",
  messagingSenderId: "744910323427",
  appId: "1:744910323427:web:78c8804ae6c1e5f19cfd6",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;