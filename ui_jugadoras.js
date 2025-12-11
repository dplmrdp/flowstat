/* ui_jugadoras.js — versión Firestore-aware */
window.FS = window.FS || {};
FS.jugadoras = {};

/* Render lista */
FS.jugadoras.renderLista = function () {
  const cont = document.getElementById("lista-jugadoras");
  cont.innerHTML = "";

  const jugadoras = FS.state.jugadoras;
  const equipos = FS.state.equipos;

  const ids = Object.keys(jugadoras);
  if (ids.length === 0) {
    cont.innerHTML = "<p>No hay jugadoras registradas.</p>";
    return;
  }

  ids.forEach(id => {
    const j = jugadoras[id];
    const etiquetaEquipos = j.equipos?.map(eid => FS.state.equipos[eid]?.nombre || "(?)").join(", ");

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
      <strong>${j.alias}</strong> (${j.nombre})<br>
      Dorsal: ${j.dorsal || "—"} — Posición: ${j.posicion || "—"}<br>
      <small>Equipos: ${etiquetaEquipos || "—"}</small><br><br>

      <button onclick="FS.jugadoras.edit('${id}')">✏ Editar</button>
      <button onclick="FS.jugadoras.asignarEquipos('${id}')">👥 Equipos</button>
      <button onclick="FS.jugadoras.borrar('${id}')">🗑 Borrar</button>
    `;
    cont.appendChild(div);
  });
};

/* abrir modal crear */
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
    <br><br>
    <button onclick="FS.jugadoras.submitCreate()">Guardar</button>
    <button onclick="FS.modal.close()">Cancelar</button>
  `;
  FS.modal.open(form);
};

FS.jugadoras.submitCreate = async function () {
  const nombre = document.getElementById("fj-nombre").value.trim();
  const alias = document.getElementById("fj-alias").value.trim().slice(0,7);
  const dorsal = (document.getElementById("fj-dorsal").value || "").trim();
  const posicion = document.getElementById("fj-pos").value;

  if (!nombre || !alias) {
    alert("Nombre y alias son obligatorios.");
    return;
  }

  const id = FS.state.crearJugadora(nombre, alias, dorsal, posicion);
  FS.storage.guardarTodo();

  // Intentar subir a Firestore si está activo
  if (FS.firebase && FS.firebase.enabled) {
    const r = await FS.firebase.saveJugadora(id, FS.state.jugadoras[id]);
    if (!r.ok) {
      console.warn("No se pudo subir jugadora: se encola", r.error);
      FS.storage._enqueuePendingEntity("jugadora", id, FS.state.jugadoras[id]);
    }
  } else {
    // opcional: encolar para subir luego cuando active Firestore
    FS.storage._enqueuePendingEntity("jugadora", id, FS.state.jugadoras[id]);
  }

  FS.modal.close();
  FS.jugadoras.renderLista();
};

/* editar */
FS.jugadoras.edit = function (idJugadora) {
  const j = FS.state.jugadoras[idJugadora];
  if (!j) return;

  const form = `
    <h3>Editar jugadora</h3>
    <label>Nombre completo</label><input id="fj-nombre" type="text" value="${j.nombre}" />
    <label>Alias (7)</label><input id="fj-alias" type="text" maxlength="7" value="${j.alias}" />
    <label>Dorsal</label><input id="fj-dorsal" type="number" value="${j.dorsal || ''}" />
    <label>Posición</label>
    <select id="fj-pos">
      <option ${j.posicion==="colocadora"?"selected":""} value="colocadora">Colocadora</option>
      <option ${j.posicion==="opuesta"?"selected":""} value="opuesta">Opuesta</option>
      <option ${j.posicion==="central"?"selected":""} value="central">Central</option>
      <option ${j.posicion==="líbero"?"selected":""} value="líbero">Líbero</option>
      <option ${j.posicion==="receptora"?"selected":""} value="receptora">Receptora</option>
    </select>

    <br><br>
    <button onclick="FS.jugadoras.submitEdit('${idJugadora}')">Guardar</button>
    <button onclick="FS.modal.close()">Cancelar</button>
  `;

  FS.modal.open(form);
};

FS.jugadoras.submitEdit = async function (id) {
  const j = FS.state.jugadoras[id];
  j.nombre = document.getElementById("fj-nombre").value.trim();
  j.alias = document.getElementById("fj-alias").value.trim().slice(0,7);
  j.dorsal = (document.getElementById("fj-dorsal").value || "").trim();
  j.posicion = document.getElementById("fj-pos").value;

  FS.storage.guardarTodo();

  if (FS.firebase && FS.firebase.enabled) {
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
  const equipos = FS.state.equipos;
  const ids = Object.keys(equipos);
  if (ids.length === 0) { alert("No hay equipos."); return; }

  let opt = "";
  ids.forEach(eid => {
    const eq = equipos[eid];
    const checked = j.equipos.includes(eid) ? "checked" : "";
    opt += `<label class="jug-opt"><span>${eq.nombre} (${eq.temporada||''})</span><input type="checkbox" class="chk-eq" value="${eid}" ${checked}></label>`;
  });

  const form = `
    <h3>Asignar equipos a ${j.alias}</h3>
    ${opt}
    <br><button onclick="FS.jugadoras.submitAsignarEquipos('${idJugadora}')">Guardar</button>
    <button onclick="FS.modal.close()">Cancelar</button>
  `;

  FS.modal.open(form);
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
      if (!eq.jugadoras.includes(idJugadora)) eq.jugadoras.push(idJugadora);
    } else {
      // quitar asociación inversa
      const eq = FS.state.equipos[c.value];
      if (eq) eq.jugadoras = eq.jugadoras.filter(x => x !== idJugadora);
    }
  });

  FS.storage.guardarTodo();

  // subir cambios de la jugadora y de equipos relacionados
  if (FS.firebase && FS.firebase.enabled) {
    const r = await FS.firebase.saveJugadora(idJugadora, j);
    if (!r.ok) {
      FS.storage._enqueuePendingEntity("jugadora", idJugadora, j);
    }
    // subir equipos afectados (sencillo: subir todos los equipos listados)
    for (const eid of j.equipos) {
      const eqObj = FS.state.equipos[eid];
      if (eqObj) {
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

/* onEnter: intentar cargar desde Firestore si está disponible, sino usar local */
FS.jugadoras.onEnter = async function () {
  // Primero cargar local (para respuesta rápida)
  FS.storage.cargarTodo();
  FS.jugadoras.renderLista();

  // Si Firebase disponible, traer del servidor y sobrescribir/merge local
  if (FS.firebase && FS.firebase.enabled) {
    const r = await FS.firebase.getJugadoras();
    if (r.ok) {
      // Preferimos servidor como fuente de verdad; lo ponemos en local
      FS.state.jugadoras = {};
      r.docs.forEach(d => {
        const id = d.id.startsWith("j_") ? d.id : ("j_" + d.id);
        // usamos el id tal cual (suponiendo que guardaste con el mismo id)
        FS.state.jugadoras[id] = Object.assign({ id }, d.data);
      });
      // Guardamos local copia
      FS.storage.guardarTodo();
      FS.jugadoras.renderLista();
      // intentar subir pendientes (si existieran)
      FS.storage.syncPending();
    } else {
      console.warn("No se pudieron obtener jugadoras desde Firestore:", r.error);
    }
  }
};
