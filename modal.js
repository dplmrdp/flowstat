window.FS = window.FS || {};

FS.modal = {
  open(html) {
    const content = document.getElementById("modal-content");
    const bg = document.getElementById("modal-bg");
    if (content) content.innerHTML = html;
    if (bg) {
      bg.classList.remove("hidden");
      bg.onclick = (ev) => { if (ev.target === bg) FS.modal.close(); };
    }
  },
  close() {
    const bg = document.getElementById("modal-bg");
    if (bg) {
      bg.classList.add("hidden");
      bg.onclick = null;
    }
  }
};
