/* ============================================================
   ui_set.js — registro LIVE de sets
   ============================================================ */

window.FS = window.FS || {};
FS.sets = FS.sets || {};

/* ============================================================
   ENTRADA A LA VISTA SET
   ============================================================ */

FS.sets.onEnter = function () {
  FS.sets.bindButtons();
  FS.sets.render();
};

/* ============================================================
   BIND DE BOTONES (PROTEGIDO)
   ============================================================ */

FS.sets.bindButtons = function () {

  const btnChange = document.getElementById("btn-change");
  if (btnChange) {
    btnChange.onclick = () => {
      console.log("Cambiar jugadoras");
    };
  }

  const btnFinish = document.getElementById("btn-finish");
  if (btnFinish) {
    btnFinish.onclick = () => {
      if (!confirm("¿Finalizar set?")) return;
      console.log("Finalizar set");
      FS.router.go("partidoSets");
    };
  }

  const btnUndo = document.getElementById("btn-undo");
  if (btnUndo) {
    btnUndo.onclick = () => {
      console.log("Deshacer última acción");
    };
  }
};

/* ============================================================
   RENDER SET
   ============================================================ */

FS.sets.render = function () {

  const players = document.getElementById("players-container");
  const groups = document.getElementById("groups-container");

  if (!players || !groups) return;

  players.innerHTML = "<em>Jugadoras en pista</em>";
  groups.innerHTML = "<em>Acciones del set</em>";
};

/* ============================================================
   CINFIG?
   ============================================================ */
FS.setConfig = FS.setConfig || {};

FS.setConfig.loadCourt = async function () {
  const cont = document.getElementById("live-court");
  if (!cont) return;

  try {
    const r = await fetch("/assets/svg/volcourt.svg");
    const svgText = await r.text();
    cont.innerHTML = svgText;
  } catch (e) {
    console.error("Error cargando SVG del campo", e);
    cont.innerHTML = "<p>Error cargando campo</p>";
  }
};

