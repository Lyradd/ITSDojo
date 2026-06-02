const lobbyCache = new Map();
let lobbyBroadcaster = null;

function lobbyRoomKey(roomId) {
  return `lobby:${roomId}`;
}

function setLobbyBroadcaster(broadcaster) {
  lobbyBroadcaster = broadcaster;
}

function normalizeLobbyState(state) {
  if (!state || !state.inviteCode) return null;

  return {
    ...state,
    createdAt: state.createdAt instanceof Date ? state.createdAt.toISOString() : state.createdAt ?? null,
    updatedAt: state.updatedAt instanceof Date ? state.updatedAt.toISOString() : state.updatedAt ?? null,
    startedAt: state.startedAt instanceof Date ? state.startedAt.toISOString() : state.startedAt ?? null,
    endedAt: state.endedAt instanceof Date ? state.endedAt.toISOString() : state.endedAt ?? null,
  };
}

function upsertLobbyState(state) {
  const normalized = normalizeLobbyState(state);

  if (!normalized) return null;

  lobbyCache.set(normalized.inviteCode, normalized);

  if (lobbyBroadcaster) {
    lobbyBroadcaster(normalized);
  }

  return normalized;
}

function getLobbyState(roomId) {
  return lobbyCache.get(roomId) ?? null;
}

function deleteLobbyState(roomId) {
  lobbyCache.delete(roomId);
}

module.exports = {
  deleteLobbyState,
  getLobbyState,
  lobbyRoomKey,
  normalizeLobbyState,
  setLobbyBroadcaster,
  upsertLobbyState,
};