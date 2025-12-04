/* ============================================================
   STORAGE — Persistencia local + hook para Firestore
   ============================================================ */

window.FS = window.FS || {};

FS.storage = {

  /* ===========================
     GUARDAR TODO EN LOCAL
     =========================== */

  guardarTodo() {
    localStorage.setItem("flowstat_data", JSON.stringify({
      jugadoras: FS.state.jugadoras,
      equipos: FS.state.equipos,
      partidos: FS.state.partidos
    }));
  },

  /* ===========================
     CARGAR TODO
     =========================== */

  cargarTodo() {
    const raw = localStorage.getItem("flowstat_data");
    if (!raw) return;

    const d = JSON.parse(raw);

    FS.state.jugadoras = d.jugadoras || {};
    FS.state.equipos = d.equipos || {};
    FS.state.partidos = d.partidos || {};
  },

  /* ===========================
     BACKUP SET EN CURSO
     =========================== */

  backupSet() {
    const partido = FS.state.par​​tidos[FS.state.partidoActivo];
    if (!partido) return;

    localStorage.setItem("flowstat_partido_activo", JSON.stringify(partido));
  },

  /* ===========================
     FIRESTORE (PENDIENTE)
     =========================== */

  async subirSet(partidoId, setNumero, acciones) {
    console.log("🔥 Subir a Firestore:", partidoId, setNumero, acciones);
    // Aquí irá la escritura real
  }
};
