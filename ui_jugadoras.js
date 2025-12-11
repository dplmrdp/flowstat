/* ui_jugadoras.js — versión Firestore-aware y con listeners seguros */
window.FS = window.FS || {};
FS.jugadoras = {};

/* Render lista */
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
    // Seguridad: si por algún motivo j es undefined, saltar
    if (!j) return;

    const etiquetaEquipos = (j.equipos || []).map(eid => FS.state.equipos[eid]?.nombre || "(?)").join(", ");

    const div = document.createElement("div");
    div.className = "jugadora-item";
    div.style = `
      padding: 8px;
      border-radius: 8px;
      background: white;
      margin-bottom: 8px;
      box-shadow: 0 0 4px rgba(0,0,0,0.08);
    `;

    div.innerHTML = `
      <strong>${escapeHtml(j.alias || "")}</strong> (${escapeHtml(j.nombre || "")})<br>
      Dorsal: ${escapeHtml(j.dorsal || "—")} — Posición: ${escapeHtml(j.posicion || "—")}<br>
      <small>Equipos: ${escapeHtml(etiquetaEquipos || "—")}</small><br><br>

      <button data-id="${id}" class="btn-edit">✏ Editar</button>
      <button data-id="${id}" class="btn-assign">👥 Equipos</button>
      <button data-id="${id}" class="btn-delete">🗑 Borrar</button>
    `;
    cont.appendChild(div);
  });

  // Attach event delegation for buttons (safer than inline onclick)
  cont.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.currentTarget.getAttribute("data-id");
      FS.jugadoras.edit(id);
    });
  });
  cont.querySelectorAll(".btn-assign").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.currentTarget.getAttribute("data-id");
      FS.jugadoras.asignarEquipos(id);
    });
  });
  cont.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.currentTarget.getAttribute("data-id");
      FS.jugadoras.borrar(id);
    });
  });
};

/* abrir modal crear (listeners seguros) */
FS.jugadoras.create = function () {
  const form = `
    <h3>Nueva jugadora</h3>
    <label>Nombre completo</label><input id="fj-nombre" type="text" />
    <label>Alias (máx 7 chars)</label><input id="fj-alias" type="text" maxlength="7" />
    <label>Dorsal (opcional)</label><input id="fj-dorsal" type="number" min="0" />
    <label>Posición</label>
    <select id="fj-pos">
      <option value="colocadora">Colocadora</option>
      <option value="opuesta">Opuesta</option>
      <option value="central">Central</option>
      <option value="líbero">Líbero</option>
      <option value="receptora">Receptora</option>
    </select>

    <div style="margin-top:12px;text-align:right">
      <button id="fj-save" type="button">Guardar</button>
      <button id="fj-cancel" type="button">Cancelar</button>
    </div>
  `;
  FS.modal.open(form);

  // ATTACH SAFE EVENT LISTENERS
  setTimeout(() => {
    const save = document.getElementById("fj-save");
    const cancel = document.getElementById("fj-cancel");
    if (save) save.addEventListener("click", FS.jugadoras.submitCreate);
    if (cancel) cancel.addEventListener("click", FS.modal.close);
  }, 50);
};

FS.jugadoras.submitCreate = async function () {
  const nombreEl = document.getElementById("fj-nombre");
  const aliasEl  = document.getElementById("fj-alias");
  const dorsalEl = document.getElementById("fj-dorsal");
  const posEl    = document.getElementById("fj-pos");

  if (!nombreEl || !aliasEl || !posEl) {
    alert("Error interno: campos no encontrados.");
    return;
  }

  const nombre = nombreEl.value.trim();
  const alias = aliasEl.value.trim().slice(0,7);
  const dorsal = (dorsalEl && dorsalEl.value) ? dorsalEl.value.trim() : "";
  const posicion = posEl.value;

  if (!nombre || !alias) {
    alert("Nombre y alias son obligatorios.");
    return;
  }

  const id = FS.state.crearJugadora(nombre, alias, dorsal, posicion);
  FS.storage.guardarTodo();

  // Intentar subir a Firestore o encolar
  if (FS.firebase && FS.firebase.enabled && typeof FS.firebase.saveJugadora === "function") {
    const r = await FS.firebase.saveJugadora(id, FS.state.jugadoras[id]);
    if (!r.ok) {
      console.warn("No se pudo subir jugadora: se encola", r.error);
      FS.storage._enqueuePendingEntity("jugadora", id, FS.state.jugadoras[id]);
    }
  } else {
    // Encolar para subida futura
    FS.storage._enqueuePendingEntity("jugadora", id, FS.state.jugadoras[id]);
  }

  FS.modal.close();
  FS.jugadoras.renderLista();
};

/* editar (listeners seguros) */
FS.jugadoras.edit = function (idJugadora) {
  const j = FS.state.jugadoras[idJugadora];
  if (!j) return;

  const form = `
    <h3>Editar jugadora</h3>
    <label>Nombre completo</label><input id="fj-nombre" type="text" value="${escapeAttr(j.nombre || "")}" />
    <label>Alias (7)</label><input id="fj-alias" type="text" maxlength="7" value="${escapeAttr(j.alias || "")}" />
    <label>Dorsal</label><input id="fj-dorsal" type="number" value="${escapeAttr(j.dorsal || "")}" />
    <label>Posición</label>
    <select id="fj-pos">
      <option ${j.posicion==="colocadora"?"selected":""} value="colocadora">Colocadora</option>
      <option ${j.posicion==="opuesta"?"selected":""} value="opuesta">Opuesta</option>
      <option ${j.posicion==="central"?"selected":""} value="central">Central</option>
      <option ${j.posicion==="líbero"?"selected":""} value="líbero">Líbero</option>
      <option ${j.posicion==="receptora"?"selected":""} value="receptora">Receptora</option>
    </select>

    <div style="margin-top:12px;text-align:right">
      <button id="fj-save-edit" type="button">Guardar</button>
      <button id="fj-cancel-edit" type="button">Cancelar</button>
    </div>
  `;

  FS.modal.open(form);

  setTimeout(() => {
    const save = document.getElementById("fj-save-edit");
    const cancel = document.getElementById("fj-cancel-edit");
    if (save) save.addEventListener("click", () => FS.jugadoras.submitEdit(idJugadora));
    if (cancel) cancel.addEventListener("click", FS.modal.close);
  }, 50);
};

FS.jugadoras.submitEdit = async function (id) {
  const j = FS.state.jugadoras[id];
  if (!j) return alert("Error: jugadora no encontrada.");

  const nombre = document.getElementById("fj-nombre").value.trim();
  const alias = document.getElementById("fj-alias").value.trim().slice(0,7);
  const dorsal = (document.getElementById("fj-dorsal").value || "").trim();
  const posicion = document.getElementById("fj-pos").value;

  if (!nombre || !alias) {
    alert("Nombre y alias son obligatorios.");
    return;
  }

  j.nombre = nombre;
  j.alias = alias;
  j.dorsal = dorsal;
  j.posicion = posicion;

  FS.storage.guardarTodo();

  if (FS.firebase && FS.firebase.enabled && typeof FS.firebase.saveJugadora === "function") {
    const r = await FS.firebase.saveJugadora(id, j);
    if (!r.ok) {
      console.warn("No se pudo actualizar jugadora en FS:", r.error);
      FS.storage._enqueuePendingEntity("jugadora", id, j);
    }
  } else {
    FS.storage._enqueuePendingEntity("jugadora", id, j);
  }

  FS.modal.close();
  FS.jugadoras.renderLista();
};

/* borrar */
FS.jugadoras.borrar = function (id) {
  const j = FS.state.jugadoras[id];
  if (!j) return;
  if (!confirm(`¿Eliminar a ${j.nombre}?`)) return;

  // quitar de equipos
  for (const eid in FS.state.equipos) {
    FS.state.equipos[eid].jugadoras = FS.state.equipos[eid].jugadoras.filter(x => x !== id);
  }

  delete FS.state.jugadoras[id];
  FS.storage.guardarTodo();

  // opcional: borrar en Firestore (no implementado por seguridad)
  FS.jugadoras.renderLista();
};

/* asignar equipos (usa modal con checkboxes) */
FS.jugadoras.asignarEquipos = function (idJugadora) {
  const j = FS.state.jugadoras[idJugadora];
  const equipos = FS.state.equipos || {};
  const ids = Object.keys(equipos);
  if (ids.length === 0) { alert("No hay equipos."); return; }

  let opt = "";
  ids.forEach(eid => {
    const eq = equipos[eid];
    const checked = (j.equipos || []).includes(eid) ? "checked" : "";
    opt += `<label class="jug-opt"><span>${escapeHtml(eq.nombre || "")} (${escapeHtml(eq.temporada||'')})</span><input type="checkbox" class="chk-eq" value="${escapeAttr(eid)}" ${checked}></label>`;
  });

  const form = `
    <h3>Asignar equipos a ${escapeHtml(j.alias || "")}</h3>
    ${opt}
    <br><div style="text-align:right">
      <button id="fj-assign-save">Guardar</button>
      <button id="fj-assign-cancel">Cancelar</button>
    </div>
  `;

  FS.modal.open(form);

  setTimeout(() => {
    const save = document.getElementById("fj-assign-save");
    const cancel = document.getElementById("fj-assign-cancel");
    if (save) save.addEventListener("click", () => FS.jugadoras.submitAsignarEquipos(idJugadora));
    if (cancel) cancel.addEventListener("click", FS.modal.close);
  }, 50);
};

FS.jugadoras.submitAsignarEquipos = async function (idJugadora) {
  const checks = document.querySelectorAll(".chk-eq");
  const j = FS.state.jugadoras[idJugadora];
  j.equipos = [];
  checks.forEach(c => {
    if (c.checked) {
      j.equipos.push(c.value);
      // aseguramos la relación inversa
      const eq = FS.state.equipos[c.value];
      if (eq && !eq.jugadoras.includes(idJugadora)) eq.jugadoras.push(idJugadora);
    } else {
      const eq = FS.state.equipos[c.value];
      if (eq) eq.jugadoras = eq.jugadoras.filter(x => x !== idJugadora);
    }
  });

  FS.storage.guardarTodo();

  // subir cambios de la jugadora y de equipos relacionados
  if (FS.firebase && FS.firebase.enabled && typeof FS.firebase.saveJugadora === "function") {
    const r = await FS.firebase.saveJugadora(idJugadora, j);
    if (!r.ok) {
      FS.storage._enqueuePendingEntity("jugadora", idJugadora, j);
    }
    // subir equipos afectados
    for (const eid of j.equipos) {
      const eqObj = FS.state.equipos[eid];
      if (eqObj && typeof FS.firebase.saveEquipo === "function") {
        const re = await FS.firebase.saveEquipo(eid, eqObj);
        if (!re.ok) FS.storage._enqueuePendingEntity("equipo", eid, eqObj);
      }
    }
  } else {
    FS.storage._enqueuePendingEntity("jugadora", idJugadora, j);
  }

  FS.modal.close();
  FS.jugadoras.renderLista();
};

/* onEnter: intentar cargar desde Firestore si está disponible, sino usar local
   Ignora documentos de diagnóstico (id que contengan "diagnostic") */
FS.jugadoras.onEnter = async function () {
  // Carga local para respuesta inmediata
  FS.storage.cargarTodo();
  FS.jugadoras.renderLista();

  // Si Firestore activo, traer documentos del servidor
  if (FS.firebase && FS.firebase.enabled && typeof FS.firebase.getJugadoras === "function") {
    const box = document.getElementById("firebase-status");
    if (box) { box.style.display = "block"; box.textContent = "Obteniendo jugadoras desde Firestore…"; }

    try {
      const r = await FS.firebase.getJugadoras();
      if (r && r.ok && Array.isArray(r.docs)) {
        const newMap = {};
        r.docs.forEach(d => {
          // IGNORAR DOCUMENTOS DE DIAGNÓSTICO
          if (String(d.id).toLowerCase().includes("diagnostic")) return;
          newMap[d.id] = Object.assign({ id: d.id }, d.data);
        });

        // Si hay algo, usamos servidor como fuente de verdad
        if (Object.keys(newMap).length > 0) {
          FS.state.jugadoras = newMap;
          FS.storage.guardarTodo();
          FS.jugadoras.renderLista();
        }
      }
    } catch (err) {
      console.warn("Error al traer jugadoras desde Firestore:", err);
    } finally {
      if (box) { setTimeout(()=>{ box.style.display=""; }, 1200); }
      if (FS.storage && FS.storage.syncPending) FS.storage.syncPending();
    }
  } else {
    const box = document.getElementById("firebase-status");
    if (box) {
      box.style.display = "block";
      box.textContent = "Firestore no activo — usando datos locales";
      setTimeout(()=>{ box.style.display = ""; }, 1200);
    }
  }
};

/* ============================
   Utility: escapar HTML simple
   ============================ */
function escapeHtml (str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function escapeAttr (str) {
  return escapeHtml(str);
}
