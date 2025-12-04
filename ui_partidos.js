/* ============================================================
   ui_partidos.js — Gestión de Partidos (con campeonato y temporada)
   ============================================================ */

window.FS = window.FS || {};
FS.partidos = {};


/* ============================================================
   LISTA DE PARTIDOS
   ============================================================ */

FS.partidos.renderLista = function () {
  const cont = document.getElementById("lista-partidos");
  cont.innerHTML = "";

  const partidos = FS.state.partidos;
  const equipos = FS.state.equipos;

  const ids = Object.keys(partidos);

  if (ids.length === 0) {
    cont.innerHTML = "<p>No hay partidos creados.</p>";
    return;
  }

  ids.forEach(id => {
    const p = partidos[id];

    const eqPropio = equipos[p.equipoPropio]?.nombre || "(Equipo desconocido)";

    const div = document.createElement("div");
    div.className = "partido-item";
    div.style = `
      padding: 10px;
      background: white;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 0 4px rgba(0,0,0,0.1);
    `;

    div.innerHTML = `
      <strong>${eqPropio}</strong> vs <strong>${p.equipoRival}</strong><br>
      <small>Fecha: ${p.fecha}</small><br>
      <small>Temporada: ${p.temporada}</small><br>
      <small>Campeonato: ${p.campeonato}</small>
      <br><br>

      <button onclick="FS.partidos.entrarPartido('${id}')">▶ Entrar</button>
      <button onclick="FS.partidos.detalles('${id}')">👁 Ver sets</button>
      <button onclick="FS.partidos.borrar('${id}')">🗑 Borrar</button>
    `;

    cont.appendChild(div);
  });
};


/* ============================================================
   CREAR PARTIDO
   ============================================================ */

FS.partidos.create = function () {

  const equipos = FS.state.equipos;
  let opts = "";

  Object.values(equipos).forEach(eq => {
    opts += `<option value="${eq.id}">${eq.nombre} (${eq.temporada})</option>`;
  });

  const hoy = new Date().toISOString().slice(0,10);

  const form = `
    <h3>Nuevo partido</h3>

    <label>Equipo propio</label>
    <select id="fp-equipo">${opts}</select>

    <label>Equipo rival</label>
    <input id="fp-rival" type="text">

    <label>Fecha</label>
    <input id="fp-fecha" type="date" value="${hoy}">

    <label>Categoría</label>
    <select id="fp-cat">
      <option value=""></option>
      <option value="Benjamín">Benjamín</option>
      <option value="Alevín">Alevín</option>
      <option value="Infantil">Infantil</option>
      <option value="Cadete">Cadete</option>
      <option value="Juvenil">Juvenil</option>
      <option value="Senior">Senior</option>
    </select>

    <label>Temporada</label>
    <input id="fp-temp" type="text" placeholder="Ej: 25/26">

    <label>Campeonato</label>
    <input id="fp-camp" type="text" placeholder="Ej: Liga Municipal">

    <br>
    <button onclick="FS.partidos.submitCreate()">Guardar</button>
    <button onclick="FS.modal.close()">Cancelar</button>
  `;

  FS.modal.open(form);
};

FS.partidos.submitCreate = function () {
  const eq = document.getElementById("fp-equipo").value;
  const rival = document.getElementById("fp-rival").value.trim();
  const fecha = document.getElementById("fp-fecha").value;
  const categoria = document.getElementById("fp-cat").value;
  const temporada = document.getElementById("fp-temp").value.trim();
  const campeonato = document.getElementById("fp-camp").value.trim();

  if (!eq || !rival || !temporada) {
    alert("Equipo propio, rival y temporada son obligatorios.");
    return;
  }

  FS.state.crearPartido(eq, rival, fecha, categoria, temporada, campeonato);

  FS.storage.guardarTodo();
  FS.modal.close();
  FS.partidos.renderLista();
};


/* ============================================================
   ENTRAR AL PARTIDO (Set 1)
   ============================================================ */

FS.partidos.entrarPartido = function (idPartido) {
  FS.state.iniciarPartido(idPartido);

  const p = FS.state.partidos[idPartido];

  if (p.sets.length === 0) {
    FS.state.iniciarSet(1);
  }

  const eq = FS.state.equipos[p.equipoPropio];
  FS.sets.cargarJugadorasEquipo(eq);

  document.getElementById("titulo-set").textContent =
    `Set ${FS.state.setActivo} — ${eq.nombre}`;

  FS.router.go("set");
};


/* ============================================================
   DETALLES DE PARTIDO
   ============================================================ */

FS.partidos.detalles = function (idPartido) {
  const p = FS.state.partidos[idPartido];

  let msg = `Partido:\n${p.fecha}\n${p.campeonato}\n${p.temporada}\n\n`;
  msg += `${FS.state.equipos[p.equipoPropio]?.nombre} vs ${p.equipoRival}\n\n`;

  if (p.sets.length === 0) {
    alert(msg + "Sin sets registrados.");
    return;
  }

  p.sets.forEach(set => {
    msg += `Set ${set.numero}: ${set.acciones.length} acciones\n`;
  });

  alert(msg);
};


/* ============================================================
   BORRAR PARTIDO
   ============================================================ */

FS.partidos.borrar = function (idPartido) {
  if (!confirm("¿Eliminar este partido?")) return;

  delete FS.state.partidos[idPartido];

  FS.storage.guardarTodo();
  FS.partidos.renderLista();
};


/* ============================================================
   HOOK DE ENTRADA
   ============================================================ */

FS.partidos.onEnter = function () {
  FS.partidos.renderLista();
};
