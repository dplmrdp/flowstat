/* ============================================================
   STORAGE — Persistencia local + hook para Firestore
   ============================================================ */

/* storage.js — actualizado para Firestore híbrido */
window.FS = window.FS || {};

FS.storage = {
  // Guardar todo de forma inmediata en localStorage
  guardarTodo() {
    try {
      localStorage.setItem("flowstat_data", JSON.stringify({
        jugadoras: FS.state.jugadoras,
        equipos: FS.state.equipos,
        partidos: FS.state.partidos
      }));
    } catch (err) {
      console.error("guardarTodo error:", err);
    }
  },

  cargarTodo() {
    try {
      const raw = localStorage.getItem("flowstat_data");
      if (!raw) return;
      const d = JSON.parse(raw);
      FS.state.jugadoras = d.jugadoras || {};
      FS.state.equipos = d.equipos || {};
      FS.state.partidos = d.partidos || {};
    } catch (err) {
      console.error("cargarTodo error:", err);
    }
  },

  // Cola para sets pendientes cuando no hay conexión
  _enqueuePendingSet(partidoId, setNumero, setObj) {
    const key = "flowstat_pending_sets";
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ partidoId, setNumero, setObj, ts: Date.now() });
    localStorage.setItem(key, JSON.stringify(arr));
  },

  _dequeuePending() {
    const key = "flowstat_pending_sets";
    localStorage.removeItem(key);
  },

  _getPending() {
    const key = "flowstat_pending_sets";
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },

  // Llamar cuando finaliza un set: guarda local y encola/sincroniza
  async handleSetFinalized(partidoId, setNumero) {
    // Guardamos localmente (ya lo hace FS.storage.guardarTodo en finalización)
    this.guardarTodo();

    const partido = FS.state.partidos[partidoId];
    const setObj = partido.sets[setNumero - 1] || null;
    if (!setObj) return;

    // Primero, intentamos subir metadata del partido
    if (FS.firebase && FS.firebase.enabled) {
      try {
        // 1) Subir/actualizar documento partido
        await FS.firebase.savePartido(partidoId, {
          id: partido.id,
          equipoPropio: partido.equipoPropio,
          equipoRival: partido.equipoRival,
          fecha: partido.fecha,
          categoria: partido.categoria,
          temporada: partido.temporada,
          campeonato: partido.campeonato,
          setsRegistrados: partido.sets.length
        });

        // 2) Guardar resumen del set
        await FS.firebase.saveSetDoc(partidoId, setNumero, {
          numero: setObj.numero,
          finalizado: true,
          acciones_count: (setObj.acciones || []).length
        });

        // 3) Subir cada acción individualmente (opcional, puede hacerse en lote)
        for (const a of (setObj.acciones || [])) {
          await FS.firebase.addAction(partidoId, setNumero, a);
        }

        // Si todo OK y existían pendientes, intentar limpiar pendientes
        const pend = this._getPending();
        if (pend.length > 0) {
          await this.syncPending();
        }

        return { ok: true };
      } catch (err) {
        console.warn("No se pudo subir set: se encola para reintento.", err);
        // no está online o error → encolamos para intentar después
        this._enqueuePendingSet(partidoId, setNumero, setObj);
        return { ok: false, error: err };
      }
    } else {
      // Firestore no activado: solo encolar (opcional) o dejar local
      this._enqueuePendingSet(partidoId, setNumero, setObj);
      return { ok: false, error: "Firestore no configurado" };
    }
  },

  // Intentar sincronizar pendientes (llamar al recuperar conexión)
  async syncPending() {
    if (!(FS.firebase && FS.firebase.enabled)) return { ok: false, error: "Firestore no activo" };
    const pend = this._getPending();
    if (!pend || pend.length === 0) return { ok: true, uploaded: 0 };

    let uploaded = 0;
    for (const item of pend) {
      try {
        // recreamos lo mismo que handleSetFinalized
        await FS.firebase.saveSetDoc(item.partidoId, item.setNumero, {
          numero: item.setObj.numero,
          finalizado: item.setObj.finalizado,
          acciones_count: (item.setObj.acciones || []).length
        });
        for (const a of (item.setObj.acciones || [])) {
          await FS.firebase.addAction(item.partidoId, item.setNumero, a);
        }
        uploaded++;
      } catch (err) {
        console.warn("syncPending item failed", item, err);
      }
    }

    // si alguno subió, borramos la cola (si quieres mantener intentos parciales, complicarías la lógica)
    if (uploaded > 0) {
      this._dequeuePending();
    }

    return { ok: true, uploaded };
  }
};

// Optional: reintentar automáticamente al reconectar
window.addEventListener("online", () => {
  if (FS.storage && FS.storage.syncPending) {
    console.log("Conexión reestablecida: intentando sincronizar pendientes...");
    FS.storage.syncPending();
  }
});

