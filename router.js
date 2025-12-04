/* ============================================================
   ROUTER — Controlador de vistas del SPA
   FS.router.go("home")  → muestra view-home
   FS.router.go("partidos") → view-partidos
   ============================================================ */

window.FS = window.FS || {};

FS.router = {

  currentView: "home",

  go(viewName) {

    // Ocultar vista actual
    const previous = document.getElementById(`view-${this.currentView}`);
    if (previous) previous.classList.add("hidden");

    // Mostrar nueva vista
    const next = document.getElementById(`view-${viewName}`);
    if (next) next.classList.remove("hidden");

    this.currentView = viewName;
  }

};
