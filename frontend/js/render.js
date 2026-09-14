function esc(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function cardMatchesFilters(card, ui) {
  if (card.archived) return false;
  if (ui.search) {
    const q = ui.search.toLowerCase();
    const inTitle = card.title.toLowerCase().includes(q);
    const inNotes = (card.notes || '').toLowerCase().includes(q);
    if (!inTitle && !inNotes) return false;
  }
  if (ui.filterLabelIds.length && !card.labelIds.some((id) => ui.filterLabelIds.includes(id))) return false;
  if (ui.filterDue === 'overdue' && !(card.dueDate && card.dueDate < todayStr())) return false;
  if (ui.filterDue === 'today' && card.dueDate !== todayStr()) return false;
  return true;
}

function renderCard(card, labelsById, ui) {
  const el = document.createElement('div');
  el.className = 'card' + (ui.selectedCardId === card.id ? ' selected' : '');
  el.dataset.cardId = card.id;
  el.tabIndex = 0;

  const labelsHtml = card.labelIds
    .map((id) => labelsById.get(id))
    .filter(Boolean)
    .map((l) => `<span class="card-label-chip" style="background:${esc(l.color)}">${esc(l.name)}</span>`)
    .join('');

  const doneCount = card.checklist.filter((c) => c.done).length;
  const hasChecklist = card.checklist.length > 0;
  const overdue = card.dueDate && card.dueDate < todayStr();

  el.innerHTML = `
    <div class="card-title">${esc(card.title)}</div>
    ${labelsHtml ? `<div class="card-labels">${labelsHtml}</div>` : ''}
    <div class="card-meta">
      ${card.dueDate ? `<span class="due${overdue ? ' overdue' : ''}">📅 ${esc(card.dueDate)}</span>` : ''}
      ${hasChecklist ? `<span class="checklist-progress">☑ ${doneCount}/${card.checklist.length}</span>` : ''}
    </div>
  `;
  return el;
}

export function renderBoard(boardEl, board, labels, ui) {
  boardEl.innerHTML = '';
  const labelsById = new Map(labels.map((l) => [l.id, l]));

  if (!board) {
    const tpl = document.getElementById('tpl-empty-board');
    boardEl.appendChild(tpl.content.cloneNode(true));
    return;
  }

  for (const column of board.columns) {
    const columnEl = document.createElement('div');
    columnEl.className = 'column';
    columnEl.dataset.columnId = column.id;

    const visibleCards = column.cards.filter((c) => cardMatchesFilters(c, ui));
    const overLimit = column.wipLimit && column.cards.filter((c) => !c.archived).length > column.wipLimit;

    const header = document.createElement('div');
    header.className = 'column-header';
    header.innerHTML = `
      <input class="column-title" data-column-id="${column.id}" value="${esc(column.title)}" aria-label="Nama kolom" />
      <span class="column-count${overLimit ? ' over-limit' : ''}">${column.cards.filter((c) => !c.archived).length}${column.wipLimit ? ' / ' + column.wipLimit : ''}</span>
      <button class="column-menu-btn" data-action="column-menu" data-column-id="${column.id}" title="Menu kolom">⋮</button>
    `;
    columnEl.appendChild(header);

    const body = document.createElement('div');
    body.className = 'column-body';
    body.dataset.columnId = column.id;
    if (visibleCards.length === 0) {
      body.innerHTML = `<div class="empty-column-hint">${column.cards.length === 0 ? 'Belum ada kartu. Tambahkan yang pertama!' : 'Tidak ada kartu yang cocok.'}</div>`;
    } else {
      for (const card of visibleCards) body.appendChild(renderCard(card, labelsById, ui));
    }
    columnEl.appendChild(body);

    const addRow = document.createElement('div');
    addRow.className = 'column-add-card';
    addRow.innerHTML = `
      <input type="text" placeholder="+ Tambah kartu…" data-add-card-input data-column-id="${column.id}" aria-label="Judul kartu baru" />
    `;
    columnEl.appendChild(addRow);

    boardEl.appendChild(columnEl);
  }

  const addColBtn = document.createElement('button');
  addColBtn.className = 'add-column-ghost';
  addColBtn.style.cssText = 'flex:0 0 220px;background:transparent;border:2px dashed var(--border);border-radius:var(--radius-lg);cursor:pointer;color:var(--text-dim);font-weight:700;min-height:60px;';
  addColBtn.dataset.action = 'add-column';
  addColBtn.textContent = '+ Tambah kolom';
  boardEl.appendChild(addColBtn);
}

export function renderDots(container, count, activeIndex) {
  if (count <= 1) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }
  container.hidden = false;
  container.innerHTML = Array.from({ length: count })
    .map((_, i) => `<span class="dot${i === activeIndex ? ' active' : ''}"></span>`)
    .join('');
}

export function renderCardPanel(container, card, board, labels) {
  if (!card) {
    container.innerHTML = '';
    return;
  }
  const doneCount = card.checklist.filter((c) => c.done).length;
  const pct = card.checklist.length ? Math.round((doneCount / card.checklist.length) * 100) : 0;

  const labelsHtml = labels
    .map(
      (l) => `
      <label class="panel-label-toggle${card.labelIds.includes(l.id) ? ' active' : ''}" data-action="toggle-label" data-label-id="${l.id}">
        <input type="checkbox" ${card.labelIds.includes(l.id) ? 'checked' : ''} tabindex="-1" style="pointer-events:none;" />
        <span class="color-dot" style="background:${esc(l.color)}"></span>${esc(l.name)}
      </label>`
    )
    .join('');

  const currentColumn = board.columns.find((c) => c.cards.some((cd) => cd.id === card.id));
  const columnOptions = board.columns
    .map((c) => `<option value="${c.id}" ${currentColumn && c.id === currentColumn.id ? 'selected' : ''}>${esc(c.title)}</option>`)
    .join('');

  const checklistHtml = card.checklist
    .map(
      (item) => `
      <div class="checklist-item${item.done ? ' done' : ''}">
        <input type="checkbox" data-action="toggle-check" data-item-id="${item.id}" ${item.done ? 'checked' : ''} />
        <input type="text" data-action="edit-check-text" data-item-id="${item.id}" value="${esc(item.text)}" />
        <button class="checklist-remove" data-action="remove-check" data-item-id="${item.id}" title="Hapus butir">✕</button>
      </div>`
    )
    .join('');

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:12px;color:var(--text-dim);font-weight:700;">DETAIL KARTU</span>
      <button class="panel-close" data-action="close-panel" title="Tutup">✕</button>
    </div>

    <input class="panel-title-input" data-action="edit-title" value="${esc(card.title)}" aria-label="Judul kartu" />

    <div class="panel-section">
      <h4>Catatan</h4>
      <textarea class="panel-textarea" data-action="edit-notes" placeholder="Tulis catatan…">${esc(card.notes)}</textarea>
    </div>

    <div class="panel-section">
      <h4>Label</h4>
      <div class="panel-labels">${labelsHtml || '<span style="color:var(--text-dim);font-size:13px;">Belum ada label.</span>'}</div>
    </div>

    <div class="panel-section">
      <h4>Tanggal target</h4>
      <input type="date" class="panel-date-input" data-action="edit-due" value="${card.dueDate || ''}" />
    </div>

    <div class="panel-section">
      <h4>Daftar centang ${card.checklist.length ? `(${doneCount}/${card.checklist.length})` : ''}</h4>
      ${card.checklist.length ? `<div class="checklist-progress-bar"><div style="width:${pct}%"></div></div>` : ''}
      ${checklistHtml}
      <div class="add-checklist-item">
        <input type="text" data-action="new-check-text" placeholder="Tambah butir…" />
        <button data-action="add-check" class="icon-btn" style="min-width:36px;min-height:36px;">+</button>
      </div>
    </div>

    <div class="panel-section panel-move-to">
      <h4>Pindahkan ke…</h4>
      <select data-action="move-to-column">${columnOptions}</select>
    </div>

    <div class="panel-actions">
      <button data-action="duplicate-card">⧉ Duplikat</button>
      <button data-action="archive-card">${card.archived ? '↩ Batalkan arsip' : '🗄 Arsipkan'}</button>
      <button data-action="delete-card" class="danger">🗑 Hapus permanen</button>
    </div>
  `;
}
