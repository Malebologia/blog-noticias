import { auth } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { loginUsuario, registrarUsuario, cerrarSesion } from './auth.js';
import { 
    guardarNoticia, 
    obtenerNoticias, 
    obtenerNoticiaPorId, 
    registrarNoticiaVista,
    guardarComentario,
    obtenerComentarios 
} from './db-manager.js';

// --- REFERENCIAS AL DOM ---
const loginForm = document.getElementById('login-form');
const formNoticia = document.getElementById('form-noticia');
const contenedorNoticias = document.getElementById('contenedor-noticias');
const contenedorDetalle = document.getElementById('detalle-noticia');
const listaRevisadas = document.getElementById('noticias-revisadas');
const formComentario = document.getElementById('form-comentario');
const listaComentarios = document.getElementById('lista-comentarios');

// --- FUNCIONES DE LÓGICA ---

const cargarInicio = async () => {
    if (!contenedorNoticias) return;
    const noticias = await obtenerNoticias();
    
    if (noticias.length === 0) {
        contenedorNoticias.innerHTML = '<p class="text-center">No hay noticias.</p>';
        return;
    }
    
    // Acumulamos el HTML para insertarlo de una sola vez
    let htmlContent = "";
    noticias.forEach(n => {
        htmlContent += `
            <div class="card mb-4 shadow-sm">
                <div class="card-body">
                    <span class="badge bg-secondary mb-2">${n.categoria}</span>
                    <h2 class="card-title h4">${n.titulo}</h2>
                    <p class="card-text text-muted">${n.contenido.substring(0, 100)}...</p>
                    <a href="detalle.html?id=${n.id}" class="btn btn-sm btn-outline-primary">Leer más</a>
                </div>
            </div>`;
    });
    
    contenedorNoticias.innerHTML = htmlContent;
};

const cargarComentarios = async (noticiaId) => {
    if (!listaComentarios) return;
    const comentarios = await obtenerComentarios(noticiaId);
    listaComentarios.innerHTML = comentarios.map(c => `
        <div class="border-bottom mb-2 pb-2">
            <p class="mb-1">${c.texto}</p>
            <small class="text-muted">Publicado hace poco</small>
        </div>
    `).join('');
};

const cargarDetalleNoticia = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (contenedorDetalle && id) {
        const noticia = await obtenerNoticiaPorId(id);
        if (noticia) {
            contenedorDetalle.innerHTML = `
                <span class="badge bg-primary mb-2">${noticia.categoria}</span>
                <h1>${noticia.titulo}</h1>
                <p class="text-muted small">Publicado: ${noticia.fecha.toDate().toLocaleDateString()}</p>
                <hr>
                <p style="white-space: pre-wrap;">${noticia.contenido}</p>
            `;
            registrarNoticiaVista(noticia);
            cargarComentarios(id); // Cargar comentarios al ver detalle
        }
    }
};

const mostrarHistorial = () => {
    if (listaRevisadas) {
        const vistas = JSON.parse(localStorage.getItem('revisadas')) || [];
        listaRevisadas.innerHTML = vistas.map(n => `
            <a href="detalle.html?id=${n.id}" class="list-group-item list-group-item-action small">
                ${n.titulo}
            </a>
        `).join('');
    }
};

// --- STICKY FOOTER GLOBAL ---
const inicializarBarraGlobal = () => {
    // Evitar duplicados
    if (document.getElementById('sf-custom')) return;

    // Crear inyección DOM
    const footer = document.createElement('div');
    footer.id = 'sf-custom';
    footer.className = 'sticky-footer-custom bg-dark text-light';
    footer.innerHTML = `
        <div class="container d-flex justify-content-between align-items-center">
            <div id="sf-clima">🌤️ Cargando clima...</div>
            <div id="sf-hora">⏱️ --:--:--</div>
            <div id="sf-indicadores">💰 Cargando indicadores...</div>
        </div>
    `;
    document.body.appendChild(footer);

    const elClima = document.getElementById('sf-clima');
    const elHora = document.getElementById('sf-hora');
    const elIndicadores = document.getElementById('sf-indicadores');

    // 1. Reloj en Tiempo Real (Santiago, Chile) - 1 seg interval
    const actualizarHora = () => {
        const options = { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const horaLocal = new Intl.DateTimeFormat('es-CL', options).format(new Date());
        if(elHora) elHora.innerHTML = `⏱️ Stgo: ${horaLocal}`;
    };
    setInterval(actualizarHora, 1000);
    actualizarHora(); // Primera ejecución inmediata

    // 2. Clima (Open-Meteo)
    const fetchClima = async () => {
        try {
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-33.4569&longitude=-70.6483&current_weather=true');
            const data = await res.json();
            const temp = data.current_weather.temperature;
            if(elClima) elClima.innerHTML = `🌤️ Temp: ${temp}°C`;
        } catch (e) {
            console.error('Error al cargar clima', e);
            if(elClima) elClima.innerHTML = `🌤️ Temp: N/D`;
        }
    };

    // 3. Indicadores (mindicador.cl)
    const fetchIndicadores = async () => {
        try {
            const res = await fetch('https://mindicador.cl/api');
            const data = await res.json();
            const uf = data.uf.valor.toLocaleString('es-CL');
            const dolar = data.dolar.valor.toLocaleString('es-CL');
            if(elIndicadores) elIndicadores.innerHTML = `💰 USD: $${dolar} | UF: $${uf}`;
        } catch (e) {
            console.error('Error al cargar indicadores', e);
            if(elIndicadores) elIndicadores.innerHTML = `💰 Ind: N/D`;
        }
    };

    // Llamadas iniciales y subscripciones cada 10 min
    fetchClima();
    fetchIndicadores();
    setInterval(fetchClima, 10 * 60 * 1000);
    setInterval(fetchIndicadores, 10 * 60 * 1000);
};

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    cargarInicio();
    cargarDetalleNoticia();
    mostrarHistorial();
    inicializarBarraGlobal();
});

// --- ESTADO DE AUTENTICACIÓN ---
onAuthStateChanged(auth, (user) => {
    const btnLogin = document.getElementById('btn-login');
    const btnNoticia = document.querySelector('a[href="crear-noticia.html"]');
    const formComentario = document.getElementById('form-comentario');
    if (btnLogin) {
        if (user) {
            // Usuario está logueado
            btnLogin.textContent = "Cerrar Sesión";
            btnLogin.href = "#"; // Rompemos enlace si es click simple, o lo dejamos para event listener
            btnLogin.classList.add("text-danger"); // un toque visual
            
            // Creamos un event listener nuevo o sobreescribimos comportamiento
            btnLogin.onclick = async (e) => {
                e.preventDefault();
                await cerrarSesion();
                window.location.href = "index.html";
            };
        } else {
            // Usuario no está logueado
            btnLogin.textContent = "Login/Registro";
            btnLogin.href = "login.html";
            btnLogin.classList.remove("text-danger");
            btnLogin.onclick = null; // quitar listener previo
        }
        if (user) {
            // Usuario logueado: mostrar todo
            if (btnNoticia) btnNoticia.computedStyleMap.display = 'block';
            if (formComentario) formComentario.style.display = 'block';   
        } else {
            // Usuario no logueado: ocultar botones de escritura
            if (btnNoticia) btnNoticia.style.display = 'none';
            if (formComentario) formComentario.style.display = 'none';
        }
    }
});

// --- LÓGICA DE EVENTOS ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await registrarUsuario(email, password);
            window.location.href = "index.html"; 
        } catch (error) {
            //Si el correo ya existe, intentamos loguear
            if (error.code === 'auth/email-already-in-use'){
                try {
                    await loginUsuario(email, password);
                    window.location.href = "index.html";   
                } catch (loginError) {
                    alert("Contraseña incorrecta o error de acceso.");
                }
            } else {
                alert("Error: " + error.message);
            }
        }
    });
}

if (formNoticia) {
    formNoticia.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('titulo').value;
        const categoria = document.getElementById('categoria').value;
        const contenido = document.getElementById('contenido').value;
        await guardarNoticia(titulo, contenido, categoria);
        window.location.href = "index.html";
    });
}

if (formComentario) {
    formComentario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const texto = document.getElementById('texto-comentario').value;
        const params = new URLSearchParams(window.location.search);
        const noticiaId = params.get('id');
        if (noticiaId) {
            await guardarComentario(noticiaId, texto);
            document.getElementById('texto-comentario').value = '';
            cargarComentarios(noticiaId);
        }
    });
}