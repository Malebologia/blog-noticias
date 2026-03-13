// assets/js/auth.js
import { auth } from './firebase-init.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Función para registrar usuario
export const registrarUsuario = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

// Función para iniciar sesión
export const loginUsuario = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

// Función para cerrar sesión
export const cerrarSesion = () => {
    return signOut(auth);
};