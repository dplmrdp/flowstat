/* ============================================================
   STORAGE — Capa de persistencia (Local + Online híbrido)
   ============================================================ */

window.FS = window.FS || {};

FS.storage = {

  /* ----------------------------------------
     LOCAL STORAGE
     ---------------------------------------- */

  guardarTodo() {
    localStorage.setItem("flowstat_data", JSON.stringify({
      jugadoras: FS.state.jugadoras,
      equipos: FS.state.equipos,
      partidos: FS.state.partidos
    }));
  },

  cargarTodo() {
    const raw = localStorage.getItem("flowstat_data");
    if (!raw) return;

    const data = JSON.parse(raw);

    FS.state.jugadoras = data.jugadoras || {};
    FS.state.equipos = data.equipos || {};
    FS.state.partidos = data.partidos || {};
  },

  backupSetEnCurso() {
    const partido = FS.state.partidos[FS.state.partidoActivo];
    if (!partido) return;

    localStorage.setItem("flowstat_partido_activo", JSON.stringify(partido));
  },

  borrarTodo() {
    localStorage.removeItem("flowstat_data");
  },


  /* ----------------------------------------
     FIRESTORE (Opciones híbridas)
     ---------------------------------------- */

  async subirSetAFirestore(idPartido, setData) {
    // ← Aquí conectaremos Firestore con:
    //    - firebase.initializeApp()
    //    - import de firestore
    //    - sets en:
    //    /partidos/{idPartido}/sets/{setN}/acciones

    console.log("🔥 (pendiente) SUBIR A FIRESTORE:", idPartido, setData);
  },

  async subirPartidoCompleto(idPartido) {
    const partido = FS.state.partidos[idPartido];
    console.log("🔥 (pendiente) subir partido entero:", partido);
  }
};
