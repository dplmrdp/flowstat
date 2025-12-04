/* ============================================================
   STATE — Modelo de datos en memoria para FlowStat
   Versión completa con temporada y campeonato
   ============================================================ */

window.FS = window.FS || {};

FS.state = {

  /* ========================================
     ENTIDADES PRINCIPALES
     ======================================== */

  jugadoras: {},   // j_id → { ... }
  equipos: {},     // t_id → { ... }
  partidos: {},    // p_id → { ... }

  partidoActivo: null,
  setActivo: null,


  /* ========================================
     JUGADORAS
     ======================================== */

  crearJugadora(nombre, alias, dorsal, posicion) {
    const id = "j_" + crypto.randomUUID();

    FS.state.jugadoras[id] = {
      id,
      nombre,
      alias,
      dorsal,
      posicion,
      equipos: []
    };

    return id;
  },


  /* ========================================
     EQUIPOS
     ======================================== */

  crearEquipo(nombre, categoria, temporada) {
    const id = "t_" + crypto.randomUUID();

    FS.state.equipos[id] = {
      id,
      nombre,
      categoria,
      temporada,
      jugadoras: []
    };

    return id;
  },

  equipoAñadirJugadora(idEquipo, idJugadora) {
    const e = FS.state.equipos[idEquipo];
    const j = FS.state.jugadoras[idJugadora];

    if (!e.jugadoras.includes(idJugadora))
      e.jugadoras.push(idJugadora);

    if (!j.equipos.includes(idEquipo))
      j.equipos.push(idEquipo);
  },

  equipoQuitarJugadora(idEquipo, idJugadora) {
    FS.state.equipos[idEquipo].jugadoras =
      FS.state.equipos[idEquipo].jugadoras.filter(x => x !== idJugadora);

    FS.state.jugadoras[idJugadora].equipos =
      FS.state.jugadoras[idJugadora].equipos.filter(x => x !== idEquipo);
  },


  /* ========================================
     PARTIDOS
     ======================================== */

  crearPartido(equipoPropio, rival, fecha, categoria, temporada, campeonato) {
    const id = "p_" + crypto.randomUUID();

    FS.state.partidos[id] = {
      id,
      equipoPropio,
      equipoRival: rival,
      fecha,
      categoria,
      temporada,
      campeonato,
      sets: []
    };

    return id;
  },

  iniciarPartido(idPartido) {
    FS.state.partidoActivo = idPartido;
  },


  /* ========================================
     SETS Y ACCIONES
     ======================================== */

  iniciarSet(numero) {
    const partido = FS.state.partidos[FS.state.partidoActivo];

    partido.sets[numero - 1] = {
      numero,
      finalizado: false,
      acciones: []
    };

    FS.state.setActivo = numero;
  },

  registrarAccion(jugadora, grupo, accion) {
    const partido = FS.state.partidos[FS.state.partidoActivo];
    const set = partido.sets[FS.state.setActivo - 1];

    set.acciones.push({
      ts: Date.now(),
      jugadora,
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
