/* ============================================================
   ui_partidos.js
   Gestión de partidos para FlowStat (SPA)
   ============================================================ */

window.FS = window.FS || {};
FS.partidos = {};


/* ============================================================
   RENDER DE LISTA DE PARTIDOS
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

    const equipoLocal = equipos[p.equipoPropio]?.nombre || "(Equipo desconocido)";
    const categoria = p.categoria || "—";

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
      <strong>${equipoLocal}</strong> vs <strong>${p.equipoRival}</strong><br>
      <small>${p.fecha} — ${categoria}</small>
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
    opts += `<option value="${eq.id}">${eq.nombre}</option>`;
  });

  const hoy = new Date().toISOString().slice(0,10);

  const form = `
    <h3>Nuevo partido</h3>

    <label>Equipo propio:</label>
    <select id="fp-equipo">${opts}</select>

    <label>Equipo rival:</label>
    <input id="fp-rival" type="text" />

    <label>Fecha:</label>
    <input id="fp-fecha" type="date" value="${hoy}" />

    <label>Categoría:</label>
    <select id="fp-cat">
      <option value=""></option>
      <option value="Benjamín">Benjamín</option>
      <option value="Alevín">Alevín</option>
      <option value="Infantil">Infantil</option>
      <option value="Cadete">Cadete</option>
      <option value="Juvenil">Juvenil</option>
      <option value="Senior">Senior</option>
    </select>

    <br><br>
    <button onclick="FS.partidos.submitCreate()">Guardar</button>
    <button onclick="FS.modal.close()">Cancelar</button>
  `;

  FS.modal.open(form);
};

FS.partidos.submitCreate = function () {
  const equipoPropio = document.getElementById("fp-equipo").value;
  const rival = document.getElementById("fp-rival").value;
  const fecha = document.getElementById("fp-fecha").value;
  const categoria = document.getElementById("fp-cat").value;

  FS.state.crearPartido(equipoPropio, rival, fecha, categoria);
  FS.storage.guardarTodo();
  FS.modal.close();
  FS.partidos.renderLista();
};



/* ============================================================
   ENTRAR EN PARTIDO (COMENZAR SET 1)
   ============================================================ */

FS.partidos.entrarPartido = function (idPartido) {
  FS.state.iniciarPartido(idPartido);

  // Iniciamos set 1 si no existe todavía
  const partido = FS.state.partidos[idPartido];

  if (partido.sets.length === 0) {
    FS.state.iniciarSet(1);
  }

  // Al entrar, cargamos jugadoras del equipo propio
  const equipo = FS.state.equipos[partido.equipoPropio];

  FS.sets.cargarJugadorasEquipo(equipo);

  // Mostrar set en vista SPA
  document.getElementById("titulo-set").textContent =
    `Set ${FS.state.setActivo} — ${equipo.nombre}`;

  FS.router.go("set");

  // Activar interfaz de toma de datos
  FS.sets.onEnter();
};


/* ============================================================
   MOSTRAR DETALLES DE PARTIDO (SETS)
   ============================================================ */

FS.partidos.detalles = function (idPartido) {
  const p = FS.state.partidos[idPartido];

  let msg = `Partido:\n${p.fecha}\n${p.categoria}\n\n`;
  msg += `${FS.state.equipos[p.equipoPropio]?.nombre} vs ${p.equipoRival}\n\n`;

  if (p.sets.length === 0) {
    msg += "No hay sets registrados.";
    alert(msg);
    return;
  }

  p.sets.forEach(set => {
    msg += `Set ${set.numero}: ${set.acciones.length} acciones registradas\n`;
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
   HOOK — SE EJECUTA AL ENTRAR A LA VISTA
   ============================================================ */

FS.partidos.onEnter = function () {
  FS.partidos.renderLista();
};
