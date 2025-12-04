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

  /* -------------------------------
     Selección de equipo propio
     ------------------------------- */
  const equipos = FS.state.equipos;
  const ids = Object.keys(equipos);

  if (ids.length === 0) {
    alert("Debes crear primero un equipo.");
    return;
  }

  let mensaje = "Selecciona el equipo propio:\n\n";
  ids.forEach((eid, i) => {
    mensaje += `${i+1}. ${equipos[eid].nombre}\n`;
  });

  const seleccion = prompt(mensaje);
  if (!seleccion) return;

  const idx = parseInt(seleccion) - 1;
  const equipoPropio = ids[idx];

  if (!equipoPropio) {
    alert("Selección no válida.");
    return;
  }

  /* -------------------------------
     Nombre del equipo rival
     ------------------------------- */
  const equipoRival = prompt("Nombre del equipo rival:");
  if (!equipoRival) return;

  /* -------------------------------
     Fecha del partido
     ------------------------------- */
  const hoy = new Date().toISOString().slice(0, 10);
  const fecha = prompt("Fecha del partido (YYYY-MM-DD):", hoy) || hoy;

  /* -------------------------------
     Categoría (opcional)
     ------------------------------- */
  const categoria = prompt("Categoría (opcional):", "");

  /* -------------------------------
     Crear partido en el estado
     ------------------------------- */
  const pid = FS.state.crearPartido(equipoPropio, equipoRival, fecha, categoria);

  FS.storage.guardarTodo();
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
