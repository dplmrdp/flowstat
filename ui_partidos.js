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
  cont.innerHTML = "";

  const partidos = Object.values(FS.state.partidos || {});

  const preparados = partidos.filter(p => !p.hasStats);

  if (preparados.length === 0) {
    cont.innerHTML = "<p class='helper'>No hay partidos preparados.</p>";
    return;
  }

  preparados.forEach(p => {
    const div = document.createElement("div");
    div.className = "partido-item";

    div.innerHTML = `
      <strong>${p.equipoNombre}</strong> · vs ${p.rival}<br>
      <small>${p.categoria} · ${p.temporada} · ${p.fechaTexto}</small>
      <div class="item-actions">
        <button data-id="${p.id}" class="btn-delete">🗑</button>
      </div>
    `;

    cont.appendChild(div);
  });

  cont.querySelectorAll(".btn-delete").forEach(b =>
    b.onclick = () => FS.partidos.borrar(b.dataset.id)
  );
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

  const form = `
    <h3>Nuevo partido</h3>

    <label>Equipo</label>
    <select id="fp-equipo">${opts}</select>

    <label>Rival</label>
    <input id="fp-rival" type="text">

    <label>Categoría</label>
    <input id="fp-cat" type="text">

    <label>Temporada</label>
    <input id="fp-temp" type="text" placeholder="25/26">

    <label>Fecha y hora</label>
    <input id="fp-fecha" type="datetime-local">

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
  const fechaTexto = new Date(fechaISO).toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });

  const id = "p_" + crypto.randomUUID();

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
