/* ============================================================
   ui_jugadoras.js
   Interfaz de gestión de jugadoras para FlowStat
   ============================================================ */

window.FS = window.FS || {};
FS.jugadoras = {};


/* ============================================================
   MOSTRAR LISTA DE JUGADORAS
   ============================================================ */

FS.jugadoras.renderLista = function () {
  const cont = document.getElementById("lista-jugadoras");
  cont.innerHTML = "";

  const jugadoras = FS.state.jugadoras;
  const equipos = FS.state.equipos;

  const ids = Object.keys(jugadoras);

  if (ids.length === 0) {
    cont.innerHTML = "<p>No hay jugadoras registradas.</p>";
    return;
  }

  ids.forEach(id => {
    const j = jugadoras[id];

    // Mostrar lista de equipos a los que pertenece
    const etiquetaEquipos = j.equipos.map(eid => FS.state.equipos[eid]?.nombre || "(?)").join(", ");

    const div = document.createElement("div");
    div.className = "jugadora-item";
    div.style = `
      padding: 8px;
      border-radius: 8px;
      background: white;
      margin-bottom: 8px;
      box-shadow: 0 0 4px rgba(0,0,0,0.1);
    `;

    div.innerHTML = `
      <strong>#${j.dorsal}</strong> ${j.nombre}<br>
      <small>Equipos: ${etiquetaEquipos || "—"}</small><br><br>

      <button onclick="FS.jugadoras.edit('${id}')">✏ Editar</button>
      <button onclick="FS.jugadoras.asignarEquipos('${id}')">👥 Asignar equipos</button>
      <button onclick="FS.jugadoras.borrar('${id}')">🗑 Borrar</button>
    `;

    cont.appendChild(div);
  });
};


/* ============================================================
   CREAR JUGADORA
   ============================================================ */

FS.jugadoras.create = function () {

  const nombre = prompt("Nombre completo:");
  if (!nombre) return;

  let alias = prompt("Alias (máx. 7 caracteres):");
  if (!alias) {
    alert("Debes introducir un alias.");
    return;
  }
  alias = alias.slice(0,7); // limitar longitud

  const dorsal = prompt("Dorsal (opcional):") || "";

  const posicion = prompt(
    "Posición (por defecto):\n" +
    "colocadora / opuesta / central / punta / libero"
  ) || "";

  const id = FS.state.crearJugadora(
    nombre,
    alias,
    dorsal,
    posicion
  );

  FS.storage.guardarTodo();
  FS.jugadoras.renderLista();
};



/* ============================================================
   EDITAR JUGADORA
   ============================================================ */

FS.jugadoras.edit = function (idJugadora) {
  const j = FS.state.jugadoras[idJugadora];
  if (!j) return;

  const nuevoNombre = prompt("Editar nombre:", j.nombre);
  if (!nuevoNombre) return;

  const nuevoDorsal = prompt("Editar dorsal:", j.dorsal);
  if (!nuevoDorsal) return;

  j.nombre = nuevoNombre;
  j.dorsal = nuevoDorsal;

  FS.storage.guardarTodo();
  FS.jugadoras.renderLista();
};


/* ============================================================
   BORRAR JUGADORA
   ============================================================ */

FS.jugadoras.borrar = function (idJugadora) {
  const j = FS.state.jugadoras[idJugadora];

  if (!confirm(`¿Eliminar a ${j.nombre}?`)) return;

  // Eliminar de todos los equipos
  for (const idEquipo in FS.state.equipos) {
    FS.state.equipos[idEquipo].jugadoras =
      FS.state.equipos[idEquipo].jugadoras.filter(jid => jid !== idJugadora);
  }

  // Eliminar del listado global
  delete FS.state.jugadoras[idJugadora];

  FS.storage.guardarTodo();
  FS.jugadoras.renderLista();
};


/* ============================================================
   ASIGNAR JUGADORA A EQUIPOS
   ============================================================ */

FS.jugadoras.asignarEquipos = function (idJugadora) {
  const j = FS.state.jugadoras[idJugadora];
  const equipos = FS.state.equipos;

  let mensaje = `Asignar equipos a ${j.nombre}:\n\n`;

  const idsEquipos = Object.keys(equipos);

  if (idsEquipos.length === 0) {
    alert("No hay equipos creados todavía.");
    return;
  }

  idsEquipos.forEach((id, idx) => {
    const eq = equipos[id];
    const asignada = j.equipos.includes(id) ? "✔" : "✖";
    mensaje += `${idx + 1}. ${eq.nombre} [${asignada}]\n`;
  });

  mensaje += "\nIntroduce números separados por comas (ej: 1,3):";

  const selec = prompt(mensaje);
  if (!selec) return;

  const nums = selec.split(",").map(s => parseInt(s.trim()));

  // Actualizamos lista de equipos asignados
  const nuevosEquipos = [];

  nums.forEach(n => {
    const eqId = idsEquipos[n - 1];
    if (eqId) nuevosEquipos.push(eqId);
  });

  // Sincronizar asignaciones
  j.equipos = nuevosEquipos;

  // Mantener equipos actualizados
  idsEquipos.forEach(idEquipo => {
    const equipo = equipos[idEquipo];
    if (j.equipos.includes(idEquipo)) {
      if (!equipo.jugadoras.includes(idJugadora)) {
        equipo.jugadoras.push(idJugadora);
      }
    } else {
      equipo.jugadoras = equipo.jugadoras.filter(jid => jid !== idJugadora);
    }
  });

  FS.storage.guardarTodo();
  FS.jugadoras.renderLista();
};


/* ============================================================
   HOOK: se ejecuta cada vez que se entra a la vista
   ============================================================ */

FS.jugadoras.onEnter = function () {
  FS.jugadoras.renderLista();
};
