import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAnK0iCASTBRxIoEjs-5zC3L_fT6nX85Ng",
  authDomain: "real-estate-app-5241d.firebaseapp.com",
  projectId: "real-estate-app-5241d",
  storageBucket: "real-estate-app-5241d.appspot.com",
  messagingSenderId: "264996611896",
  appId: "1:264996611896:web:14b619cb39859d35e0c3cd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore()