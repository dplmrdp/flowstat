// firebase-init.js (versión compat, robusta)
window.FS = window.FS || {};

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD4f7expDxaHtcU1vztS9p4IXVnYlv1Y6E",
  authDomain: "flowstat-a3843.firebaseapp.com",
  projectId: "flowstat-a3843",
  storageBucket: "flowstat-a3843.firebasestorage.app",
  messagingSenderId: "667017484046",
  appId: "1:667017484046:web:be22a16c3bdcdd75e4e95f",
  measurementId: "G-8ZESX1WGBC"
};

// inicializamos solo si la config parece válida (evita exceptions)
try {
  const valid = FIREBASE_CONFIG && typeof FIREBASE_CONFIG.apiKey === "string" && FIREBASE_CONFIG.apiKey.length > 5;
  if (!valid) {
    console.warn("Firebase config inválida — no se inicializa.");
    FS.firebase = { enabled: false };
  } else {
    // firebase global viene del script compat cargado en index.html
    firebase.initializeApp(FIREBASE_CONFIG);
    const db = firebase.firestore();

    FS.firebase = {
      enabled: true,
      db: db,
      async saveJugadora(id, obj) {
        try {
          await db.collection("jugadoras").doc(id).set(Object.assign({}, obj, { updatedAt: firebase.firestore.FieldValue.serverTimestamp() }), { merge: true });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e };
        }
      },
      async getJugadoras() {
        try {
          const snap = await db.collection("jugadoras").get();
          return { ok: true, docs: snap.docs.map(d => ({ id: d.id, data: d.data() })) };
        } catch (e) {
          return { ok: false, error: e };
        }
      },
      async saveEquipo(id, obj) {
        try {
          await db.collection("equipos").doc(id).set(Object.assign({}, obj, { updatedAt: firebase.firestore.FieldValue.serverTimestamp() }), { merge: true });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e };
        }
      }
    };

    // Diagnóstico no intrusivo (intentar escribir un doc de prueba)
    setTimeout(() => {
      const box = document.getElementById("firebase-status");
      if (box) {
        box.style.display = "block";
        box.textContent = "Firebase cargado. Probando Firestore…";
      }
      FS.firebase.saveJugadora("diagnostic_test", { nombre: "diag", alias: "diag" })
        .then(r => { if (box) box.textContent = r.ok ? "✔ Firestore operativo" : "❌ Error Firestore"; })
        .catch(() => { if (box) box.textContent = "❌ Error Firestore"; });
    }, 800);
  }
} catch (err) {
  console.error("Error inicializando Firebase:", err);
  FS.firebase = { enabled: false };
}
