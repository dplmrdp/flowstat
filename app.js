/* ==========================
   ESTADO GLOBAL
========================== */
const state = {
  selectedPlayer: null,   // Ninguna al inicio
  actions: [],
  stats: {}               // stats[jugadora][grupo][accion] = número
};

/* ==========================
   DEFINICIÓN DE GRUPOS / ACCIONES
========================== */
const GROUPS = [
  { id:"saque", title:"Saque", buttons:["Pto","Positivo","Neutro","Error"] },
  { id:"defensa", title:"Defensa", buttons:["Perfecta","Positiva","Negativa","Error"] },
  { id:"segtoque", title:"2º Toque", buttons:["Perfecto","Finta","Mala","Error"] },
  { id:"recesaque", title:"Rece Saque", buttons:["Perfecta","Positiva","Negativa","Error"] },
  { id:"bloque", title:"Bloque", buttons:["Punto","Tocada","Error"] },
  { id:"ataque", title:"Ataque", buttons:["Punto","Sigue","Bloqueado","Free","Error"] },
];

/* ==========================
   INICIALIZACIÓN
========================== */
renderPlayers();
renderGroups();
refreshButtons();   // muestra stats si existieran


/* ==========================
   RENDER DE JUGADORAS
========================== */
function renderPlayers(){
  const container = document.getElementById("players");
  container.innerHTML = "";

  for (let i=1; i<=6; i++){
    const b = document.createElement("button");
    b.className = "player-btn";
    b.textContent = i;
    b.dataset.player = i;

    // Si hay jugadora seleccionada:
    if (state.selectedPlayer !== null){
      if (state.selectedPlayer == i) {
        b.classList.add("selected");
      } else {
        b.disabled = true;       // bloquear otras jugadoras
        b.style.opacity = 0.4;
      }
    }

    b.onclick = ()=> selectPlayer(i);
    container.appendChild(b);
  }
}


/* ==========================
   SELECCIONAR JUGADORA
========================== */
function selectPlayer(n){
  // No permitir cambio si ya hay una jugadora seleccionada
  // (solo se desactiva con "deshacer")
  if (state.selectedPlayer !== null) return;

  state.selectedPlayer = n;

  // Aseguramos estructura de stats
  if (!state.stats[n]) state.stats[n] = {};

  renderPlayers();
}


/* ==========================
   RENDER DE GRUPOS
========================== */
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


/* ==========================
   REGISTRAR ACCIÓN
========================== */
function registerAction(group, action){
  if (state.selectedPlayer === null) return; // Nada seleccionado

  const p = state.selectedPlayer;

  // Registrar acción en el historial
  state.actions.push({
    ts: Date.now(),
    player: p,
    group,
    action
  });

  // Actualizar estadísticas
  if (!state.stats[p]) state.stats[p] = {};
  if (!state.stats[p][group]) state.stats[p][group] = {};
  if (!state.stats[p][group][action]) state.stats[p][group][action] = 0;

  state.stats[p][group][action]++;

  // Limpiar selección
  state.selectedPlayer = null;

  renderPlayers();
  refreshButtons();
}


// ==========================
//     DESHACER
// ==========================
document.getElementById("btn-undo").onclick = ()=>{

  // CASO A:
  // Hay una jugadora seleccionada y NO hemos registrado acción
  if (state.selectedPlayer !== null) {
    state.selectedPlayer = null;   // quitar selección
    renderPlayers();               // habilitar todas
    return;                        // NO tocar historial
  }

  // CASO B:
  // Sí hay historial → deshacer última acción
  if (state.actions.length === 0) return;

  const last = state.actions.pop();
  const {player, group, action} = last;

  // Restar estadísticas
  if (state.stats[player] &&
      state.stats[player][group] &&
      state.stats[player][group][action]){

    state.stats[player][group][action]--;

    if (state.stats[player][group][action] < 0) {
      state.stats[player][group][action] = 0;
    }
  }

  refreshButtons();
  renderPlayers();
};



/* ==========================
   REFRESCAR BOTONES (mostrar estadísticas)
========================== */
function refreshButtons(){
  // Todos los botones de acción
  const buttons = document.querySelectorAll(".act-btn");

  buttons.forEach(btn=>{
    const group = btn.dataset.group;
    const action = btn.dataset.action;

    let total = 0;

    // Sumar todas las jugadoras
    for (let p in state.stats){
      if (state.stats[p][group] && state.stats[p][group][action]){
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

