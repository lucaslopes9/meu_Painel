import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth"; // <--- Faltava esta linha

const firebaseConfig = {
  apiKey: "AIzaSyCsu1aQ2S09TRbubwa-TkRqiaovEK39eno",
  authDomain: "uaigonovo.firebaseapp.com",
  databaseURL: "https://uaigonovo-default-rtdb.firebaseio.com",
  projectId: "uaigonovo",
  storageBucket: "uaigonovo.firebasestorage.app",
  messagingSenderId: "734882211401",
  appId: "1:734882211401:web:725d4d720f6f5e72f68198"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta o Banco de Dados
export const db = getDatabase(app);

// Inicializa e exporta a Autenticação
export const auth = getAuth(app); // <--- Faltava exportar o auth aqui