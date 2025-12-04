import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Substitua pelos dados do seu console do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCeE69Y-fhOAkBzACduCE77q0Pgq2HtjKg",
  authDomain: "revsfy.firebaseapp.com",
  projectId: "revsfy",
  storageBucket: "revsfy.firebasestorage.app",
  messagingSenderId: "290827200304",
  appId: "1:290827200304:web:6430ec0082f0b048ce0af5",
  measurementId: "G-CTV4YZ4M7C"
};

// Inicializa o Firebase
export const app = initializeApp(firebaseConfig);

// Exporta o serviço de autenticação para usar no resto do app
export const auth = getAuth(app);