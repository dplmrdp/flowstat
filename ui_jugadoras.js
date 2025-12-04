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
  <strong>${j.alias}</strong> (${j.nombre})<br>
  Dorsal: ${j.dorsal || "—"}<br>
  Posición: ${j.posicion || "—"}<br>
  <small>Equipos: ${etiquetaEquipos || "—"}</small><br><br>

  <button onclick="FS.jugadoras.edit('${id}')">✏ Editar</button>
  <button onclick="FS.jugadoras.asignarEquipos('${id}')">👥 Equipos</button>
  <button onclick="FS.jugadoras.borrar('${id}')">🗑 Borrar</button>
`;


    cont.appendChild(div);
  });
};


/* ============================================================
   CREAR JUGADORA
   ============================================================ */

FS.jugadoras.create = function () {

  const form = `
    <h3>Nueva jugadora</h3>

    <label>Nombre completo</label>
    <input id="fj-nombre" type="text" />

    <label>Alias (máx 7 chars)</label>
    <input id="fj-alias" type="text" maxlength="7" />

    <label>Dorsal (opcional)</label>
    <input id="fj-dorsal" type="number" min="0" />

    <label>Posición</label>
    <select id="fj-pos">
      <option value="colocadora">Colocadora</option>
      <option value="opuesta">Opuesta</option>
      <option value="central">Central</option>
      <option value="líbero">Líbero</option>
      <option value="receptora">Receptora</option>
    </select>

    <br><br>
    <button onclick="FS.jugadoras.submitCreate()">Guardar</button>
    <button onclick="FS.modal.close()">Cancelar</button>
  `;

  FS.modal.open(form);
};

FS.jugadoras.submitCreate = function () {
  const nombre = document.getElementById("fj-nombre").value.trim();
  const alias  = document.getElementById("fj-alias").value.trim();
  const dorsal = document.getElementById("fj-dorsal").value.trim();
  const pos    = document.getElementById("fj-pos").value;

  if (!nombre || !alias) {
    alert("Nombre y alias son obligatorios.");
    return;
  }

  FS.state.crearJugadora(nombre, alias, dorsal, pos);
  FS.storage.guardarTodo();
  FS.modal.close();
  FS.jugadoras.renderLista();
};




/* ============================================================
   EDITAR JUGADORA
   ============================================================ */

FS.jugadoras.edit = function (id) {
  const j = FS.state.jugadoras[id];

  const form = `
    <h3>Editar jugadora</h3>

    <label>Nombre completo</label>
    <input id="fj-nombre" type="text" value="${j.nombre}" />

    <label>Alias (máx 7 chars)</label>
    <input id="fj-alias" type="text" maxlength="7" value="${j.alias}" />

    <label>Dorsal (opcional)</label>
    <input id="fj-dorsal" type="number" value="${j.dorsal}" />

    <label>Posición</label>
    <select id="fj-pos">
      <option ${j.posicion==="colocadora"?"selected":""} value="colocadora">Colocadora</option>
      <option ${j.posicion==="opuesta"?"selected":""} value="opuesta">Opuesta</option>
      <option ${j.posicion==="central"?"selected":""} value="central">Central</option>
      <option ${j.posicion==="líbero"?"selected":""} value="líbero">Líbero</option>
      <option ${j.posicion==="receptora"?"selected":""} value="receptora">Receptora</option>
    </select>

    <br><br>
    <button onclick="FS.jugadoras.submitEdit('${id}')">Guardar</button>
    <button onclick="FS.modal.close()">Cancelar</button>
  `;

  FS.modal.open(form);
};

FS.jugadoras.submitEdit = function (id) {
  const j = FS.state.jugadoras[id];

  j.nombre   = document.getElementById("fj-nombre").value.trim();
  j.alias    = document.getElementById("fj-alias").value.trim();
  j.dorsal   = document.getElementById("fj-dorsal").value.trim();
  j.posicion = document.getElementById("fj-pos").value;

  FS.storage.guardarTodo();
  FS.modal.close();
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
