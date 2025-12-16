// firebase-init.js — FlowStat Firestore API
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

try {
  firebase.initializeApp(FIREBASE_CONFIG);
  const db = firebase.firestore();

  FS.firebase = {
    enabled: true,
    db,

    /* ======================================================
       JUGADORAS
       ====================================================== */

    async saveJugadora(id, data) {
      try {
        await db.collection("jugadoras").doc(id).set(
          {
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        );
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
    },

    async deleteJugadora(id) {
      try {
        await db.collection("jugadoras").doc(id).delete();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e };
      }
    },

    /* ======================================================
       EQUIPOS
       ====================================================== */

    async saveEquipo(id, data) {
      try {
        await db.collection("equipos").doc(id).set(
          {
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        );
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e };
      }
    },

    async getEquipos() {
      try {
        const snap = await db.collection("equipos").get();
        return {
          ok: true,
          docs: snap.docs.map(d => ({ id: d.id, data: d.data() }))
        };
      } catch (e) {
        return { ok: false, error: e };
      }
    },

    async deleteEquipo(id) {
      try {
        await db.collection("equipos").doc(id).delete();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e };
      }
    }
    /* ======================================================
   PARTIDOS
   ====================================================== */

async savePartido(id, data) {
  try {
    await this.db.collection("partidos").doc(id).set(
      {
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
},

async getPartidos() {
  try {
    const snap = await this.db.collection("partidos").get();
    return {
      ok: true,
      docs: snap.docs.map(d => ({ id: d.id, data: d.data() }))
    };
  } catch (e) {
    return { ok: false, error: e };
  }
},

async deletePartido(id) {
  try {
    await this.db.collection("partidos").doc(id).delete();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

  };

} catch (err) {
  console.error("Error inicializando Firebase:", err);
  FS.firebase = { enabled: false };
}
