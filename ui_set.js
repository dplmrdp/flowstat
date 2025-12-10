/* ============================================================
   ui_set.js
   Pantalla de toma de datos de FlowStat
   Integra:
   - selección de jugadoras
   - acciones por grupo
   - estadísticas en tiempo real
   - deshacer con confirmación
   - set híbrido (local + posterior Firestore)
   ============================================================ */

window.FS = window.FS || {};
FS.sets = {};


/* ============================================================
   ESTADO LOCAL DEL MÓDULO
   ============================================================ */

FS.sets.local = {
  selectedPlayer: null,      // jugadora seleccionada para acción
  undoPending: null,         // { accion, jugadora, grupo }
  stats: {},                 // estadística visual para botones en pantalla
};


/* ============================================================
   ENTRADA A LA VISTA DE SET
   (se llama desde ui_partidos.js → entrarPartido())
   ============================================================ */

FS.sets.onEnter = function () {
  FS.sets.local.selectedPlayer = null;
  FS.sets.local.undoPending = null;
  FS.sets.renderJugadoras();
  FS.sets.renderBotonera();
  FS.sets.refreshStatsInUI();
  FS.sets.hideUndoConfirm();
  FS.sets.ajustarAlturaGrid();
};


/* ============================================================
   CARGAR JUGADORAS DE UN EQUIPO PARA EL SET
   ============================================================ */

FS.sets.cargarJugadorasEquipo = function (equipo) {
  // Guardamos jugadoras visibles del equipo para usar en renderJugadoras()
  FS.sets.local.jugadorasEquipo = equipo.jugadoras;
};


/* ============================================================
   RENDER DE JUGADORAS
   ============================================================ */

FS.sets.renderJugadoras = function () {
  const cont = document.getElementById("players");
  cont.innerHTML = "";

  const jugadoras = FS.sets.local.jugadorasEquipo;
  const all = FS.state.jugadoras;
  const sel = FS.sets.local.selectedPlayer;
  const undo = FS.sets.local.undoPending;

  jugadoras.forEach(jid => {
    const j = all[jid];

    const b = document.createElement("button");
    b.className = "player-btn";

     // Añadir clase de posición
if (j.posicion) {
    const clase = j.posicion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // esto convierte "líbero" → "libero"
    b.classList.add(clase);
}

    // texto del botón
    b.textContent = `${j.alias}`;

    // si hay undoPending, bloquear todo excepto jugadora de esa acción
    if (undo) {
      if (undo.jugadora === jid) {
        b.classList.add("selected");
      } else {
        b.disabled = true;
        b.style.opacity = 0.4;
      }
    }
    else if (sel) {
      // modo normal: jugador seleccionado
      if (sel === jid) {
        b.classList.add("selected");
      } else {
        b.disabled = true;
        b.style.opacity = 0.4;
      }
    }

    b.onclick = () => {
      if (undo) return; // no puede seleccionar mientras se confirma deshacer
      if (FS.sets.local.selectedPlayer) return;
      FS.sets.local.selectedPlayer = jid;
      FS.sets.renderJugadoras();
    };

    cont.appendChild(b);
  });
};


/* ============================================================
   RENDER DE BOTONERA (3x2)
   Basado en el esquema ya implementado.
   ============================================================ */

FS.sets.GROUPS = [
  { id:"saque", title:"Saque", acciones:["Pto","Positivo","Neutro","Error"] },
  { id:"defensa", title:"Defensa", acciones:["Perfecta","Positiva","Negativa","Error"] },
  { id:"segtoque", title:"2º Toque", acciones:["Perfecto","Finta","Mala","Error"] },
  { id:"recesaque", title:"Rece Saque", acciones:["Perfecta","Positiva","Negativa","Error"] },
  { id:"bloque", title:"Bloque", acciones:["Punto","Tocada","Error"] },
  { id:"ataque", title:"Ataque", acciones:["Punto","Sigue","Bloqueado","Free","Error"] },
];

FS.sets.renderBotonera = function () {
  const cont = document.getElementById("groups");
  cont.innerHTML = "";

  FS.sets.GROUPS.forEach(gr => {
    const box = document.createElement("div");
    box.className = "group";

    box.innerHTML = `<div class="title">${gr.title}</div>`;

    const grid = document.createElement("div");
    grid.className = "buttons-grid";

    gr.acciones.forEach(acc => {
      const b = document.createElement("button");
      b.className = "act-btn";
      b.dataset.group = gr.id;
      b.dataset.action = acc;

      b.onclick = () => {
        if (FS.sets.local.undoPending) return; // bloqueado
        FS.sets.registrarAccion(gr.id, acc);
      };

      grid.appendChild(b);
    });

    box.appendChild(grid);
    cont.appendChild(box);
  });
};


/* ============================================================
   REGISTRAR ACCIÓN
   ============================================================ */

FS.sets.registrarAccion = function (grupo, accion) {
  const jug = FS.sets.local.selectedPlayer;
  if (!jug) return;

  // Registrar en FS.state
  FS.state.registrarAccion(jug, grupo, accion);

  // Actualizar stats visuales
  FS.sets.local.stats[grupo] = FS.sets.local.stats[grupo] || {};
  FS.sets.local.stats[grupo][accion] =
    (FS.sets.local.stats[grupo][accion] || 0) + 1;

  // Reset selección
  FS.sets.local.selectedPlayer = null;

  // Render
  FS.sets.refreshStatsInUI();
  FS.sets.renderJugadoras();
};


/* ============================================================
   ACTUALIZAR ESTADÍSTICAS EN BOTONES
   ============================================================ */

FS.sets.refreshStatsInUI = function () {
  const stats = FS.sets.local.stats;

  document.querySelectorAll(".act-btn").forEach(b => {
    const g = b.dataset.group;
    const a = b.dataset.action;

    const valor = stats[g]?.[a] || 0;
    b.textContent = valor > 0 ? `${a} (${valor})` : a;
  });
};


/* ============================================================
   DESHACER (NUEVA LÓGICA CON CONFIRMACIÓN)
   ============================================================ */

document.getElementById("btn-undo").onclick = () => {

  const partido = FS.state.partidos[FS.state.partidoActivo];
  if (!partido) return;

  const set = partido.sets[FS.state.setActivo - 1];
  if (set.acciones.length === 0) return;

  const last = set.acciones[set.acciones.length - 1];

  // Activamos modo deshacer pendiente
  FS.sets.local.undoPending = last;

  // Seleccionar jugadora implicada
  FS.sets.local.selectedPlayer = last.jugadora;

  FS.sets.showUndoConfirm(last);
  FS.sets.renderJugadoras();
};


/* ============================================================
   MOSTRAR ZONA DE CONFIRMACIÓN DESHACER
   ============================================================ */

FS.sets.showUndoConfirm = function (accion) {

  let bar = document.getElementById("undo-confirm-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "undo-confirm-bar";
    bar.style = `
      background: #ffe9d6;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 10px;
    `;
    const topRow = document.querySelector(".top-row");
    topRow.insertAdjacentElement("afterend", bar);
  }

  const j = FS.state.jugadoras[accion.jugadora];

  bar.innerHTML = `
    <strong>¿Deshacer última acción?</strong><br>
    Jugadora: #${j.dorsal} ${j.nombre}<br>
    Acción: ${accion.grupo} → ${accion.accion}
    <br><br>
    <button onclick="FS.sets.confirmUndo()">✔ Confirmar</button>
    <button onclick="FS.sets.cancelUndo()">✖ Cancelar</button>
  `;
};


/* ============================================================
   OCULTAR BARRA DE CONFIRMACIÓN
   ============================================================ */

FS.sets.hideUndoConfirm = function () {
  const bar = document.getElementById("undo-confirm-bar");
  if (bar) bar.remove();
};


/* ============================================================
   CONFIRMAR DESHACER
   ============================================================ */

FS.sets.confirmUndo = function () {
  const up = FS.sets.local.undoPending;
  if (!up) return;

  const partido = FS.state.partidos[FS.state.partidoActivo];
  const set = partido.sets[FS.state.setActivo - 1];

  // quitar la última acción del set
  set.acciones.pop();

  // Restar en estadísticas visuales
  const stats = FS.sets.local.stats;
  if (stats[up.grupo]?.[up.accion]) {
    stats[up.grupo][up.accion]--;
    if (stats[up.grupo][up.accion] < 0) stats[up.grupo][up.accion] = 0;
  }

  // Reset estados
  FS.sets.local.undoPending = null;
  FS.sets.local.selectedPlayer = null;

  FS.sets.hideUndoConfirm();
  FS.sets.renderJugadoras();
  FS.sets.refreshStatsInUI();
};


/* ============================================================
   CANCELAR DESHACER
   ============================================================ */

FS.sets.cancelUndo = function () {
  FS.sets.local.undoPending = null;
  FS.sets.local.selectedPlayer = null;
  FS.sets.hideUndoConfirm();
  FS.sets.renderJugadoras();
};


/* ============================================================
   FINALIZAR SET
   ============================================================ */

document.getElementById("btn-finish").onclick = async () => {
  if (!confirm("¿Finalizar este set?")) return;

  const partidoId = FS.state.partidoActivo;
  const setNumero = FS.state.setActivo;

  // 1) Finalizar set en memoria
  FS.state.finalizarSet();

  // 2) Guardar local
  FS.storage.guardarTodo();

  // 3) Mostrar mensaje temporal
  FS.sets.mostrarSyncStatus("Sincronizando set con Firestore…");

  // 4) Intentar subir a Firestore
  const r = await FS.storage.handleSetFinalized(partidoId, setNumero);

  if (r.ok) {
    FS.sets.mostrarSyncStatus("Set sincronizado correctamente ✔️");
  } else {
    FS.sets.mostrarSyncStatus("Sin conexión: set encolado para subir más tarde ⏳");
  }

  // 5) Esperar un segundo antes de salir
  setTimeout(() => {
    FS.sets.mostrarSyncStatus(""); 
    FS.router.go("partidos");
  }, 1000);
};



/* ============================================================
   AJUSTE DINÁMICO DE ALTURA
   ============================================================ */

FS.sets.ajustarAlturaGrid = function () {
  const topRow = document.querySelector(".top-row");
  const bar = document.getElementById("undo-confirm-bar");
  const groups = document.getElementById("groups");

  let topHeight = topRow.offsetHeight;
  let barHeight = bar ? bar.offsetHeight : 0;

  const safeBottom = parseFloat(getComputedStyle(document.documentElement)
                      .getPropertyValue('padding-bottom')) || 0;

  const available = window.innerHeight - topHeight - barHeight - safeBottom - 10;

  groups.style.height = available + "px";
  groups.style.maxHeight = available + "px";
};

window.addEventListener("resize", FS.sets.ajustarAlturaGrid);
window.addEventListener("orientationchange", FS.sets.ajustarAlturaGrid);
window.addEventListener("load", FS.sets.ajustarAlturaGrid);

/* ============================================================
   Mostrar estado de sincronización (Firestore)
============================================================ */
FS.sets.mostrarSyncStatus = function (msg) {
  let bar = document.getElementById("sync-status-bar");

  if (!bar) {
    bar = document.createElement("div");
    bar.id = "sync-status-bar";
    bar.style = `
      background: #eef5ff;
      border: 1px solid #aac9ff;
      padding: 8px;
      margin-bottom: 8px;
      border-radius: 8px;
      font-size: 14px;
      text-align: center;
    `;
    const topRow = document.querySelector(".top-row");
    topRow.insertAdjacentElement("afterend", bar);
  }

  bar.textContent = msg || "";
  bar.style.display = msg ? "block" : "none";
};

