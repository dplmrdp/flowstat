/* ============================================================
   ui_partidos.js — PASO 1 (base, sin live)
   ============================================================ */

window.FS = window.FS || {};
FS.partidos = {};


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
   RENDER PRINCIPAL
   ============================================================ */

FS.partidos.render = function () {
  const cont = document.getElementById("lista-partidos");
  if (!cont) return;

  cont.innerHTML = `
    <h3>Partidos con estadísticas</h3>
    <div id="lista-partidos-stats" class="list"></div>

    <h3 class="mt-2">Partidos preparados</h3>
    <div id="lista-partidos-preparados" class="list"></div>
  `;

  const partidos = Object.values(FS.state.partidos || {});

  const conStats = partidos.filter(p => p.hasStats);
  const preparados = partidos.filter(p => !p.hasStats);

  const contStats = document.getElementById("lista-partidos-stats");
  const contPrep = document.getElementById("lista-partidos-preparados");

  /* ===========================
     PARTIDOS CON ESTADÍSTICAS
     =========================== */
  if (conStats.length === 0) {
    contStats.innerHTML = `<p class="helper">No hay partidos con estadísticas.</p>`;
  } else {
    conStats.forEach(p => {
      const div = document.createElement("div");
      div.className = "partido-item";

      div.innerHTML = `
  <strong>${p.equipoNombre}</strong> · vs ${p.rival}<br>
  <small>${p.categoria} · ${p.temporada} · ${p.fechaTexto}</small>

  <div class="item-actions">
    <button class="btn-ghost" data-edit="${p.id}">✏️ Editar</button>
    <button class="btn-ghost" data-stats="${p.id}">📊 Estadísticas</button>
    <button class="btn-ghost" data-del="${p.id}">🗑️</button>
  </div>
`;


      contStats.appendChild(div);
    });
  }

  /* ===========================
     PARTIDOS PREPARADOS
     =========================== */
  if (preparados.length === 0) {
    contPrep.innerHTML = `<p class="helper">No hay partidos preparados.</p>`;
  } else {
    preparados.forEach(p => {
      const div = document.createElement("div");
      div.className = "partido-item";

      div.innerHTML = `
  <strong>${p.equipoNombre}</strong> · vs ${p.rival}<br>
  <small>${p.categoria} · ${p.temporada} · ${p.fechaTexto}</small>

  <div class="item-actions">
    <button class="btn-ghost" data-edit="${p.id}">✏️ Editar</button>
    <button class="btn-ghost" data-live="${p.id}">▶️ Registrar</button>
    <button class="btn-ghost" data-del="${p.id}">🗑️</button>
  </div>
`;


      contPrep.appendChild(div);
    });
  }

   FS.partidos.edit = function (id) {
  const p = FS.state.partidos[id];
  if (!p) return;

  FS.partidos.editingId = id;

  const equipos = FS.state.equipos || {};
  const idsEquipos = Object.keys(equipos);

  let opts = "";
  idsEquipos.forEach(eid => {
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
        .map(c => `<option ${c===p.categoria?"selected":""}>${c}</option>`)
        .join("")}
    </select>

    <label>Temporada</label>
    <input id="fp-temp" type="text" value="${p.temporada}">

    <label>Fecha</label>
    <input id="fp-fecha" type="date" value="${p.fechaISO}">

    <br>
    <button id="fp-save" class="btn">Guardar cambios</button>
    <button id="fp-cancel" class="btn-secondary">Cancelar</button>
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

/* ===========================
   ACCIONES
   =========================== */

cont.querySelectorAll("[data-del]").forEach(b => {
  b.onclick = () => FS.partidos.borrar(b.dataset.del);
});

cont.querySelectorAll("[data-edit]").forEach(b => {
  b.onclick = () => FS.partidos.edit(b.dataset.edit);
});

b.onclick = () => {
  FS.partidoSets.currentPartidoId = b.dataset.live;
  FS.router.go("partidoSets");
};


cont.querySelectorAll("[data-stats]").forEach(b => {
  b.onclick = () => {
    alert("Visualización de estadísticas (más adelante)");
  };
});
  
};



/* ============================================================
   CREAR PARTIDO (MODAL)
   ============================================================ */

FS.partidos.create = function () {
  const equipos = FS.state.equipos || {};

  let opts = "";
  Object.values(equipos).forEach(e => {
    opts += `<option value="${e.id}">${e.nombre}</option>`;
  });

  const hoy = new Date().toISOString().slice(0,10);

const form = `
  <h3>Nuevo partido</h3>

  <label>Equipo</label>
  <select id="fp-equipo">${opts}</select>

  <label>Rival</label>
  <input id="fp-rival" type="text">

  <label>Categoría</label>
  <select id="fp-cat">
    <option>Benjamín</option>
    <option>Alevín</option>
    <option>Infantil</option>
    <option>Cadete</option>
    <option>Juvenil</option>
    <option>Senior</option>
  </select>

  <label>Temporada</label>
  <input id="fp-temp" type="text" placeholder="25/26">

  <label>Fecha</label>
  <input id="fp-fecha" type="date" value="${hoy}">

  <br>
  <button id="fp-save" class="btn">Guardar</button>
  <button id="fp-cancel" class="btn-secondary">Cancelar</button>
`;


  FS.modal.open(form);

  setTimeout(() => {
    document.getElementById("fp-save").onclick = FS.partidos.submitCreate;
    document.getElementById("fp-cancel").onclick = FS.modal.close;
  }, 20);
};


FS.partidos.submitCreate = async function () {
  const equipoId = document.getElementById("fp-equipo").value;
  const rival = document.getElementById("fp-rival").value.trim();
  const categoria = document.getElementById("fp-cat").value.trim();
  const temporada = document.getElementById("fp-temp").value.trim();
  const fechaISO = document.getElementById("fp-fecha").value;

  if (!equipoId || !rival || !temporada || !fechaISO) {
    alert("Faltan datos obligatorios");
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
    locked: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const r = await FS.firebase.savePartido(id, data);
  if (!r.ok) {
    alert("Error guardando partido");
    return;
  }

  await FS.firebase.savePartido(id, data);

FS.partidos.editingId = null;
FS.modal.close();
FS.partidos.onEnter();

};


/* ============================================================
   BORRAR PARTIDO
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
