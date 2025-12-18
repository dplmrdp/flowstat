/* ============================================================
   ui_partidos.js
   ============================================================ */

window.FS = window.FS || {};
FS.partidos = {};
FS.partidos.editingId = null;

/* ============================================================
   ENTRADA A LA VISTA
   ============================================================ */

FS.partidos.onEnter = async function () {
  const box = document.getElementById("firebase-status");
  if (box) box.textContent = "Cargando partidos…";

  try {
    const r = await FS.firebase.getPartidos();
    if (r.ok) {
      const map = {};
      r.docs.forEach(d => {
        map[d.id] = { id: d.id, ...d.data };
      });
      FS.state.partidos = map;
      FS.partidos.render();
    }
    if (box) box.textContent = "";
  } catch (e) {
    console.error(e);
    if (box) box.textContent = "Error cargando partidos";
  }
};

/* ============================================================
   RENDER
   ============================================================ */

FS.partidos.render = function () {
  const cont = document.getElementById("lista-partidos");
  if (!cont) return;

  cont.innerHTML = `
    <h3>Partidos con estadísticas</h3>
    <div id="lista-partidos-stats"></div>

    <h3 class="mt-2">Partidos preparados</h3>
    <div id="lista-partidos-preparados"></div>
  `;

  const partidos = Object.values(FS.state.partidos || {});
  const conStats = partidos.filter(p => p.hasStats);
  const preparados = partidos.filter(p => !p.hasStats);

  const contStats = document.getElementById("lista-partidos-stats");
  const contPrep = document.getElementById("lista-partidos-preparados");

  // --- CON STATS ---
  if (conStats.length === 0) {
    contStats.innerHTML = "<p class='helper'>No hay partidos con estadísticas.</p>";
  } else {
    conStats.forEach(p => {
      const div = document.createElement("div");
      div.className = "partido-item";
      div.innerHTML = `
        <strong>${p.equipoNombre}</strong> · vs ${p.rival}<br>
        <small>${p.categoria} · ${p.temporada} · ${p.fechaTexto}</small>
      `;
      contStats.appendChild(div);
    });
  }

  // --- PREPARADOS ---
  if (preparados.length === 0) {
    contPrep.innerHTML = "<p class='helper'>No hay partidos preparados.</p>";
  } else {
    preparados.forEach(p => {
      const div = document.createElement("div");
      div.className = "partido-item";
      div.innerHTML = `
        <strong>${p.equipoNombre}</strong> · vs ${p.rival}<br>
        <small>${p.categoria} · ${p.temporada} · ${p.fechaTexto}</small>

        <div class="item-actions">
          <button data-edit="${p.id}">✏️ Editar</button>
          <button data-live="${p.id}">▶ Registrar</button>
          <button data-del="${p.id}">🗑️</button>
        </div>
      `;
      contPrep.appendChild(div);
    });
  }

  // --- ACCIONES ---
  cont.querySelectorAll("[data-del]").forEach(b => {
    b.onclick = () => FS.partidos.borrar(b.dataset.del);
  });

  cont.querySelectorAll("[data-edit]").forEach(b => {
    b.onclick = () => FS.partidos.edit(b.dataset.edit);
  });

  cont.querySelectorAll("[data-live]").forEach(b => {
    b.onclick = () => {
      FS.partidoSets.currentPartidoId = b.dataset.live;
      FS.router.go("partidoSets");
    };
  });
};

/* ============================================================
   EDITAR PARTIDO
   ============================================================ */

FS.partidos.edit = function (id) {
  const p = FS.state.partidos[id];
  if (!p) return;

  FS.partidos.editingId = id;

  const equipos = FS.state.equipos || {};
  let opts = "";
  Object.keys(equipos).forEach(eid => {
    const e = equipos[eid];
    const sel = eid === p.equipoId ? "selected" : "";
    opts += `<option value="${eid}" ${sel}>${e.nombre}</option>`;
  });

  const form = `
    <h3>Editar partido</h3>

    <label>Equipo</label>
    <select id="fp-equipo">${opts}</select>

    <label>Rival</label>
    <input id="fp-rival" type="text" value="${p.rival}">

    <label>Categoría</label>
    <select id="fp-cat">
      ${["Benjamín","Alevín","Infantil","Cadete","Juvenil","Senior"]
        .map(c => `<option ${c===p.categoria?"selected":""}>${c}</option>`).join("")}
    </select>

    <label>Temporada</label>
    <input id="fp-temp" type="text" value="${p.temporada}">

    <label>Fecha</label>
    <input id="fp-fecha" type="date" value="${p.fechaISO}">

    <br>
    <button id="fp-save">Guardar</button>
    <button id="fp-cancel">Cancelar</button>
  `;

  FS.modal.open(form);

  setTimeout(() => {
    document.getElementById("fp-save").onclick = FS.partidos.submitCreate;
    document.getElementById("fp-cancel").onclick = () => {
      FS.partidos.editingId = null;
      FS.modal.close();
    };
  }, 0);
};

/* ============================================================
   CREAR / GUARDAR
   ============================================================ */

FS.partidos.submitCreate = async function () {
  const equipoId = document.getElementById("fp-equipo").value;
  const rival = document.getElementById("fp-rival").value.trim();
  const categoria = document.getElementById("fp-cat").value;
  const temporada = document.getElementById("fp-temp").value.trim();
  const fechaISO = document.getElementById("fp-fecha").value;

  if (!equipoId || !rival || !temporada || !fechaISO) {
    alert("Faltan datos");
    return;
  }

  const equipo = FS.state.equipos[equipoId];
  const fechaTexto = new Date(fechaISO).toLocaleDateString("es-ES");

  const id = FS.partidos.editingId || ("p_" + crypto.randomUUID());

  const data = {
    id,
    equipoId,
    equipoNombre: equipo.nombre,
    rival,
    categoria,
    temporada,
    fechaISO,
    fechaTexto,
    hasStats: false,
    locked: false
  };

  await FS.firebase.savePartido(id, data);

  FS.partidos.editingId = null;
  FS.modal.close();
  FS.partidos.onEnter();
};

/* ============================================================
   BORRAR
   ============================================================ */

FS.partidos.borrar = async function (id) {
  if (!confirm("¿Eliminar este partido?")) return;

  const r = await FS.firebase.deletePartido(id);
  if (!r.ok) {
    alert("Error borrando partido");
    return;
  }

  delete FS.state.partidos[id];
  FS.partidos.render();
};
