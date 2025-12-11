alert("Firebase INIT cargado");

// firebase-init.js
// Usar como <script type="module" src="firebase-init.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

window.FS = window.FS || {};
FS.firebase = FS.firebase || { enabled: false };

// ---------- CONFIGURA AQUÍ (REEMPLAZA) ----------
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyD4f7expDxaHtcU1vztS9p4IXVnYlv1Y6E",
    authDomain: "flowstat-a3843.firebaseapp.com",
    projectId: "flowstat-a3843",
    storageBucket: "flowstat-a3843.firebasestorage.app",
    messagingSenderId: "667017484046",
    appId: "1:667017484046:web:be22a16c3bdcdd75e4e95f",
    measurementId: "G-8ZESX1WGBC"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
// -------------------------------------------------

// Si no has completado la config, no inicializamos y la app seguirá funcionando localmente.
if (!FIREBASE_CONFIG || !FIREBASE_CONFIG.projectId || FIREBASE_CONFIG.apiKey === "REPLACE_APIKEY") {
  console.warn("Firebase no está configurado. Firestore deshabilitado hasta que pegues la config en firebase-init.js");
} else {
  const app = initializeApp(FIREBASE_CONFIG);
  const db = getFirestore(app);
  FS.firebase.enabled = true;
  FS.firebase.db = db;
  console.log("Firebase inicializado, projectId:", FIREBASE_CONFIG.projectId);

  // Utilidades rápidas expuestas
  FS.firebase.addAction = async function(partidoId, setNumero, actionObj){
    // ruta: partidos/{partidoId}/sets/{setNumero}/acciones
    try {
      const accionesCol = collection(db, "partidos", partidoId, "sets", String(setNumero), "acciones");
      // añadimos marca de servidor
      actionObj._server_ts = serverTimestamp();
      const docRef = await addDoc(accionesCol, actionObj);
      return { ok: true, id: docRef.id };
    } catch (err) {
      console.error("FS addAction error:", err);
      return { ok: false, error: err };
    }
  };

  FS.firebase.saveSetDoc = async function(partidoId, setNumero, setMeta){
    // guarda el documento resumen del set: /partidos/{partidoId}/sets/{setNumero}
    try {
      const setRef = doc(db, "partidos", partidoId, "sets", String(setNumero));
      const payload = Object.assign({}, setMeta, { updatedAt: serverTimestamp() });
      await setDoc(setRef, payload, { merge: true });
      return { ok: true };
    } catch (err) {
      console.error("FS saveSetDoc error:", err);
      return { ok: false, error: err };
    }
  };

  FS.firebase.savePartido = async function(partidoId, partidoObj){
    try {
      const pRef = doc(db, "partidos", partidoId);
      await setDoc(pRef, Object.assign({}, partidoObj, { updatedAt: serverTimestamp() }), { merge: true });
      return { ok: true };
    } catch (err) {
      console.error("FS savePartido error:", err);
      return { ok: false, error: err };
    }
  };

  FS.firebase.queryPartidosBySeason = async function(temporada){
    try {
      const q = query(collection(db, "partidos"), where("temporada", "==", temporada));
      const snap = await getDocs(q);
      return { ok: true, docs: snap.docs.map(d => ({ id: d.id, data: d.data() })) };
    } catch (err) {
      console.error("FS query error:", err);
      return { ok: false, error: err };
    }
  };
  /* ========== Jugadoras / Equipos helpers ========== */

// Guardar/actualizar una jugadora en /jugadoras/{id}
FS.firebase.saveJugadora = async function (id, jugadoraObj) {
  try {
    const ref = doc(FS.firebase.db, "jugadoras", id);
    await setDoc(ref, Object.assign({}, jugadoraObj, { updatedAt: serverTimestamp() }), { merge: true });
    return { ok: true };
  } catch (err) {
    console.error("FS saveJugadora error:", err);
    return { ok: false, error: err };
  }
};

// Obtener todas las jugadoras (lista)
FS.firebase.getJugadoras = async function () {
  try {
    const snap = await getDocs(collection(FS.firebase.db, "jugadoras"));
    return { ok: true, docs: snap.docs.map(d => ({ id: d.id, data: d.data() })) };
  } catch (err) {
    console.error("FS getJugadoras error:", err);
    return { ok: false, error: err };
  }
};

// Guardar/actualizar un equipo en /equipos/{id}
FS.firebase.saveEquipo = async function (id, equipoObj) {
  try {
    const ref = doc(FS.firebase.db, "equipos", id);
    await setDoc(ref, Object.assign({}, equipoObj, { updatedAt: serverTimestamp() }), { merge: true });
    return { ok: true };
  } catch (err) {
    console.error("FS saveEquipo error:", err);
    return { ok: false, error: err };
  }
};
// ==========================
// DIAGNÓSTICO FIREBASE
// ==========================
window.FS = window.FS || {};
FS.firebaseDiag = async function () {
  const box = document.getElementById("firebase-status");
  if (!box) return;

  box.style.display = "block";
  box.textContent = "Comprobando configuración Firebase…";

  if (!FS.firebase || !FS.firebase.enabled) {
    box.textContent = "❌ Firebase NO está inicializado. Revisa firebaseConfig o el orden de scripts.";
    return;
  }

  box.textContent = "✔ Firebase inicializado. Comprobando Firestore…";

  // intentamos escribir una jugadora de diagnóstico
  try {
    const testId = "diagnostic_test";
    const result = await FS.firebase.saveJugadora(testId, {
      nombre: "TEST",
      alias: "TEST",
      posicion: "central",
    });

    if (result.ok) {
      box.textContent = "✔ Firestore operativo. Revisa en consola Firebase el documento jugadoras/diagnostic_test";
    } else {
      box.textContent = "❌ Firestore NO funciona. Error: " + JSON.stringify(result.error);
    }
  } catch (e) {
    box.textContent = "❌ Error al conectar con Firestore: " + e.message;
  }
};

// Ejecutar diagnóstico cuando cargue la app
setTimeout(FS.firebaseDiag, 1500);

}
