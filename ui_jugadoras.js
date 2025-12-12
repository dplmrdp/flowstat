/* ============================================================
   ui_jugadoras.js — Gestión de jugadoras SOLO con Firestore
   ============================================================ */

window.FS = window.FS || {};
FS.jugadoras = {};


/* ============================================================
   RENDER LISTA
   ============================================================ */

FS.jugadoras.renderLista = function () {
  const cont = document.getElementById("lista-jugadoras");
  cont.innerHTML = "";

  const jugadoras = FS.state.jugadoras || {};
  const equipos = FS.state.equipos || {};

  const ids = Object.keys(jugadoras);
  if (ids.length === 0) {
    cont.innerHTML = "<p>No hay jugadoras registradas.</p>";
    return;
  }

  ids.forEach(id => {
    const j = jugadoras[id];
    if (!j) return;

    const etiquetaEquipos = (j.equipos || [])
      .map(eid => equipos[eid]?.nombre || "(?)")
      .join(", ");

    const div = document.createElement("div");
    div.className = "jugadora-item";

    div.innerHTML = `
      <strong>${escapeHtml(j.alias)}</strong> (${escapeHtml(j.nombre)})<br>
      Dorsal: ${escapeHtml(j.dorsal || "—")} — Posición: ${escapeHtml(j.posicion)}<br>
      <small>Equipos: ${escapeHtml(etiquetaEquipos || "—")}</small>
      <br><br>

      <button class="btn-edit" data-id="${id}">✏ Editar</button>
      <button class="btn-assign" data-id="${id}">👥 Equipos</button>
      <button class="btn-delete" data-id="${id}">🗑 Borrar</button>
    `;

    cont.appendChild(div);
  });

  cont.querySelectorAll(".btn-edit").forEach(b =>
    b.onclick = () => FS.jugadoras.edit(b.dataset.id)
  );

  cont.querySelectorAll(".btn-assign").forEach(b =>
    b.onclick = () => FS.jugadoras.asignarEquipos(b.dataset.id)
  );

  cont.querySelectorAll(".btn-delete").forEach(b =>
    b.onclick = () => FS.jugadoras.borrar(b.dataset.id)
  );
};


/* ============================================================
   CARGAR DESDE FIRESTORE
   ============================================================ */

FS.jugadoras.onEnter = async function () {
  const box = document.getElementById("firebase-status");
  if (box) box.textContent = "Obteniendo jugadoras…";

  try {
    const r = await FS.firebase.getJugadoras();

    if (r.ok) {
      const map = {};
      r.docs.forEach(d => {
        map[d.id] = { id: d.id, ...d.data };
      });

      FS.state.jugadoras = map;
      FS.jugadoras.renderLista();
    }

    if (box) box.textContent = "";
  } catch (e) {
    console.error("Error cargando jugadoras:", e);
    if (box) box.textContent = "Error al cargar jugadoras.";
  }
};


/* ============================================================
   CREAR JUGADORA
   ============================================================ */

FS.jugadoras.create = function () {
  const form = `
    <h3>Nueva jugadora</h3>

    <label>Nombre completo</label>
    <input id="fj-nombre" type="text">

    <label>Alias</label>
    <input id="fj-alias" type="text" maxlength="7">

    <label>Dorsal</label>
    <input id="fj-dorsal" type="number">

    <label>Posición</label>
    <select id="fj-pos">
      <option value="colocadora">Colocadora</option>
      <option value="opuesta">Opuesta</option>
      <option value="central">Central</option>
      <option value="líbero">Líbero</option>
      <option value="receptora">Receptora</option>
    </select>

    <br>
    <button id="fj-save">Guardar</button>
    <button id="fj-cancel">Cancelar</button>
  `;

  FS.modal.open(form);

  setTimeout(() => {
    document.getElementById("fj-save").onclick = FS.jugadoras.submitCreate;
    document.getElementById("fj-cancel").onclick = FS.modal.close;
  }, 20);
};


FS.jugadoras.submitCreate = async function () {
  const nombre = document.getElementById("fj-nombre").value.trim();
  const alias = document.getElementById("fj-alias").value.trim();
  const dorsal = document.getElementById("fj-dorsal").value;
  const pos = document.getElementById("fj-pos").value;

  if (!nombre || !alias) {
    alert("Nombre y alias obligatorios");
    return;
  }

  const id = "j_" + crypto.randomUUID();

  FS.state.jugadoras[id] = {
    id,
    nombre,
    alias: alias.slice(0, 7),
    dorsal,
    posicion: pos,
    equipos: []
  };

  const r = await FS.firebase.saveJugadora(id, FS.state.jugadoras[id]);
  if (!r.ok) alert("Error guardando en Firestore");

  FS.modal.close();
  FS.jugadoras.onEnter();
};


/* ============================================================
   EDITAR
   ============================================================ */

FS.jugadoras.edit = function (id) {
  const j = FS.state.jugadoras[id];

  const form = `
    <h3>Editar jugadora</h3>

    <label>Nombre completo</label>
    <input id="fj-nombre" type="text" value="${escapeAttr(j.nombre)}">

    <label>Alias</label>
    <input id="fj-alias" type="text" maxlength="7" value="${escapeAttr(j.alias)}">

    <label>Dorsal</label>
    <input id="fj-dorsal" type="number" value="${escapeAttr(j.dorsal)}">

    <label>Posición</label>
    <select id="fj-pos">
      <option ${j.posicion==="colocadora"?"selected":""} value="colocadora">Colocadora</option>
      <option ${j.posicion==="opuesta"?"selected":""} value="opuesta">Opuesta</option>
      <option ${j.posicion==="central"?"selected":""} value="central">Central</option>
      <option ${j.posicion==="líbero"?"selected":""} value="líbero">Líbero</option>
      <option ${j.posicion==="receptora"?"selected":""} value="receptora">Receptora</option>
    </select>

    <br>
    <button id="fj-save-edit">Guardar</button>
    <button id="fj-cancel-edit">Cancelar</button>
  `;

  FS.modal.open(form);

  setTimeout(() => {
    document.getElementById("fj-save-edit").onclick = () => FS.jugadoras.submitEdit(id);
    document.getElementById("fj-cancel-edit").onclick = FS.modal.close;
  }, 20);
};


FS.jugadoras.submitEdit = async function (id) {
  const j = FS.state.jugadoras[id];

  j.nombre = fj-nombre.value.trim();
  j.alias = fj-alias.value.trim().slice(0,7);
  j.dorsal = fj-dorsal.value;
  j.posicion = fj-pos.value;

  const r = await FS.firebase.saveJugadora(id, j);
  if (!r.ok) alert("Error guardando en Firestore");

  FS.modal.close();
  FS.jugadoras.onEnter();
};


/* ============================================================
   BORRAR JUGADORA DEFINITIVO
   ============================================================ */

FS.jugadoras.borrar = async function (id) {
  const j = FS.state.jugadoras[id];
  if (!confirm(`¿Eliminar a ${j.nombre}?`)) return;

  // Firestore
  const r = await FS.firebase.deleteJugadora(id);
  if (!r.ok) {
    alert("Error borrando en Firestore");
    return;
  }

  delete FS.state.jugadoras[id];

  // limpiar relaciones en equipos
  Object.values(FS.state.equipos).forEach(eq => {
    eq.jugadoras = eq.jugadoras.filter(jid => jid !== id);
  });

  FS.jugadoras.onEnter();
};


/* ============================================================
   ASIGNAR EQUIPOS
   ============================================================ */

FS.jugadoras.asignarEquipos = function (id) {
  const j = FS.state.jugadoras[id];
  const eqs = FS.state.equipos;

  const ids = Object.keys(eqs);
  if (ids.length === 0) {
    alert("No hay equipos registrados.");
    return;
  }

  let opt = "";
  ids.forEach(eid => {
    const eq = eqs[eid];
    const checked = (j.equipos || []).includes(eid) ? "checked" : "";

    opt += `
      <label class="jug-opt">
        <input type="checkbox" class="chk-eq" value="${eid}" ${checked}>
        <span class="nombre-equipo">${escapeHtml(eq.nombre)}</span>
        <span class="temp-equipo">(${escapeHtml(eq.temporada)})</span>
      </label>
    `;
  });

  const form = `
    <h3>Asignar equipos a ${escapeHtml(j.alias)}</h3>
    ${opt}
    <br>
    <button id="fj-assign-save">Guardar</button>
    <button id="fj-assign-cancel">Cancelar</button>
  `;

  FS.modal.open(form);

  setTimeout(() => {
    document.getElementById("fj-assign-save").onclick =
      () => FS.jugadoras.submitAsignarEquipos(id);
    document.getElementById("fj-assign-cancel").onclick = FS.modal.close;
  }, 20);
};


FS.jugadoras.submitAsignarEquipos = async function (id) {
  const j = FS.state.jugadoras[id];

  j.equipos = [];
  document.querySelectorAll(".chk-eq").forEach(c => {
    if (c.checked) j.equipos.push(c.value);
  });

  const r = await FS.firebase.saveJugadora(id, j);
  if (!r.ok) alert("Error guardando equipos en Firestore");

  FS.modal.close();
  FS.jugadoras.onEnter();
};


/* ============================================================
   UTILS
   ============================================================ */

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(s) {
  return escapeHtml(s);
}
