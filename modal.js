window.FS = window.FS || {};

FS.modal = {
  open(html) {
    // debug alert - confirma ejecución
    try { alert("FS.modal.open() ejecutado"); } catch (e) {}
    const content = document.getElementById("modal-content");
    const bg = document.getElementById("modal-bg");
    if (content) content.innerHTML = html;
    if (bg) {
      bg.classList.remove("hidden");
      // Aseguramos que el fondo sea click-to-close mientras depuramos
      bg.onclick = (ev) => {
        if (ev.target === bg) {
          FS.modal.close();
        }
      };
    }
  },

  close() {
    try { alert("FS.modal.close() ejecutado"); } catch (e) {}
    const bg = document.getElementById("modal-bg");
    if (bg) {
      bg.classList.add("hidden");
      bg.onclick = null;
    }
  }
};
