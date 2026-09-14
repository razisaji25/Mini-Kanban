import { api } from './api.js';
import { renderBoard, renderDots, renderCardPanel } from './render.js';
import { makeCardDraggable, makeColumnDraggable } from './dragdrop.js';

const els = {
  boardSwitcherBtn: document.getElementById('boardSwitcherBtn'),
  activeBoardTitle: document.getElementById('activeBoardTitle'),
  boardMenu: document.getElementById('boardMenu'),
  searchInput: document.getElementById('searchInput'),
  filterBtn: document.getElementById('filterBtn'),
  filterMenu: document.getElementById('filterMenu'),
  filterDot: document.getElementById('filterDot'),
  themeBtn: document.getElementById('themeBtn'),
  accentBtn: document.getElementById('accentBtn'),
  accentMenu: document.getElementById('accentMenu'),
  dataBtn: document.getElementById('dataBtn'),
  dataMenu: document.getElementById('dataMenu'),
  importInput: document.getElementById('importInput'),
  board: document.getElementById('board'),
  dotIndicator: document.getElementById('dotIndicator'),
  addColumnFab: document.getElementById('addColumnFab'),
  cardPanel: document.getElementById('cardPanel'),
  cardPanelInner: document.querySelector('.card-panel-inner'),
  scrim: document.getElementById('scrim'),
  toast: document.getElementById('toast'),
};

let data = null;
const ui = {
  search: '',
  filterLabelIds: [],
  filterDue: null,
  selectedCardId: null,
};

const ACCENTS = [
  { id: 'hangat', label: 'Hangat', color: '#e8724c' },
  { id: 'hijau', label: 'Hijau', color: '#3f9a5f' },
  { id: 'biru', label: 'Biru', color: '#3b7ce0' },
];

function activeBoard() {
  return data.boards.find((b) => b.id === data.activeBoardId) || null;
}

function closeAllMenus() {
  for (const menu of [els.boardMenu, els.filterMenu, els.accentMenu, els.dataMenu]) menu.hidden = true;
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.board-switcher, .board-menu, .icon-btn, .filter-menu, .accent-menu, .data-menu')) {
    closeAllMenus();
  }
});

// ---------- Theme & accent ----------

function applyTheme() {
  const root = document.documentElement;
  const theme = data.settings.theme;
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  root.setAttribute('data-accent', data.settings.accent || 'hangat');
}

els.themeBtn.addEventListener('click', async () => {
  const order = ['auto', 'light', 'dark'];
  const next = order[(order.indexOf(data.settings.theme) + 1) % order.length];
  data = await api.updateSettings({ theme: next });
  applyTheme();
  showToast(`Mode tampilan: ${next === 'auto' ? 'ikuti perangkat' : next === 'light' ? 'terang' : 'gelap'}`);
});

els.accentBtn.addEventListener('click', () => {
  const opening = els.accentMenu.hidden;
  closeAllMenus();
  if (!opening) return;
  renderAccentMenu();
  els.accentMenu.hidden = false;
});

function renderAccentMenu() {
  els.accentMenu.innerHTML = `
    <div style="font-weight:700;font-size:13px;margin-bottom:8px;">Tema warna</div>
    <div class="accent-swatch-row">
      ${ACCENTS.map((a) => `<button class="accent-swatch${data.settings.accent === a.id ? ' selected' : ''}" style="background:${a.color}" data-accent="${a.id}" title="${a.label}"></button>`).join('')}
    </div>
  `;
}

els.accentMenu.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-accent]');
  if (!btn) return;
  data = await api.updateSettings({ accent: btn.dataset.accent });
  applyTheme();
  renderAccentMenu();
});

// ---------- Toast ----------

let toastTimer = null;
function showToast(message, actionLabel, onAction) {
  clearTimeout(toastTimer);
  els.toast.innerHTML = `<span>${message}</span>${actionLabel ? `<button data-toast-action>${actionLabel}</button>` : ''}`;
  els.toast.hidden = false;
  if (actionLabel && onAction) {
    els.toast.querySelector('[data-toast-action]').addEventListener('click', () => {
      onAction();
      els.toast.hidden = true;
    });
  }
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 6000);
}

function checkExportReminder() {
  const last = data.settings.lastExportAt;
  const days30 = 30 * 24 * 60 * 60 * 1000;
  if (!last || Date.now() - new Date(last).getTime() > days30) {
    showToast('Sudah lama tidak diekspor. Cadangkan datamu?', 'Ekspor sekarang', exportData);
  }
}

// ---------- Board switcher ----------

els.boardSwitcherBtn.addEventListener('click', () => {
  const opening = els.boardMenu.hidden;
  closeAllMenus();
  if (!opening) return;
  renderBoardMenu();
  els.boardMenu.hidden = false;
});

function renderBoardMenu() {
  els.boardMenu.innerHTML =
    data.boards
      .map(
        (b) => `
      <div class="board-menu-item${b.id === data.activeBoardId ? ' active' : ''}" data-board-id="${b.id}">
        <span data-action="select-board" style="flex:1;cursor:pointer;">${escapeHtml(b.title)}</span>
        <div class="board-menu-actions">
          <button data-action="rename-board" title="Ganti nama">✎</button>
          <button data-action="delete-board" title="Hapus papan">🗑</button>
        </div>
      </div>`
      )
      .join('') + `<hr /><button data-action="add-board" style="width:100%;padding:8px;border:none;background:none;cursor:pointer;font-weight:700;">+ Papan baru</button>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

els.boardMenu.addEventListener('click', async (e) => {
  const action = e.target.dataset.action;
  const item = e.target.closest('.board-menu-item');
  const boardId = item && item.dataset.boardId;

  if (action === 'select-board') {
    data = await api.setActiveBoard(boardId);
    ui.selectedCardId = null;
    closeAllMenus();
    render();
  } else if (action === 'rename-board') {
    const span = item.querySelector('[data-action="select-board"]');
    const current = data.boards.find((b) => b.id === boardId).title;
    span.outerHTML = `<input type="text" value="${escapeHtml(current)}" data-rename-board="${boardId}" style="flex:1;" />`;
    const input = item.querySelector(`[data-rename-board]`);
    input.focus();
    input.select();
    const commit = async () => {
      const val = input.value.trim() || current;
      data = await api.renameBoard(boardId, val);
      renderTopbar();
      renderBoardMenu();
    };
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') commit();
      if (ev.key === 'Escape') renderBoardMenu();
    });
    input.addEventListener('blur', commit);
  } else if (action === 'delete-board') {
    const board = data.boards.find((b) => b.id === boardId);
    if (confirm(`Hapus papan "${board.title}"? Semua kolom dan kartu di dalamnya akan ikut terhapus.`)) {
      data = await api.deleteBoard(boardId);
      ui.selectedCardId = null;
      closeAllMenus();
      render();
    }
  } else if (action === 'add-board') {
    const title = prompt('Nama papan baru:', 'Papan Baru');
    if (title === null) return;
    data = await api.createBoard(title.trim() || 'Papan Baru');
    ui.selectedCardId = null;
    closeAllMenus();
    render();
  }
});

// ---------- Search & filter ----------

els.searchInput.addEventListener('input', (e) => {
  ui.search = e.target.value;
  renderBoardOnly();
});

els.filterBtn.addEventListener('click', () => {
  const opening = els.filterMenu.hidden;
  closeAllMenus();
  if (!opening) return;
  renderFilterMenu();
  els.filterMenu.hidden = false;
});

function renderFilterMenu() {
  els.filterMenu.innerHTML = `
    <div style="font-weight:700;font-size:13px;margin-bottom:4px;">Saring label</div>
    ${data.labels
      .map(
        (l) => `
      <label>
        <input type="checkbox" data-filter-label="${l.id}" ${ui.filterLabelIds.includes(l.id) ? 'checked' : ''} />
        <span class="label-chip"><span class="color-dot" style="background:${l.color}"></span>${escapeHtml(l.name)}</span>
      </label>`
      )
      .join('') || '<div style="font-size:13px;color:var(--text-dim);">Belum ada label.</div>'}
    <hr />
    <div style="font-weight:700;font-size:13px;margin-bottom:4px;">Tanggal target</div>
    <label><input type="radio" name="due" value="" ${!ui.filterDue ? 'checked' : ''} /> Semua</label>
    <label><input type="radio" name="due" value="overdue" ${ui.filterDue === 'overdue' ? 'checked' : ''} /> Sudah lewat</label>
    <label><input type="radio" name="due" value="today" ${ui.filterDue === 'today' ? 'checked' : ''} /> Jatuh tempo hari ini</label>
  `;
}

els.filterMenu.addEventListener('change', (e) => {
  if (e.target.dataset.filterLabel) {
    const id = e.target.dataset.filterLabel;
    ui.filterLabelIds = e.target.checked ? [...ui.filterLabelIds, id] : ui.filterLabelIds.filter((x) => x !== id);
  } else if (e.target.name === 'due') {
    ui.filterDue = e.target.value || null;
  }
  els.filterDot.hidden = !(ui.filterLabelIds.length || ui.filterDue);
  renderBoardOnly();
});

// ---------- Data menu (export / import / clear) ----------

els.dataBtn.addEventListener('click', () => {
  const opening = els.dataMenu.hidden;
  closeAllMenus();
  if (!opening) return;
  els.dataMenu.hidden = false;
});

els.dataMenu.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (action === 'export') exportData();
  if (action === 'clear-all') clearAllData();
});

async function exportData() {
  const snapshot = await api.exportJSON();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mini-kanban-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  data = await api.markExported();
  showToast('Data berhasil diekspor.');
  closeAllMenus();
}

els.importInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const incoming = JSON.parse(text);
    if (!incoming || !Array.isArray(incoming.boards)) throw new Error('Format berkas tidak dikenali.');
    const mode = confirm('Klik OK untuk GABUNGKAN dengan data yang ada, atau Batal untuk GANTI SELURUHNYA.') ? 'merge' : 'replace';
    if (mode === 'replace' && !confirm('Yakin ganti seluruh data saat ini? Tindakan ini tidak bisa dibatalkan.')) return;
    data = await api.importJSON(incoming, mode);
    ui.selectedCardId = null;
    render();
    showToast('Impor selesai.');
  } catch (err) {
    alert('Gagal mengimpor berkas: ' + err.message);
  } finally {
    e.target.value = '';
    closeAllMenus();
  }
});

async function clearAllData() {
  if (!confirm('Hapus SEMUA data papan, kolom, dan kartu?')) return;
  if (!confirm('Sungguh yakin? Data yang terhapus tidak dapat dikembalikan.')) return;
  data = await api.clearAll();
  ui.selectedCardId = null;
  render();
  closeAllMenus();
  showToast('Semua data telah dihapus.');
}

// ---------- Board & cards ----------

els.addColumnFab.addEventListener('click', async () => {
  const board = activeBoard();
  if (!board) return;
  data = await api.createColumn(board.id, 'Kolom Baru');
  render();
});

els.board.addEventListener('click', async (e) => {
  const board = activeBoard();
  if (!board) return;

  if (e.target.dataset.action === 'add-column') {
    data = await api.createColumn(board.id, 'Kolom Baru');
    render();
    return;
  }
  if (e.target.dataset.action === 'create-first-board') {
    data = await api.createBoard('Papan Pertama');
    render();
    return;
  }
  if (e.target.dataset.action === 'column-menu') {
    openColumnMenu(e.target, board.id, e.target.dataset.columnId);
    return;
  }
  const card = e.target.closest('.card');
  if (card && !e.target.closest('input, textarea, button')) {
    openCardPanel(card.dataset.cardId);
  }
});

function openColumnMenu(anchor, boardId, columnId) {
  document.querySelectorAll('.column-menu-popup').forEach((n) => n.remove());
  const column = activeBoard().columns.find((c) => c.id === columnId);
  const popup = document.createElement('div');
  popup.className = 'board-menu column-menu-popup';
  popup.style.position = 'fixed';
  const rect = anchor.getBoundingClientRect();
  popup.style.top = rect.bottom + 4 + 'px';
  popup.style.left = Math.min(rect.left, window.innerWidth - 220) + 'px';
  popup.innerHTML = `
    <button data-act="wip" style="width:100%;text-align:left;padding:8px;border:none;background:none;cursor:pointer;">Atur batas WIP (saat ini: ${column.wipLimit ?? 'tidak ada'})</button>
    <button data-act="delete" style="width:100%;text-align:left;padding:8px;border:none;background:none;cursor:pointer;color:var(--danger);">Hapus kolom</button>
  `;
  document.body.appendChild(popup);

  popup.addEventListener('click', async (e) => {
    const act = e.target.dataset.act;
    if (act === 'wip') {
      const val = prompt('Batas jumlah kartu (kosongkan untuk tidak ada batas):', column.wipLimit ?? '');
      if (val === null) return;
      const num = val.trim() === '' ? null : Math.max(1, parseInt(val, 10) || 1);
      data = await api.setColumnWipLimit(boardId, columnId, num);
      render();
    } else if (act === 'delete') {
      const hasCards = column.cards.length > 0;
      if (hasCards && !confirm(`Kolom "${column.title}" masih berisi ${column.cards.length} kartu. Hapus kolom beserta kartunya?`)) return;
      data = await api.deleteColumn(boardId, columnId);
      render();
    }
    popup.remove();
  });

  setTimeout(() => {
    document.addEventListener('click', function onDoc(ev) {
      if (!popup.contains(ev.target)) {
        popup.remove();
        document.removeEventListener('click', onDoc);
      }
    });
  }, 0);
}

els.board.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  if (e.target.matches('[data-add-card-input]')) {
    const title = e.target.value.trim();
    if (!title) return;
    const board = activeBoard();
    data = await api.createCard(board.id, e.target.dataset.columnId, title);
    render();
  } else if (e.target.classList.contains('column-title')) {
    e.target.blur();
  }
});

els.board.addEventListener('blur', async (e) => {
  if (!e.target.classList.contains('column-title')) return;
  const board = activeBoard();
  const columnId = e.target.dataset.columnId;
  const column = board.columns.find((c) => c.id === columnId);
  const val = e.target.value.trim() || column.title;
  if (val !== column.title) {
    data = await api.renameColumn(board.id, columnId, val);
    render();
  }
}, true);

// ---------- Keyboard move for selected card ----------

document.addEventListener('keydown', async (e) => {
  if (!ui.selectedCardId) return;
  if (document.activeElement && document.activeElement.matches('input, textarea, select')) return;
  if (!e.altKey) return;
  const board = activeBoard();
  if (!board) return;
  let columnIndex = -1, cardIndex = -1;
  board.columns.forEach((c, ci) => {
    const idx = c.cards.findIndex((cd) => cd.id === ui.selectedCardId);
    if (idx !== -1) { columnIndex = ci; cardIndex = idx; }
  });
  if (columnIndex === -1) return;

  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  e.preventDefault();

  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const targetIndex = columnIndex + (e.key === 'ArrowLeft' ? -1 : 1);
    const targetColumn = board.columns[targetIndex];
    if (!targetColumn) return;
    data = await api.moveCard(board.id, ui.selectedCardId, targetColumn.id, targetColumn.cards.length);
    render();
  } else {
    const column = board.columns[columnIndex];
    const targetIndex = cardIndex + (e.key === 'ArrowUp' ? -1 : 1);
    if (targetIndex < 0 || targetIndex > column.cards.length) return;
    data = await api.moveCard(board.id, ui.selectedCardId, column.id, targetIndex);
    render();
  }
});

// ---------- Card detail panel ----------

function findCard(cardId) {
  const board = activeBoard();
  for (const column of board.columns) {
    const card = column.cards.find((c) => c.id === cardId);
    if (card) return card;
  }
  return null;
}

function openCardPanel(cardId) {
  ui.selectedCardId = cardId;
  renderBoardOnly();
  renderPanel();
  els.cardPanel.hidden = false;
  els.scrim.hidden = false;
}

function closeCardPanel() {
  ui.selectedCardId = null;
  els.cardPanel.hidden = true;
  els.scrim.hidden = true;
  renderBoardOnly();
}

els.scrim.addEventListener('click', closeCardPanel);

function renderPanel() {
  const card = ui.selectedCardId ? findCard(ui.selectedCardId) : null;
  renderCardPanel(els.cardPanelInner, card, activeBoard(), data.labels);
}

els.cardPanelInner.addEventListener('click', async (e) => {
  const actionEl = e.target.closest('[data-action]');
  const action = actionEl && actionEl.dataset.action;
  if (!action) return;
  const board = activeBoard();
  const cardId = ui.selectedCardId;

  if (action === 'close-panel') closeCardPanel();
  else if (action === 'toggle-label') {
    const card = findCard(cardId);
    const labelId = actionEl.dataset.labelId;
    const has = card.labelIds.includes(labelId);
    const next = has ? card.labelIds.filter((id) => id !== labelId) : [...card.labelIds, labelId];
    data = await api.updateCard(board.id, cardId, { labelIds: next });
    renderPanel();
    renderBoardOnly();
  } else if (action === 'add-check') {
    const input = els.cardPanelInner.querySelector('[data-action="new-check-text"]');
    const text = input.value.trim();
    if (!text) return;
    const card = findCard(cardId);
    const checklist = [...card.checklist, { id: 'ck_' + Math.random().toString(36).slice(2, 8), text, done: false }];
    data = await api.updateCard(board.id, cardId, { checklist });
    renderPanel();
    renderBoardOnly();
  } else if (action === 'remove-check') {
    const card = findCard(cardId);
    const checklist = card.checklist.filter((i) => i.id !== actionEl.dataset.itemId);
    data = await api.updateCard(board.id, cardId, { checklist });
    renderPanel();
    renderBoardOnly();
  } else if (action === 'duplicate-card') {
    data = await api.duplicateCard(board.id, cardId);
    closeCardPanel();
  } else if (action === 'archive-card') {
    const card = findCard(cardId);
    data = await api.archiveCard(board.id, cardId, !card.archived);
    closeCardPanel();
  } else if (action === 'delete-card') {
    if (confirm('Hapus kartu ini secara permanen?')) {
      data = await api.deleteCard(board.id, cardId);
      closeCardPanel();
    }
  }
});

els.cardPanelInner.addEventListener('change', async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  const board = activeBoard();
  const cardId = ui.selectedCardId;

  if (action === 'toggle-check') {
    const card = findCard(cardId);
    const checklist = card.checklist.map((i) => (i.id === e.target.dataset.itemId ? { ...i, done: e.target.checked } : i));
    data = await api.updateCard(board.id, cardId, { checklist });
    renderPanel();
    renderBoardOnly();
  } else if (action === 'edit-check-text') {
    const card = findCard(cardId);
    const checklist = card.checklist.map((i) => (i.id === e.target.dataset.itemId ? { ...i, text: e.target.value } : i));
    data = await api.updateCard(board.id, cardId, { checklist });
  } else if (action === 'edit-due') {
    data = await api.updateCard(board.id, cardId, { dueDate: e.target.value || null });
    renderPanel();
    renderBoardOnly();
  } else if (action === 'move-to-column') {
    data = await api.moveCard(board.id, cardId, e.target.value, 0);
    renderBoardOnly();
  }
});

els.cardPanelInner.addEventListener(
  'blur',
  async (e) => {
    const action = e.target.dataset.action;
    if (action !== 'edit-title' && action !== 'edit-notes') return;
    const board = activeBoard();
    const cardId = ui.selectedCardId;
    const patch = action === 'edit-title' ? { title: e.target.value.trim() || 'Tanpa judul' } : { notes: e.target.value };
    data = await api.updateCard(board.id, cardId, patch);
    renderBoardOnly();
  },
  true
);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.cardPanel.hidden) closeCardPanel();
});

// ---------- Rendering & drag wiring ----------

function renderTopbar() {
  const board = activeBoard();
  els.activeBoardTitle.textContent = board ? board.title : 'Tidak ada papan';
}

function wireDragHandlers() {
  const board = activeBoard();
  if (!board) return;
  document.querySelectorAll('.card').forEach((cardEl) => {
    makeCardDraggable(cardEl, {
      onDrop: async (cardId, columnId, index) => {
        data = await api.moveCard(board.id, cardId, columnId, index);
        renderBoardOnly();
      },
    });
    cardEl.addEventListener('pointerdown', () => {
      ui.selectedCardId = cardEl.dataset.cardId;
      document.querySelectorAll('.card.selected').forEach((c) => c.classList.remove('selected'));
      cardEl.classList.add('selected');
    });
  });
  document.querySelectorAll('.column').forEach((columnEl) => {
    const header = columnEl.querySelector('.column-header');
    makeColumnDraggable(header, columnEl, {
      onDrop: async (orderedIds) => {
        data = await api.reorderColumns(board.id, orderedIds);
        renderBoardOnly();
      },
    });
  });
}

function updateDotsFromScroll() {
  const board = activeBoard();
  const count = board ? board.columns.length : 0;
  const scrollLeft = els.board.scrollLeft;
  const colWidth = els.board.clientWidth;
  const activeIndex = colWidth ? Math.round(scrollLeft / colWidth) : 0;
  renderDots(els.dotIndicator, window.innerWidth < 640 ? count : 0, activeIndex);
}

els.board.addEventListener('scroll', () => {
  if (window.innerWidth < 640) updateDotsFromScroll();
});
window.addEventListener('resize', updateDotsFromScroll);

function renderBoardOnly() {
  renderBoard(els.board, activeBoard(), data.labels, ui);
  wireDragHandlers();
  updateDotsFromScroll();
}

function render() {
  renderTopbar();
  renderBoardOnly();
  if (!els.cardPanel.hidden) renderPanel();
}

// ---------- Errors from the backend ----------

window.addEventListener('unhandledrejection', (event) => {
  console.error(event.reason);
  const message = (event.reason && event.reason.message) || 'Terjadi kesalahan saat menghubungi server.';
  showToast(message);
  event.preventDefault();
});

// ---------- Boot ----------

(async function init() {
  try {
    data = await api.getState();
  } catch (err) {
    els.board.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">🔌</div>
        <p>${err.message}</p>
        <button class="btn-primary" data-action="retry-init">Coba lagi</button>
      </div>
    `;
    els.board.querySelector('[data-action="retry-init"]').addEventListener('click', () => location.reload());
    return;
  }
  applyTheme();
  render();
  checkExportReminder();
})();
