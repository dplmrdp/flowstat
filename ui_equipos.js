/* ============================================================
   ui_equipos.js
   Gestión de equipos dentro del SPA FlowStat
   ============================================================ */

window.FS = window.FS || {};
FS.equipos = {};


/* ============================================================
   RENDER DE LISTA DE EQUIPOS
   ============================================================ */

FS.equipos.renderLista = function () {
  const cont = document.getElementById("lista-equipos");
  cont.innerHTML = "";

  const equipos = FS.state.equipos;
  const ids = Object.keys(equipos);

  if (ids.length === 0) {
    cont.innerHTML = "<p>No hay equipos registrados.</p>";
    return;
  }

  ids.forEach(id => {
    const eq = equipos[id];

    const div = document.createElement("div");
    div.className = "equipo-item";
    div.style = `
      padding: 10px;
      background: white;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 0 4px rgba(0,0,0,0.1);
    `;

    div.innerHTML = `
      <strong>${eq.nombre}</strong>
      <br>
      <small>Categoría: ${eq.categoria || "—"}</small>
      <br><br>

      <button onclick="FS.equipos.verJugadoras('${id}')">👁 Ver jugadoras</button>
      <button onclick="FS.equipos.editar('${id}')">✏ Editar</button>
      <button onclick="FS.equipos.editarJugadoras('${id}')">👥 Gestionar jugadoras</button>
      <button onclick="FS.equipos.borrar('${id}')">🗑 Borrar</button>
    `;

    cont.appendChild(div);
  });
};


/* ============================================================
   CREAR EQUIPO
   ============================================================ */

FS.equipos.create = function () {
  const nombre = prompt("Nombre del equipo:");
  if (!nombre) return;

  const categoria = prompt("Categoría (ej: Cadete, Infantil, Senior):") || "";

  const teamId = FS.state.crearEquipo(nombre, categoria);

  FS.storage.guardarTodo();
  FS.equipos.renderLista();
};


/* ============================================================
   EDITAR EQUIPO (nombre/categoría)
   ============================================================ */

FS.equipos.editar = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];
  if (!eq) return;

  const nuevoNombre = prompt("Nuevo nombre del equipo:", eq.nombre);
  if (!nuevoNombre) return;

  const nuevaCategoria = prompt("Categoría:", eq.categoria);
  if (nuevaCategoria == null) return;

  eq.nombre = nuevoNombre;
  eq.categoria = nuevaCategoria;

  FS.storage.guardarTodo();
  FS.equipos.renderLista();
};


/* ============================================================
   VER JUGADORAS DE UN EQUIPO (solo lectura)
   ============================================================ */

FS.equipos.verJugadoras = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];
  const jugadoras = FS.state.jugadoras;

  let msg = `Jugadoras de ${eq.nombre}:\n\n`;

  if (eq.jugadoras.length === 0) {
    alert(msg + "(ninguna jugadora asignada)");
    return;
  }

  eq.jugadoras.forEach(jid => {
    const j = jugadoras[jid];
    msg += `#${j.dorsal} - ${j.nombre}\n`;
  });

  alert(msg);
};


/* ============================================================
   GESTIONAR JUGADORAS DE UN EQUIPO
   (asignar y quitar jugadoras ya creadas)
   ============================================================ */

FS.equipos.editarJugadoras = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];
  const jugadoras = FS.state.jugadoras;

  const idsJug = Object.keys(jugadoras);

  if (idsJug.length === 0) {
    alert("No hay jugadoras creadas todavía.");
    return;
  }

  let msg = `Asignar jugadoras a ${eq.nombre}:\n\n`;

  idsJug.forEach((jid, idx) => {
    const j = jugadoras[jid];
    const asignada = eq.jugadoras.includes(jid) ? "✔" : "✖";
    msg += `${idx + 1}. #${j.dorsal} ${j.nombre} [${asignada}]\n`;
  });

  msg += "\nIntroduce los números de las jugadoras asignadas (ej: 1,3,4):";

  const selec = prompt(msg);
  if (!selec) return;

  const nums = selec.split(",").map(n => parseInt(n.trim()));

  const nuevas = [];

  nums.forEach(n => {
    const jid = idsJug[n - 1];
    if (jid) nuevas.push(jid);
  });

  /* 
     Sincronizar asignación:
     - Equipo ← Jugadoras
     - Jugadoras ← Equipo
  */
  eq.jugadoras = nuevas;

  nuevas.forEach(jid => {
    const j = FS.state.jugadoras[jid];
    if (!j.equipos.includes(idEquipo)) j.equipos.push(idEquipo);
  });

  idsJug.forEach(jid => {
    if (!nuevas.includes(jid)) {
      const j = FS.state.jugadoras[jid];
      j.equipos = j.equipos.filter(eid => eid !== idEquipo);
    }
  });

  FS.storage.guardarTodo();
  FS.equipos.renderLista();
};


/* ============================================================
   BORRAR EQUIPO
   ============================================================ */

FS.equipos.borrar = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];
  if (!confirm(`¿Eliminar el equipo ${eq.nombre}?`)) return;

  // Eliminar referencias en jugadoras
  for (const jid in FS.state.jugadoras) {
    const j = FS.state.jugadoras[jid];
    j.equipos = j.equipos.filter(eid => eid !== idEquipo);
  }

  delete FS.state.equipos[idEquipo];

  FS.storage.guardarTodo();
  FS.equipos.renderLista();
};


/* ============================================================
   HOOK — SE EJECUTA AL ENTRAR A LA VISTA
   ============================================================ */

FS.equipos.onEnter = function () {
  FS.equipos.renderLista();
};
