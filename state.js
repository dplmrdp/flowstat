/* ============================================================
   STATE — Estructura de datos en memoria
   Aquí vive el "estado vivo" de la app.
   ============================================================ */

window.FS = window.FS || {};

FS.state = {

  /* ----------------------------------------
     LISTAS MAESTRAS
     ---------------------------------------- */

  jugadoras: {},   // clave jugadoraId → objeto jugadora
  equipos: {},     // clave equipoId → objeto equipo
  partidos: {},    // clave partidoId → objeto partido

  /* ----------------------------------------
     PARTIDO Y SET EN CURSO
     ---------------------------------------- */

  partidoActivo: null,    // id del partido actual
  setActivo: null,        // número del set actual

  /* ========================================
     CREACIÓN DE ENTIDADES
     ======================================== */

  crearJugadora(nombre, alias, dorsal = "", posicion = "", equipos = []) {
  const id = "j_" + crypto.randomUUID();

  FS.state.jugadoras[id] = {
    id,
    nombre,
    alias,       // nuevo campo
    dorsal,      // opcional
    posicion,    // nuevo campo
    equipos: [...equipos]
  };

  return id;
},

  crearEquipo(nombre, categoria = "") {
    const id = "t_" + crypto.randomUUID();

    FS.state.equipos[id] = {
      id,
      nombre,
      categoria,
      jugadoras: []  // lista de IDs de jugadoras
    };

    return id;
  },

  crearPartido(equipoPropio, equipoRival, fecha, categoria) {
    const id = "p_" + crypto.randomUUID();

    FS.state.partidos[id] = {
      id,
      fecha,
      equipoPropio,
      equipoRival,
      categoria,
      sets: []
    };

    return id;
  },

  /* ========================================
     GESTIÓN DE EQUIPOS
     ======================================== */

  equipoAñadirJugadora(idEquipo, idJugadora) {
    const equipo = FS.state.equipos[idEquipo];
    if (!equipo.jugadoras.includes(idJugadora)) {
      equipo.jugadoras.push(idJugadora);
    }

    // sincronizar jugadora → equipos
    const jug = FS.state.jugadoras[idJugadora];
    if (!jug.equipos.includes(idEquipo)) {
      jug.equipos.push(idEquipo);
    }
  },

  equipoQuitarJugadora(idEquipo, idJugadora) {
    const equipo = FS.state.equipos[idEquipo];
    equipo.jugadoras = equipo.jugadoras.filter(j => j !== idJugadora);

    const jug = FS.state.jugadoras[idJugadora];
    jug.equipos = jug.equipos.filter(e => e !== idEquipo);
  },

  /* ========================================
     GESTIÓN DE PARTIDO Y SET
     ======================================== */

  iniciarPartido(idPartido) {
    FS.state.partidoActivo = idPartido;
  },

  iniciarSet(numero) {
    FS.state.setActivo = numero;

    const partido = FS.state.partidos[FS.state.partidoActivo];
    partido.sets[numero - 1] = {
      numero,
      acciones: [],
      finalizado: false
    };
  },

  registrarAccion(jugadoraId, grupo, accion) {
    const partido = FS.state.partidos[FS.state.partidoActivo];
    const set = partido.sets[FS.state.setActivo - 1];

    set.acciones.push({
      ts: Date.now(),
      jugadora: jugadoraId,
      grupo,
      accion
    });
  },

  finalizarSet() {
    const partido = FS.state.partidos[FS.state.partidoActivo];
    const set = partido.sets[FS.state.setActivo - 1];
    set.finalizado = true;
    FS.state.setActivo = null;
  }
};
