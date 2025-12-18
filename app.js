/* ============================================================
   app.js — bootstrap general
   ============================================================ */

window.FS = window.FS || {};

/* ============================================================
   UTILIDADES SET (LEGACY)
   ============================================================ */

function renderPlayers() {
  const container = document.getElementById("players-container");
  if (!container) return;

  container.innerHTML = "";

  const set = FS.state.getSetActivo?.();
  if (!set) return;

  set.jugadoras.forEach(j => {
    const btn = document.createElement("button");
    btn.className = "player-btn";
    btn.textContent = j.alias || j.nombre[0];
    container.appendChild(btn);
  });
}

function renderGroups() {
  const cont = document.getElementById("groups-container");
  if (!cont) return;

  cont.innerHTML = "";
}

function ajustarAlturaGrid() {
  const g = document.getElementById("groups-container");
  if (!g) return;
}

/* ============================================================
   EVENTOS (PROTEGIDOS)
   ============================================================ */

const btnUndo = document.getElementById("btn-undo");
if (btnUndo) {
  btnUndo.onclick = () => {
    console.log("Undo pulsado (solo válido en set)");
  };
}

/* ============================================================
   ARRANQUE
   ============================================================ */

// ⚠️ IMPORTANTE:
// No se ejecuta ninguna función de SET al arrancar.
// Todo se hará desde ui_set.onEnter()

console.log("FlowStat app cargada");
