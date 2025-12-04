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

  const form = `
    <h3>Nuevo equipo</h3>

    <label>Nombre del equipo</label>
    <input id="fe-nombre" type="text" />

    <label>Categoría</label>
    <select id="fe-cat">
      <option value="Benjamín">Benjamín</option>
      <option value="Alevín">Alevín</option>
      <option value="Infantil">Infantil</option>
      <option value="Cadete">Cadete</option>
      <option value="Juvenil">Juvenil</option>
      <option value="Senior">Senior</option>
    </select>

    <br><br>
    <button onclick="FS.equipos.submitCreate()">Guardar</button>
    <button onclick="FS.modal.close()">Cancelar</button>
  `;

  FS.modal.open(form);
};

FS.equipos.submitCreate = function () {
  const nombre = document.getElementById("fe-nombre").value;
  const categoria = document.getElementById("fe-cat").value;

  const id = FS.state.crearEquipo(nombre, categoria);

  FS.storage.guardarTodo();
  FS.modal.close();
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
  const jug = FS.state.jugadoras;

  let opciones = "";

  Object.values(jug).forEach(j => {
    const checked = eq.jugadoras.includes(j.id) ? "checked" : "";
    opciones += `
  <label class="jug-opt">
    <span>${j.alias} (#${j.dorsal||"–"})</span>
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
}

FS.equipos.submitAsignarJugadoras = function (idEquipo) {
  const checks = document.querySelectorAll(".chk-jug");
  const eq = FS.state.equipos[idEquipo];

  eq.jugadoras = [];

  checks.forEach(c => {
    if (c.checked) {
      eq.jugadoras.push(c.value);

      // actualizar jugadora → equipos
      const j = FS.state.jugadoras[c.value];
      if (!j.equipos.includes(idEquipo)) j.equipos.push(idEquipo);
    }
  });

  FS.storage.guardarTodo();
  FS.modal.close();
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
