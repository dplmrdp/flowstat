/* ============================================================
   ui_equipos.js — Gestión de equipos usando SOLO Firestore
   ============================================================ */

window.FS = window.FS || {};
FS.equipos = {};


/* ============================================================
   RENDER LISTA
   ============================================================ */

FS.equipos.renderLista = function () {
  const cont = document.getElementById("lista-equipos");
  cont.innerHTML = "";

  const equipos = FS.state.equipos || {};
  const ids = Object.keys(equipos);

  if (ids.length === 0) {
    cont.innerHTML = "<p>No hay equipos registrados.</p>";
    return;
  }

  ids.forEach(id => {
    const eq = equipos[id];

    const div = document.createElement("div");
    div.className = "equipo-item";

    div.innerHTML = `
      <strong>${escapeHtml(eq.nombre)}</strong><br>
      <small>Categoría: ${escapeHtml(eq.categoria)}</small><br>
      <small>Temporada: ${escapeHtml(eq.temporada)}</small>
      <br><br>

      <button class="btn-ver" data-id="${id}">👁 Ver jugadoras</button>
      <button class="btn-edit" data-id="${id}">✏ Editar</button>
      <button class="btn-gestionar" data-id="${id}">👥 Gestionar jugadoras</button>
      <button class="btn-delete" data-id="${id}">🗑 Borrar</button>
    `;

    cont.appendChild(div);
  });

  cont.querySelectorAll(".btn-ver").forEach(b =>
    b.onclick = () => FS.equipos.verJugadoras(b.dataset.id)
  );
  cont.querySelectorAll(".btn-edit").forEach(b =>
    b.onclick = () => FS.equipos.editar(b.dataset.id)
  );
  cont.querySelectorAll(".btn-gestionar").forEach(b =>
    b.onclick = () => FS.equipos.editarJugadoras(b.dataset.id)
  );
  cont.querySelectorAll(".btn-delete").forEach(b =>
    b.onclick = () => FS.equipos.borrar(b.dataset.id)
  );
};


/* ============================================================
   CARGA DESDE FIRESTORE
   ============================================================ */

FS.equipos.onEnter = async function () {
  const box = document.getElementById("firebase-status");
  if (box) box.textContent = "Obteniendo equipos…";

  if (!FS.firebase || !FS.firebase.enabled) {
    if (box) box.textContent = "Firestore no disponible.";
    return;
  }

  try {
    const r = await FS.firebase.getEquipos();

    if (r.ok) {
      const map = {};
      r.docs.forEach(d => {
        map[d.id] = { id: d.id, ...d.data };
      });

      FS.state.equipos = map;
      FS.equipos.renderLista();

      if (box) box.textContent = "";
    }
  } catch (err) {
    console.error("Error cargando equipos:", err);
    if (box) box.textContent = "Error cargando equipos.";
  }
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
    <button id="fe-save">Guardar</button>
    <button id="fe-cancel">Cancelar</button>
  `;

  FS.modal.open(form);

  setTimeout(() => {
    fe-save.onclick = FS.equipos.submitCreate;
    fe-cancel.onclick = FS.modal.close;
  }, 20);
};


FS.equipos.submitCreate = async function () {
  const nombre = document.getElementById("fe-nombre").value.trim();
  const categoria = document.getElementById("fe-cat").value;
  const temporada = document.getElementById("fe-temp").value.trim();

  if (!nombre || !temporada) {
    alert("Nombre y temporada son obligatorios.");
    return;
  }

  const id = "t_" + crypto.randomUUID();

  FS.state.equipos[id] = {
    id,
    nombre,
    categoria,
    temporada,
    jugadoras: []
  };

  // subir a Firestore
  const r = await FS.firebase.saveEquipo(id, FS.state.equipos[id]);
  if (!r.ok) {
    alert("Error subiendo a Firestore.");
  }

  FS.modal.close();
  FS.equipos.renderLista();
};


/* ============================================================
   EDITAR
   ============================================================ */

FS.equipos.editar = function (id) {
  const eq = FS.state.equipos[id];

  const form = `
    <h3>Editar equipo</h3>

    <label>Nombre</label>
    <input id="fe-nombre" type="text" value="${escapeAttr(eq.nombre)}">

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
    <input id="fe-temp" type="text" value="${escapeAttr(eq.temporada)}">

    <br>
    <button id="fe-save-edit">Guardar</button>
    <button id="fe-cancel-edit">Cancelar</button>
  `;

  FS.modal.open(form);

  setTimeout(() => {
    fe-save-edit.onclick = () => FS.equipos.submitEdit(id);
    fe-cancel-edit.onclick = FS.modal.close;
  }, 20);
};


FS.equipos.submitEdit = async function (id) {
  const eq = FS.state.equipos[id];

  eq.nombre = fe-nombre.value.trim();
  eq.categoria = fe-cat.value;
  eq.temporada = fe-temp.value.trim();

  const r = await FS.firebase.saveEquipo(id, eq);
  if (!r.ok) alert("Error guardando en Firestore");

  FS.modal.close();
  FS.equipos.renderLista();
};


/* ============================================================
   GESTIONAR JUGADORAS
   ============================================================ */

FS.equipos.editarJugadoras = function (id) {
  const eq = FS.state.equipos[id];
  const jug = FS.state.jugadoras;

  let opciones = "";
  Object.values(jug).forEach(j => {
    const checked = eq.jugadoras.includes(j.id) ? "checked" : "";
    opciones += `
      <label class="jug-opt">
        <span>${escapeHtml(j.alias)} (#${escapeHtml(j.dorsal||"-")})</span>
        <input type="checkbox" class="chk-jug" value="${j.id}" ${checked}>
      </label>
    `;
  });

  const form = `
    <h3>Jugadoras de ${escapeHtml(eq.nombre)}</h3>
    ${opciones}
    <br>
    <button id="fe-save-j">Guardar</button>
    <button id="fe-cancel-j">Cancelar</button>
  `;

  FS.modal.open(form);

  setTimeout(() => {
    fe-save-j.onclick = () => FS.equipos.submitAsignarJugadoras(id);
    fe-cancel-j.onclick = FS.modal.close;
  }, 20);
};


FS.equipos.submitAsignarJugadoras = async function (id) {
  const eq = FS.state.equipos[id];

  eq.jugadoras = [];
  document.querySelectorAll(".chk-jug").forEach(c => {
    if (c.checked) eq.jugadoras.push(c.value);
  });

  const r = await FS.firebase.saveEquipo(id, eq);
  if (!r.ok) alert("Error subiendo jugadoras del equipo");

  FS.modal.close();
  FS.equipos.renderLista();
};


/* ============================================================
   BORRAR
   ============================================================ */

FS.equipos.borrar = async function (id) {
  const eq = FS.state.equipos[id];
  if (!confirm(`¿Eliminar el equipo ${eq.nombre}?`)) return;

  delete FS.state.equipos[id];

  // No eliminamos de Firestore por seguridad (como jugadoras)
  FS.equipos.renderLista();
};


/* ============================================================
   Utils
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
