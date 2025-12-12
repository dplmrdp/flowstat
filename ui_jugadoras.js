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
      <strong>${escapeHtml(j.alias || "")}</strong> (${escapeHtml(j.nombre || "")})<br>
      Dorsal: ${escapeHtml(j.dorsal || "—")} — Posición: ${escapeHtml(j.posicion || "—")}<br>
      <small>Equipos: ${escapeHtml(etiquetaEquipos || "—")}</small><br><br>

      <button class="btn-edit" data-id="${id}">✏ Editar</button>
      <button class="btn-assign" data-id="${id}">👥 Equipos</button>
      <button class="btn-delete" data-id="${id}">🗑 Borrar</button>
    `;

    cont.appendChild(div);
  });

  // Delegación de eventos
  cont.querySelectorAll(".btn-edit").forEach(btn =>
    btn.onclick = () => FS.jugadoras.edit(btn.dataset.id)
  );

  cont.querySelectorAll(".btn-assign").forEach(btn =>
    btn.onclick = () => FS.jugadoras.asignarEquipos(btn.dataset.id)
  );

  cont.querySelectorAll(".btn-delete").forEach(btn =>
    btn.onclick = () => FS.jugadoras.borrar(btn.dataset.id)
  );
};


/* ============================================================
   CARGA DESDE FIRESTORE
   ============================================================ */

FS.jugadoras.onEnter = async function () {
  const box = document.getElementById("firebase-status");
  if (box) box.textContent = "Obteniendo jugadoras…";

  if (!FS.firebase || !FS.firebase.enabled) {
    if (box) box.textContent = "Firestore no disponible.";
    return;
  }

  try {
    const r = await FS.firebase.getJugadoras();

    if (r.ok) {
      const map = {};
      r.docs.forEach(d => {
        map[d.id] = { id: d.id, ...d.data };
      });

      FS.state.jugadoras = map;
      FS.jugadoras.renderLista();

      if (box) box.textContent = "";
    }
  } catch (err) {
    console.error("Error cargando jugadoras:", err);
    if (box) box.textContent = "Error cargando jugadoras.";
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

    <label>Alias (máx 7 chars)</label>
    <input id="fj-alias" type="text" maxlength="7">

    <label>Dorsal (opcional)</label>
    <input id="fj-dorsal" type="number" min="0">

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
  const alias = document.getElementById("fj-alias").value.trim().slice(0, 7);
  const dorsal = document.getElementById("fj-dorsal").value || "";
  const pos = document.getElementById("fj-pos").value;

  if (!nombre || !alias) {
    alert("Nombre y alias son obligatorios.");
    return;
  }

  const id = "j_" + crypto.randomUUID();

  FS.state.jugadoras[id] = {
    id,
    nombre,
    alias,
    dorsal,
    posicion: pos,
    equipos: []
  };

  const r = await FS.firebase.saveJugadora(id, FS.state.jugadoras[id]);
  if (!r.ok) alert("Error subiendo a Firestore");

  FS.modal.close();
  FS.jugadoras.onEnter(); // recargar desde Firestore
};


/* ============================================================
   EDITAR JUGADORA
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

  j.nombre = document.getElementById("fj-nombre").value.trim();
  j.alias = document.getElementById("fj-alias").value.trim().slice(0, 7);
  j.dorsal = document.getElementById("fj-dorsal").value.trim();
  j.posicion = document.getElementById("fj-pos").value;

  const r = await FS.firebase.saveJugadora(id, j);
  if (!r.ok) alert("Error subiendo a Firestore");

  FS.modal.close();
  FS.jugadoras.onEnter();
};


/* ============================================================
   BORRAR JUGADORA
   ============================================================ */

FS.jugadoras.borrar = async function (id) {
  const j = FS.state.jugadoras[id];
  if (!confirm(`¿Eliminar a ${j.nombre}?`)) return;

  // Eliminar referencias desde equipos
  Object.values(FS.state.equipos).forEach(eq => {
    eq.jugadoras = eq.jugadoras.filter(jid => jid !== id);
  });

  delete FS.state.jugadoras[id];

  // No borramos en Firestore por seguridad
  FS.jugadoras.onEnter();
};


/* ============================================================
   ASIGNAR EQUIPOS
   ============================================================ */

FS.jugadoras.asignarEquipos = function (id) {
  const j = FS.state.jugadoras[id];
  const equipos = FS.state.equipos || {};

  const ids = Object.keys(equipos);
  if (ids.length === 0) {
    alert("No hay equipos registrados.");
    return;
  }

  let opt = "";
  ids.forEach(eid => {
    const eq = equipos[eid];
    const checked = (j.equipos || []).includes(eid) ? "checked" : "";
    opt += `
      <label class="jug-opt">
        <span>${escapeHtml(eq.nombre)} (${escapeHtml(eq.temporada)})</span>
        <input type="checkbox" class="chk-eq" value="${eid}" ${checked}>
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
  const checks = document.querySelectorAll(".chk-eq");
  const j = FS.state.jugadoras[id];

  j.equipos = [];

  checks.forEach(c => {
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

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(str) {
  return escapeHtml(str);
}
