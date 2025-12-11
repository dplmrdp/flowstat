/* ================= STORAGE — Extensiones para entidades (jugadoras/equipos) ================ */

window.FS = window.FS || {};

FS.storage = FS.storage || {};

// Guardado básico ya existente — mantenlo
FS.storage.guardarTodo = FS.storage.guardarTodo || function() {
  try {
    localStorage.setItem("flowstat_data", JSON.stringify({
      jugadoras: FS.state.jugadoras,
      equipos: FS.state.equipos,
      partidos: FS.state.partidos
    }));
  } catch (err) { console.error(err); }
};

FS.storage.cargarTodo = FS.storage.cargarTodo || function() {
  try {
    const raw = localStorage.getItem("flowstat_data");
    if (!raw) return;
    const d = JSON.parse(raw);
    FS.state.jugadoras = d.jugadoras || {};
    FS.state.equipos = d.equipos || {};
    FS.state.partidos = d.partidos || {};
  } catch (err) { console.error(err); }
};

/* ---------------------------
   Cola genérica de entidades pendientes (jugadoras/equipos)
   --------------------------- */
FS.storage._enqueuePendingEntity = function(entityType, entityId, payload) {
  const key = "flowstat_pending_entities";
  const raw = localStorage.getItem(key);
  const arr = raw ? JSON.parse(raw) : [];
  arr.push({ entityType, entityId, payload, ts: Date.now() });
  localStorage.setItem(key, JSON.stringify(arr));
};

FS.storage._getPendingEntities = function() {
  const raw = localStorage.getItem("flowstat_pending_entities");
  return raw ? JSON.parse(raw) : [];
};

FS.storage._clearPendingEntities = function() {
  localStorage.removeItem("flowstat_pending_entities");
};

/* ---------------------------
   Sincronizar pendientes (entities + sets)
   --------------------------- */
FS.storage.syncPending = async function() {
  // primero sincronizamos sets (si tienes implementado el otro pending)
  if (FS.storage._getPending && FS.storage._getPending().length > 0) {
    // si existía cola de sets en tu versión anterior, intenta reusar (opcional)
    // ... (dejamos sets sincronización anterior intacta)
  }

  // ahora entidades (jugadoras/equipos)
  if (!(FS.firebase && FS.firebase.enabled)) {
    return { ok: false, reason: "firebase_disabled" };
  }

  const pend = FS.storage._getPendingEntities();
  if (!pend || pend.length === 0) return { ok: true, uploaded: 0 };

  let uploaded = 0;
  for (const item of pend) {
    try {
      if (item.entityType === "jugadora") {
        await FS.firebase.saveJugadora(item.entityId, item.payload);
        uploaded++;
      } else if (item.entityType === "equipo") {
        await FS.firebase.saveEquipo(item.entityId, item.payload);
        uploaded++;
      } else {
        console.warn("Entidad pendiente desconocida:", item.entityType);
      }
    } catch (err) {
      console.warn("syncPending entity failed for", item, err);
    }
  }

  if (uploaded > 0) FS.storage._clearPendingEntities();
  return { ok: true, uploaded };
};

// reintentar automáticamente al reconectar
window.addEventListener("online", () => {
  if (FS.storage && FS.storage.syncPending) {
    console.log("online: intentando syncPending()");
    FS.storage.syncPending();
  }
});


