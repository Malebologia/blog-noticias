// assets/js/firebase-init.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9NHlXoe5igS0iXi2fXvsWCPQJV6K53us",
  authDomain: "blog-noticias-521a4.firebaseapp.com",
  projectId: "blog-noticias-521a4",
  storageBucket: "blog-noticias-521a4.firebasestorage.app",
  messagingSenderId: "169190241674",
  appId: "1:169190241674:web:ac7551e7ab3ad9f0d00473"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportamos estos servicios para usarlos en el resto de la app
export const db = getFirestore(app);
export const auth = getAuth(app);