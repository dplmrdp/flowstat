/* =========================================
   ESTADO GLOBAL
========================================= */
const state = {
  selectedPlayer: null,
  actions: [],
  stats: {}
};

/* =========================================
   DEFINICIÓN DE GRUPOS
========================================= */
const GROUPS = [
  { id:"saque", title:"Saque", buttons:["Pto","Positivo","Neutro","Error"] },
  { id:"defensa", title:"Defensa", buttons:["Perfecta","Positiva","Negativa","Error"] },
  { id:"segtoque", title:"2º Toque", buttons:["Perfecto","Finta","Mala","Error"] },
  { id:"recesaque", title:"Rece Saque", buttons:["Perfecta","Positiva","Negativa","Error"] },
  { id:"bloque", title:"Bloque", buttons:["Punto","Tocada","Error"] },
  { id:"ataque", title:"Ataque", buttons:["Punto","Sigue","Bloqueado","Free","Error"] },
];

/* =========================================
   INIT
========================================= */
//renderPlayers();

renderGroups();
refreshButtons();
ajustarAlturaGrid();

/* =========================================
   RENDER DE JUGADORAS
========================================= */
function renderPlayers(){
  const container = document.getElementById("players");
  container.innerHTML = "";

  for (let i=1; i<=6; i++){
    const b = document.createElement("button");
    b.className = "player-btn";
    b.textContent = i;
    b.dataset.player = i;

    if (state.selectedPlayer !== null){
      if (state.selectedPlayer == i) {
        b.classList.add("selected");
      } else {
        b.disabled = true;
        b.style.opacity = 0.4;
      }
    }

    b.onclick = ()=> selectPlayer(i);
    container.appendChild(b);
  }
}

/* =========================================
   SELECCIONAR JUGADORA
========================================= */
function selectPlayer(n){
  if (state.selectedPlayer !== null) return;

  state.selectedPlayer = n;

  if (!state.stats[n]) state.stats[n] = {};

  renderPlayers();
}

/* =========================================
   RENDER DE GRUPOS
========================================= */
function renderGroups(){
  const g = document.getElementById("groups");
  g.innerHTML = "";

  GROUPS.forEach(gr=>{
    const box = document.createElement("div");
    box.className = "group";
    box.innerHTML = `<div class="title">${gr.title}</div>`;

    const grid = document.createElement("div");
    grid.className = "buttons-grid";

    gr.buttons.forEach(btn=>{
      const b = document.createElement("button");
      b.className = "act-btn";
      b.dataset.group = gr.id;
      b.dataset.action = btn;
      b.onclick = ()=> registerAction(gr.id, btn);
      grid.appendChild(b);
    });

    box.appendChild(grid);
    g.appendChild(box);
  });
}

/* =========================================
   REGISTRAR ACCIÓN
========================================= */
function registerAction(group, action){
  if (state.selectedPlayer === null) return;

  const p = state.selectedPlayer;

  state.actions.push({
    ts: Date.now(),
    player: p,
    group,
    action
  });

  if (!state.stats[p]) state.stats[p] = {};
  if (!state.stats[p][group]) state.stats[p][group] = {};
  if (!state.stats[p][group][action]) state.stats[p][group][action] = 0;

  state.stats[p][group][action]++;

  state.selectedPlayer = null;

  renderPlayers();
  refreshButtons();
}

/* =========================================
   DESHACER
========================================= */
document.getElementById("btn-undo").onclick = ()=>{

  // Si hay jugadora seleccionada pero no acción → solo cancelar selección
  if (state.selectedPlayer !== null) {
    state.selectedPlayer = null;
    renderPlayers();
    return;
  }

  if (state.actions.length === 0) return;

  const last = state.actions.pop();
  const {player, group, action} = last;

  if (state.stats[player] &&
      state.stats[player][group] &&
      state.stats[player][group][action]){
    state.stats[player][group][action]--;
    if (state.stats[player][group][action] < 0)
      state.stats[player][group][action] = 0;
  }

  refreshButtons();
  renderPlayers();
};

/* =========================================
   REFRESCAR BOTONES CON ESTADÍSTICAS
========================================= */
function refreshButtons(){
  const buttons = document.querySelectorAll(".act-btn");

  buttons.forEach(btn=>{
    const group = btn.dataset.group;
    const action = btn.dataset.action;

    let total = 0;

    for (let p in state.stats){
      if (state.stats[p][group] &&
          state.stats[p][group][action]){
        total += state.stats[p][group][action];
      }
    }

    if (total > 0){
      btn.textContent = `${action} (${total})`;
    } else {
      btn.textContent = action;
    }
  });
}

/* =========================================
   AJUSTE DINÁMICO DE ALTURA PARA IPHONE
========================================= */
function ajustarAlturaGrid() {
  const topRow = document.querySelector(".top-row");
  const groups = document.querySelector(".groups");

  if (!topRow || !groups) return;

  const topH = topRow.offsetHeight;
  const safeBottom = parseFloat(getComputedStyle(document.documentElement)
                      .getPropertyValue('padding-bottom')) || 0;

  const available = window.innerHeight - topH - safeBottom - 10;

  groups.style.height = available + "px";
  groups.style.maxHeight = available + "px";
}

window.addEventListener("resize", ajustarAlturaGrid);
window.addEventListener("orientationchange", ajustarAlturaGrid);
window.addEventListener("load", ajustarAlturaGrid);
