FS.firebase = {
  enabled: true,
  db: db,

  async saveJugadora(id, obj) {
    try {
      await db.collection("jugadoras").doc(id)
        .set({ ...obj, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return { ok: true };
    } catch (e) { return { ok: false, error: e }; }
  },

  async getJugadoras() {
    try {
      const snap = await db.collection("jugadoras").get();
      return {
        ok: true,
        docs: snap.docs.map(d => ({ id: d.id, data: d.data() }))
      };
    } catch (e) { return { ok: false, error: e }; }
  },

  async saveEquipo(id, obj) {
    try {
      await db.collection("equipos").doc(id)
        .set({ ...obj, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return { ok: true };
    } catch (e) { return { ok: false, error: e }; }
  },

  async getEquipos() {
    try {
      const snap = await db.collection("equipos").get();
      return {
        ok: true,
        docs: snap.docs.map(d => ({ id: d.id, data: d.data() }))
      };
    } catch (e) { return { ok: false, error: e }; }
  }
};
