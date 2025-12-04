window.FS = window.FS || {};

FS.modal = {
  open(html) {
    document.getElementById("modal-content").innerHTML = html;
    document.getElementById("modal-bg").classList.remove("hidden");
  },

  close() {
    document.getElementById("modal-bg").classList.add("hidden");
  }
};
