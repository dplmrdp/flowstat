// firebase-init.js
alert("Firebase INIT cargado");

window.FS = window.FS || {};

const FIREBASE_CONFIG = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

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
  box.style.display = "block";
  box.textContent = "Firebase cargado. Probando Firestore…";

  db.collection("jugadoras").doc("diagnostic")
    .set({ nombre: "test" })
    .then(() => box.textContent = "✔ Firestore operativo")
    .catch(() => box.textContent = "❌ Error Firestore");
}, 1000);
