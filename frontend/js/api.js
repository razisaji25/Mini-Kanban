// Real backend client. Every network call lives here — callers never touch
// fetch() directly. Matches the endpoints in /openapi.yaml and the FastAPI
// app under backend/app/routers/.

const BASE_URL = 'http://localhost:8030/api';

async function request(method, path, body) {
  const options = { method };
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch (err) {
    throw new Error(`Tidak bisa menghubungi server di ${BASE_URL}. Pastikan backend sedang berjalan.`);
  }

  if (!res.ok) {
    let message = `Permintaan gagal (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.message) message = data.message;
    } catch (_) {
      /* body wasn't JSON; keep the generic message */
    }
    throw new Error(message);
  }

  return res.json();
}

export const api = {
  getState() {
    return request('GET', '/state');
  },

  // --- Boards ---
  createBoard(title) {
    return request('POST', '/boards', { title });
  },

  renameBoard(boardId, title) {
    return request('PATCH', `/boards/${boardId}`, { title });
  },

  deleteBoard(boardId) {
    return request('DELETE', `/boards/${boardId}`);
  },

  setActiveBoard(boardId) {
    return request('POST', `/boards/${boardId}/activate`);
  },

  // --- Columns ---
  createColumn(boardId, title) {
    return request('POST', `/boards/${boardId}/columns`, { title });
  },

  renameColumn(boardId, columnId, title) {
    return request('PATCH', `/boards/${boardId}/columns/${columnId}`, { title });
  },

  setColumnWipLimit(boardId, columnId, wipLimit) {
    return request('PATCH', `/boards/${boardId}/columns/${columnId}`, { wipLimit });
  },

  reorderColumns(boardId, orderedColumnIds) {
    return request('PATCH', `/boards/${boardId}/columns/reorder`, { columnIds: orderedColumnIds });
  },

  deleteColumn(boardId, columnId) {
    return request('DELETE', `/boards/${boardId}/columns/${columnId}`);
  },

  // --- Cards ---
  createCard(boardId, columnId, title) {
    return request('POST', `/boards/${boardId}/columns/${columnId}/cards`, { title });
  },

  updateCard(boardId, cardId, patch) {
    return request('PATCH', `/boards/${boardId}/cards/${cardId}`, patch);
  },

  moveCard(boardId, cardId, toColumnId, toIndex) {
    return request('POST', `/boards/${boardId}/cards/${cardId}/move`, { toColumnId, toIndex });
  },

  duplicateCard(boardId, cardId) {
    return request('POST', `/boards/${boardId}/cards/${cardId}/duplicate`);
  },

  archiveCard(boardId, cardId, archived) {
    return request('POST', `/boards/${boardId}/cards/${cardId}/archive`, { archived });
  },

  deleteCard(boardId, cardId) {
    return request('DELETE', `/boards/${boardId}/cards/${cardId}`);
  },

  // --- Labels ---
  createLabel(name, color) {
    return request('POST', '/labels', { name, color });
  },

  deleteLabel(labelId) {
    return request('DELETE', `/labels/${labelId}`);
  },

  // --- Settings & backup ---
  updateSettings(patch) {
    return request('PATCH', '/settings', patch);
  },

  markExported() {
    return request('POST', '/settings/mark-exported');
  },

  exportJSON() {
    return request('GET', '/export');
  },

  importJSON(incoming, mode) {
    return request('POST', '/import', { data: incoming, mode });
  },

  clearAll() {
    return request('POST', '/reset');
  },
};
