const state = { 
  selectedPlayer: 1,
  actions: []
};

const GROUPS = [
  { id:"saque", title:"Saque", buttons:["Pto","Positivo","Neutro","Error"] },
  { id:"defensa", title:"Defensa", buttons:["Perfecta","Positiva","Negativa","Error"] },
  { id:"segtoque", title:"2º Toque", buttons:["Perfecto","Finta","Mala","Error"] },
  { id:"recesaque", title:"Rece Saque", buttons:["Perfecta","Positiva","Negativa","Error"] },
  { id:"bloque", title:"Bloque", buttons:["Punto","Tocada","Error"] },
  { id:"ataque", title:"Ataque", buttons:["Punto","Sigue","Bloqueado","Free","Error"] },
];

/* ---- RENDER ---- */

function renderPlayers(){
  const container = document.getElementById("players");
  container.innerHTML = "";

  for(let i=1;i<=6;i++){
    const b = document.createElement("button");
    b.className = "player-btn" + (state.selectedPlayer===i ? " selected" : "");
    b.textContent = i;
    b.onclick = ()=>{ state.selectedPlayer = i; renderPlayers(); };
    container.appendChild(b);
  }
}

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
      b.textContent = btn;
      b.onclick = ()=>registerAction(gr.id, btn);
      grid.appendChild(b);
    });

    box.appendChild(grid);
    g.appendChild(box);
  });
}

/* ---- LÓGICA ---- */

function registerAction(group, action){
  state.actions.push({
    ts:Date.now(),
    player: state.selectedPlayer,
    group,
    action
  });
}

/* Botones principales */

document.getElementById("btn-undo").onclick = ()=>{
  state.actions.pop();
};



  const blob = new Blob([csv],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="stats.csv";
  a.click();
  URL.revokeObjectURL(url);
};

/* ---- INICIO ---- */
renderPlayers();
renderGroups();
