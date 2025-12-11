/* ============================================================
   ui_equipos.js — Gestión de Equipos con Firestore
   ============================================================ */

window.FS = window.FS || {};
FS.equipos = {};


/* ============================================================
   LISTA DE EQUIPOS
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
    if (!eq) return;

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

  // Delegación de eventos
  cont.querySelectorAll(".btn-ver").forEach(b => {
    b.onclick = () => FS.equipos.verJugadoras(b.dataset.id);
  });

  cont.querySelectorAll(".btn-edit").forEach(b => {
    b.onclick = () => FS.equipos.editar(b.dataset.id);
  });

  cont.querySelectorAll(".btn-gestionar").forEach(b => {
    b.onclick = () => FS.equipos.editarJugadoras(b.dataset.id);
  });

  cont.querySelectorAll(".btn-delete").forEach(b => {
    b.onclick = () => FS.equipos.borrar(b.dataset.id);
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
    <button id="fe-save">Guardar</button>
    <button id="fe-cancel">Cancelar</button>
  `;

  FS.modal.open(form);

  setTimeout(() => {
    document.getElementById("fe-save").onclick = FS.equipos.submitCreate;
    document.getElementById("fe-cancel").onclick = FS.modal.close;
  }, 50);
};


FS.equipos.submitCreate = function () {
  const nombre = document.getElementById("fe-nombre").value.trim();
  const categoria = document.getElementById("fe-cat").value;
  const temporada = document.getElementById("fe-temp").value.trim();

  if (!nombre || !temporada) {
    alert("Nombre y temporada son obligatorios.");
    return;
  }

  const id = FS.state.crearEquipo(nombre, categoria, temporada);
  FS.storage.guardarTodo();

  // === Subir a Firestore ===
  if (FS.firebase && FS.firebase.enabled) {
    FS.firebase.saveEquipo(id, FS.state.equipos[id])
      .catch(err => {
        console.warn("Equipo no subido, se encola:", err);
        FS.storage._enqueuePendingEntity("equipo", id, FS.state.equipos[id]);
      });
  } else {
    FS.storage._enqueuePendingEntity("equipo", id, FS.state.equipos[id]);
  }

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
    document.getElementById("fe-save-edit").onclick = () => FS.equipos.submitEdit(idEquipo);
    document.getElementById("fe-cancel-edit").onclick = FS.modal.close;
  }, 50);
};


FS.equipos.submitEdit = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];

  eq.nombre = document.getElementById("fe-nombre").value.trim();
  eq.categoria = document.getElementById("fe-cat").value;
  eq.temporada = document.getElementById("fe-temp").value.trim();

  FS.storage.guardarTodo();

  // === Subida a Firestore ===
  if (FS.firebase && FS.firebase.enabled) {
    FS.firebase.saveEquipo(idEquipo, eq)
      .catch(err => {
        console.warn("Equipo editado no subido, se encola:", err);
        FS.storage._enqueuePendingEntity("equipo", idEquipo, eq);
      });
  } else {
    FS.storage._enqueuePendingEntity("equipo", idEquipo, eq);
  }

  FS.modal.close();
  FS.equipos.renderLista();
};


/* ============================================================
   GESTIÓN DE JUGADORAS
   ============================================================ */

FS.equipos.verJugadoras = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];
  const jug = FS.state.jugadoras;
  let msg = `Jugadoras de ${eq.nombre}:\n\n`;

  if (!eq.jugadoras.length) {
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
        <span>${escapeHtml(j.alias)} (#${escapeHtml(j.dorsal || "-")})</span>
        <input type="checkbox" class="chk-jug" value="${escapeAttr(j.id)}" ${checked}>
      </label>
    `;
  });

  const form = `
    <h3>Jugadoras de ${escapeHtml(eq.nombre)}</h3>
    ${opciones}
    <br>
    <button id="fj-save-eq">Guardar</button>
    <button id="fj-cancel-eq">Cancelar</button>
  `;

  FS.modal.open(form);

  setTimeout(() => {
    document.getElementById("fj-save-eq").onclick = () => FS.equipos.submitAsignarJugadoras(idEquipo);
    document.getElementById("fj-cancel-eq").onclick = FS.modal.close;
  }, 40);
};


FS.equipos.submitAsignarJugadoras = function (idEquipo) {
  const checks = document.querySelectorAll(".chk-jug");
  const eq = FS.state.equipos[idEquipo];
  eq.jugadoras = [];

  checks.forEach(c => {
    if (c.checked) {
      eq.jugadoras.push(c.value);

      const j = FS.state.jugadoras[c.value];
      if (!j.equipos.includes(idEquipo)) j.equipos.push(idEquipo);
    }
  });

  FS.storage.guardarTodo();

  // === Subida a Firestore ===
  if (FS.firebase && FS.firebase.enabled) {
    FS.firebase.saveEquipo(idEquipo, eq)
      .catch(err => {
        console.warn("Equipo (jugadoras) no subido, se encola:", err);
        FS.storage._enqueuePendingEntity("equipo", idEquipo, eq);
      });
  } else {
    FS.storage._enqueuePendingEntity("equipo", idEquipo, eq);
  }

  FS.modal.close();
  FS.equipos.renderLista();
};


/* ============================================================
   BORRAR
   ============================================================ */

FS.equipos.borrar = function (idEquipo) {
  const eq = FS.state.equipos[idEquipo];
  if (!confirm(`¿Eliminar el equipo ${eq.nombre}?`)) return;

  // eliminar relaciones en jugadoras
  Object.values(FS.state.jugadoras).forEach(j => {
    j.equipos = j.equipos.filter(eid => eid !== idEquipo);
  });

  delete FS.state.equipos[idEquipo];

  FS.storage.guardarTodo();

  // No borramos en Firestore por seguridad (solo admin)
  FS.equipos.renderLista();
};


/* ============================================================
   HOOK DE ENTRADA
   ============================================================ */

FS.equipos.onEnter = function () {
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
