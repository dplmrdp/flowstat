/* ============================================================
   ui_partido_sets.js — PASO 3.1
   Resumen de partido y sets
   ============================================================ */

window.FS = window.FS || {};
FS.partidoSets = {};

FS.partidoSets.currentPartidoId = null;

/* ============================================================
   ENTRADA A LA VISTA
   ============================================================ */
FS.partidoSets.onEnter = async function () {

  const pid = FS.partidoSets.currentPartidoId;
  if (!pid) {
    console.warn("No hay partido activo para mostrar resumen");
    FS.router.go("partidos");
    return;
  }

  const partido = FS.state.partidos[pid];
  if (!partido) {
    console.warn("Partido no encontrado:", pid);
    FS.router.go("partidos");
    return;
  }

  FS.partidoSets.renderPartido(partido);
  await FS.partidoSets.renderSets(pid);
};


/* ============================================================
   RENDER INFO PARTIDO
   ============================================================ */
FS.partidoSets.renderPartido = function (p) {
  const cont = document.getElementById("ps-info");
  if (!cont) return;

  cont.innerHTML = `
    <strong>${p.equipoNombre}</strong> · vs ${p.rival}<br>
    <small>${p.categoria} · ${p.temporada} · ${p.fechaTexto}</small>
  `;
};

/* ============================================================
   RENDER SETS (mock + reales)
   ============================================================ */
FS.partidoSets.renderSets = async function (partidoId) {
  const cont = document.getElementById("ps-sets");
  if (!cont) return;

  cont.innerHTML = "";

  // Sets reales (si existen)
  const sets = (FS.state.sets || []).filter(s => s.partidoId === partidoId);
  const setsPorNumero = {};
  sets.forEach(s => setsPorNumero[s.numeroSet] = s);

  // Determinar siguiente set disponible
  let nextSet = 1;
  while (setsPorNumero[nextSet]) nextSet++;

  for (let i = 1; i <= 5; i++) {
    const s = setsPorNumero[i];
    const div = document.createElement("div");
    div.className = "card";

    if (s) {
      // Set registrado
      const m = s.marcador || {};
      div.innerHTML = `
        <strong>Set ${i}</strong>
        <span class="item-meta"> ${m.local ?? "-"} – ${m.rival ?? "-"}</span>
      `;
    } else if (i === nextSet) {
      // Siguiente set disponible
      div.innerHTML = `
        <strong>Set ${i}</strong>
        <button class="btn-ghost" data-start="${i}">▶ Registrar</button>
      `;
    } else {
      // Set no disponible
      div.innerHTML = `
        <strong>Set ${i}</strong>
        <span class="item-meta">—</span>
      `;
      div.style.opacity = "0.4";
    }

    cont.appendChild(div);
  }

  // Acción ▶ (placeholder)
  cont.querySelectorAll("[data-start]").forEach(b => {
    b.onclick = () => {
      alert("Aquí iniciaremos el set LIVE (PASO 3.2)");
    };
  });
};
