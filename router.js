/* ============================================================
   ROUTER – Controlador de vistas del SPA FlowStat
   ============================================================ */

window.FS = window.FS || {};

FS.router = {

  currentView: "home",

  go(viewName) {

    // Ocultar TODAS las vistas y limpiar estado
    document.querySelectorAll(".view").forEach(v => {
      v.classList.add("hidden");
      v.classList.remove("active");
    });

    // Mostrar nueva vista
    const next = document.getElementById(`view-${viewName}`);
    if (!next) {
      console.warn(`Vista no encontrada: view-${viewName}`);
      return;
    }

    next.classList.remove("hidden");
    next.classList.add("active");

    this.currentView = viewName;

    // ==============================
    // Ejecutar hook de entrada
    // ==============================

    const mod = FS[viewName];
    if (mod && typeof mod.onEnter === "function") {
      mod.onEnter();
    }
  }
};
