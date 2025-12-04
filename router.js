/* ============================================================
   ROUTER – Controlador de vistas del SPA FlowStat
   Cambia pantallas y ejecuta hooks onEnter
   ============================================================ */

window.FS = window.FS || {};

FS.router = {

  currentView: "home",

  go(viewName) {

    // Ocultar vista actual
    const prev = document.getElementById(`view-${this.currentView}`);
    if (prev) prev.classList.add("hidden");

    // Mostrar nueva vista
    const next = document.getElementById(`view-${viewName}`);
    if (next) next.classList.remove("hidden");

    this.currentView = viewName;

    // ==============================
    // Ejecutar hook de entrada
    // ==============================

    if (viewName === "jugadoras" && FS.jugadoras.onEnter)
      FS.jugadoras.onEnter();

    if (viewName === "equipos" && FS.equipos.onEnter)
      FS.equipos.onEnter();

    if (viewName === "partidos" && FS.partidos.onEnter)
      FS.partidos.onEnter();

    if (viewName === "set" && FS.sets.onEnter)
      FS.sets.onEnter();
  }
};
