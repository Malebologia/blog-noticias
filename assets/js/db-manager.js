// assets/js/db-manager.js
import { db } from './firebase-init.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    doc, 
    getDoc,
    serverTimestamp,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Guarda una nueva noticia en la colección 'noticias' de Firestore.
 */
export const guardarNoticia = async (titulo, contenido, categoria) => {
    try {
        await addDoc(collection(db, "noticias"), {
            titulo: titulo,
            contenido: contenido,
            categoria: categoria,
            fecha: new Date()
        });
        console.log("Noticia guardada con éxito en Firestore");
    } catch (e) {
        console.error("Error al guardar en base de datos: ", e);
        throw e;
    }
};

/**
 * Obtiene todas las noticias ordenadas por fecha descendente.
 */
export const obtenerNoticias = async () => {
    try {
        // Optimización: Limitamos a 50 noticias para prevenir consumo excesivo de memoria
        const q = query(collection(db, "noticias"), orderBy("fecha", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        let noticias = [];
        querySnapshot.forEach((doc) => {
            noticias.push({ id: doc.id, ...doc.data() });
        });
        return noticias;
    } catch (e) {
        console.error("Error al obtener noticias: ", e);
        return [];
    }
};

/**
 * Obtiene una noticia específica mediante su ID.
 */
export const obtenerNoticiaPorId = async (id) => {
    try {
        const docRef = doc(db, "noticias", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (e) {
        console.error("Error al obtener documento:", e);
        return null;
    }
};

/**
 * Registra la noticia en el historial local del navegador (LocalStorage).
 */
export const registrarNoticiaVista = (noticia) => {
    let vistas = JSON.parse(localStorage.getItem('revisadas')) || [];
    // Filtramos para evitar duplicados y mantenemos la más reciente arriba
    vistas = vistas.filter(n => n.id !== noticia.id);
    vistas.unshift({ id: noticia.id, titulo: noticia.titulo });
    // Guardamos solo las últimas 5 para no saturar la vista
    localStorage.setItem('revisadas', JSON.stringify(vistas.slice(0, 5)));
};

/**
 * Guardar comentario en una sub-colección de la noticia 
 */
export const guardarComentario = async (NoticiaId, texto) => {
    try {
        const docRef = collection(db, "noticias", NoticiaId, "comentarios");
        await addDoc(docRef, {
            texto: texto,
            fecha: serverTimestamp(),
            autor: "Anonimo"
        });
    }catch (e) {
        console.error("Error al guardar comentario: ", e);
    }
};

/**
 * Obtener comentarios de una noticia
 */
export const obtenerComentarios = async (noticiaId) => {
    try {
        const colRef = collection(db, "noticias", noticiaId, "comentarios");
        // Optimización: Limitamos a 30 comentarios por página/noticia
        const q = query(colRef, orderBy("fecha", "desc"), limit(30));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error al obtener comentarios:", e);
        return [];
    }
};
