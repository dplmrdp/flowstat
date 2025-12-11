// =====================================================
// Firebase INIT
// =====================================================

alert("Firebase INIT cargado");

window.FS = window.FS || {};

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

// Si falta algún campo → NO inicializar
if (
  !FIREBASE_CONFIG.apiKey ||
  FIREBASE_CONFIG.apiKey === "TU_APIKEY_AQUI"
) {
  console.error("❌ Firebase: configuración incompleta. No se inicializa.");
  FS.firebase = { enabled: false };
} else {

  firebase.initializeApp(FIREBASE_CONFIG);
  const db = firebase.firestore();

  FS.firebase = {
    enabled: true,
    db: db,

    async saveJugadora(id, obj) {
      try {
        await db.collection("jugadoras").doc(id).set(obj, { merge: true });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e };
      }
    },

    async getJugadoras() {
      try {
        const snap = await db.collection("jugadoras").get();
        return {
          ok: true,
          docs: snap.docs.map(d => ({ id: d.id, data: d.data() }))
        };
      } catch (e) {
        return { ok: false, error: e };
      }
    }
  };

  // Diagnóstico
  setTimeout(() => {
    const box = document.getElementById("firebase-status");
    if (box) {
      box.style.display = "block";
      box.textContent = "Firebase cargado. Probando Firestore…";
    }

    db.collection("jugadoras").doc("diagnostic")
      .set({ nombre: "test" })
      .then(() => {
        if (box) box.textContent = "✔ Firestore operativo";
      })
      .catch(err => {
        if (box) box.textContent = "❌ Error Firestore";
        console.error("Firestore error:", err);
      });

  }, 1000);
}
