/* ============================================================
   ui_equipos.js — Gestión de Equipos (con temporada)
   ============================================================ */

window.FS = window.FS || {};
FS.equipos = {};


/* ============================================================
   LISTA DE EQUIPOS
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
      <strong>${eq.nombre}</strong><br>
      <small>Categoría: ${eq.categoria}</small><br>
      <small>Temporada: ${eq.temporada}</small>
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

  const form = `
    <h3>Nuevo equipo</h3>

    <label>Nombre del equipo</label>
    <input id="fe-nombre" type="text">

    <label>Categoría</label>
    <select id="fe-cat">
      <option value="Benjamín">Benjamín</option>
      <option value="Alevín">Alevín</option>
      <option value="Infantil">Infantil</option>
      <option value="Cadete">Cadete</option>
      <option value="Juvenil">Juvenil</option>
      <option value="Senior">Senior</option>
    </select>

    <label>Temporada</label>
    <input id="fe-temp" type="text" placeholder="Ej: 25/26">

    <br>
    <button onclick="FS.equipos.submitCreate()">Guardar</button>
    <button onclick="FS.modal.close()">Cancelar</button>
  `;

  FS.modal.open(form);
};

FS.equipos.submitCreate = function () {
  const nombre = document.getElementById("fe-nombre").value.trim();
  const categoria = document.getElementById("fe-cat").value;
  const temporada = document.getElementById("fe-temp").value.trim();

  if (!nombre || !temporada) {
    alert("Nombre y temporada son obligatorios.");
    return;
  }

  FS.state.crearEquipo(nombre, categoria, temporada);

  FS.storage.guardarTodo();
  FS.modal.close();
  FS.equipos.renderLista();
};


/* ============================================================
   EDITAR EQUIPO
   ============================================================ */

FS.equipos.editar = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];

  const form = `
    <h3>Editar equipo</h3>

    <label>Nombre</label>
    <input id="fe-nombre" type="text" value="${eq.nombre}">

    <label>Categoría</label>
    <select id="fe-cat">
      <option ${eq.categoria==="Benjamín"?"selected":""} value="Benjamín">Benjamín</option>
      <option ${eq.categoria==="Alevín"?"selected":""} value="Alevín">Alevín</option>
      <option ${eq.categoria==="Infantil"?"selected":""} value="Infantil">Infantil</option>
      <option ${eq.categoria==="Cadete"?"selected":""} value="Cadete">Cadete</option>
      <option ${eq.categoria==="Juvenil"?"selected":""} value="Juvenil">Juvenil</option>
      <option ${eq.categoria==="Senior"?"selected":""} value="Senior">Senior</option>
    </select>

    <label>Temporada</label>
    <input id="fe-temp" type="text" value="${eq.temporada}">

    <br>
    <button onclick="FS.equipos.submitEdit('${idEquipo}')">Guardar</button>
    <button onclick="FS.modal.close()">Cancelar</button>
  `;

  FS.modal.open(form);
};

FS.equipos.submitEdit = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];

  eq.nombre = document.getElementById("fe-nombre").value.trim();
  eq.categoria = document.getElementById("fe-cat").value;
  eq.temporada = document.getElementById("fe-temp").value.trim();

  FS.storage.guardarTodo();
  FS.modal.close();
  FS.equipos.renderLista();
};


/* ============================================================
   GESTIÓN DE JUGADORAS DEL EQUIPO
   ============================================================ */

FS.equipos.verJugadoras = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];
  const jug = FS.state.jugadoras;

  let msg = `Jugadoras de ${eq.nombre}:\n\n`;

  if (eq.jugadoras.length === 0) {
    alert(msg + "(ninguna jugadora)");
    return;
  }

  eq.jugadoras.forEach(jid => {
    const j = jug[jid];
    msg += `${j.alias} (#${j.dorsal || "-"})\n`;
  });

  alert(msg);
};


FS.equipos.editarJugadoras = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];
  const jug = FS.state.jugadoras;

  let opciones = "";

  Object.values(jug).forEach(j => {
    const checked = eq.jugadoras.includes(j.id) ? "checked" : "";
    opciones += `
      <label class="jug-opt">
        <span>${j.alias} (#${j.dorsal || "-"})</span>
        <input type="checkbox" class="chk-jug" value="${j.id}" ${checked}>
      </label>
    `;
  });

  const form = `
    <h3>Jugadoras de ${eq.nombre}</h3>

    ${opciones}

    <br>
    <button onclick="FS.equipos.submitAsignarJugadoras('${idEquipo}')">Guardar</button>
    <button onclick="FS.modal.close()">Cancelar</button>
  `;

  FS.modal.open(form);
};

FS.equipos.submitAsignarJugadoras = function (idEquipo) {
  const checks = document.querySelectorAll(".chk-jug");
  const eq = FS.state.equipos[idEquipo];

  eq.jugadoras = [];

  checks.forEach(c => {
    if (c.checked) {
      eq.jugadoras.push(c.value);

      const j = FS.state.jugadoras[c.value];
      if (!j.equipos.includes(idEquipo))
        j.equipos.push(idEquipo);
    }
  });

  FS.storage.guardarTodo();
  FS.modal.close();
  FS.equipos.renderLista();
};


/* ============================================================
   BORRAR
   ============================================================ */

FS.equipos.borrar = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];
  if (!confirm(`¿Eliminar el equipo ${eq.nombre}?`)) return;

  // eliminar asociación en jugadoras
  Object.values(FS.state.jugadoras).forEach(j => {
    j.equipos = j.equipos.filter(eid => eid !== idEquipo);
  });

  delete FS.state.equipos[idEquipo];

  FS.storage.guardarTodo();
  FS.equipos.renderLista();
};


/* ============================================================
   HOOK DE ENTRADA
   ============================================================ */

FS.equipos.onEnter = function () {
  FS.equipos.renderLista();
};
