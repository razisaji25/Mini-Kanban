// Pointer-based drag & drop that works with mouse, touch, and pen.
// Touch needs a short "hold still" period before a drag engages, so a
// normal scroll swipe isn't hijacked into a drag by accident.

const LONG_PRESS_MS = 260;
const MOVE_SLOP = 6;

export function makeCardDraggable(cardEl, { onDrop, isLocked }) {
  let state = null;
  let rafId = null;
  let pendingEvent = null;

  cardEl.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (isLocked && isLocked()) return;
    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
    state = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      isTouch,
      dragging: false,
      scrolling: false,
      column: cardEl.closest('.column-body'),
      timer: isTouch
        ? setTimeout(() => {
            if (state && !state.scrolling) engageDrag();
          }, LONG_PRESS_MS)
        : null,
    };
  });

  function engageDrag() {
    if (!state) return;
    state.dragging = true;
    cardEl.classList.add('dragging');
    cardEl.style.position = 'relative';
    cardEl.style.zIndex = '50';
    cardEl.setPointerCapture(state.pointerId);
  }

  cardEl.addEventListener('pointermove', (e) => {
    if (!state || state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    if (!state.dragging) {
      if (state.isTouch) {
        if (state.scrolling) {
          const body = cardEl.closest('.column-body');
          const board = document.getElementById('board');
          if (Math.abs(dy) >= Math.abs(dx)) body.scrollTop -= e.movementY || 0;
          else board.scrollLeft -= e.movementX || 0;
          return;
        }
        if (Math.abs(dx) > MOVE_SLOP || Math.abs(dy) > MOVE_SLOP) {
          state.scrolling = true;
          clearTimeout(state.timer);
        }
        return;
      }
      if (Math.abs(dx) > MOVE_SLOP || Math.abs(dy) > MOVE_SLOP) engageDrag();
      return;
    }

    e.preventDefault();
    // Move events can fire far more often than the screen repaints; doing
    // the hit-test + DOM reorder on every single one causes layout
    // thrashing (each elementFromPoint/getBoundingClientRect forces a
    // synchronous layout right after the style write above). Coalesce to
    // at most once per animation frame instead.
    pendingEvent = e;
    if (rafId === null) rafId = requestAnimationFrame(processPendingMove);
  });

  function processPendingMove() {
    rafId = null;
    if (!state || !state.dragging || !pendingEvent) return;
    const e = pendingEvent;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    cardEl.style.transform = `translate(${dx}px, ${dy}px)`;
    cardEl.style.pointerEvents = 'none';
    const target = document.elementFromPoint(e.clientX, e.clientY);
    cardEl.style.pointerEvents = '';
    if (!target) return;
    const overCard = target.closest('.card');
    const overBody = target.closest('.column-body');
    if (overCard && overCard !== cardEl && overCard.parentElement) {
      const rect = overCard.getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;
      overCard.parentElement.insertBefore(cardEl, before ? overCard : overCard.nextSibling);
      resetTransform(e);
    } else if (overBody && overBody !== cardEl.parentElement) {
      overBody.appendChild(cardEl);
      resetTransform(e);
    }
  }

  function resetTransform(e) {
    cardEl.style.transform = 'translate(0px, 0px)';
    state.startX = e.clientX;
    state.startY = e.clientY;
  }

  function finish(e) {
    if (!state) return;
    clearTimeout(state.timer);
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pendingEvent = null;
    if (state.dragging) {
      cardEl.classList.remove('dragging');
      cardEl.style.transform = '';
      cardEl.style.position = '';
      cardEl.style.zIndex = '';
      cardEl.style.pointerEvents = '';
      try {
        cardEl.releasePointerCapture(state.pointerId);
      } catch (_) {
        /* already released */
      }
      const newBody = cardEl.closest('.column-body');
      const columnEl = cardEl.closest('.column');
      const index = Array.from(newBody.children).indexOf(cardEl);
      cardEl.classList.add('moving');
      setTimeout(() => cardEl.classList.remove('moving'), 260);
      // A drag still ends with a native "click" on this element in most
      // browsers (mouse especially) — swallow that one so it doesn't
      // reopen the card panel right after a drop.
      cardEl.addEventListener('click', (ev) => ev.stopPropagation(), { capture: true, once: true });
      onDrop(cardEl.dataset.cardId, columnEl.dataset.columnId, index);
    }
    state = null;
  }

  cardEl.addEventListener('pointerup', finish);
  cardEl.addEventListener('pointercancel', finish);
}

export function makeColumnDraggable(headerEl, columnEl, { onDrop }) {
  let state = null;
  let rafId = null;
  let pendingEvent = null;

  headerEl.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    state = { pointerId: e.pointerId, startX: e.clientX, dragging: false };
  });

  headerEl.addEventListener('pointermove', (e) => {
    if (!state || state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.startX;
    if (!state.dragging) {
      if (Math.abs(dx) < MOVE_SLOP) return;
      state.dragging = true;
      columnEl.classList.add('dragging');
      columnEl.style.zIndex = '50';
      headerEl.setPointerCapture(state.pointerId);
    }
    e.preventDefault();
    // See the same coalescing note in makeCardDraggable: cap the
    // hit-test + reorder to once per animation frame.
    pendingEvent = e;
    if (rafId === null) rafId = requestAnimationFrame(processPendingMove);
  });

  function processPendingMove() {
    rafId = null;
    if (!state || !state.dragging || !pendingEvent) return;
    const e = pendingEvent;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const overColumn = target && target.closest('.column');
    if (overColumn && overColumn !== columnEl && overColumn.parentElement === columnEl.parentElement) {
      const rect = overColumn.getBoundingClientRect();
      const before = e.clientX < rect.left + rect.width / 2;
      overColumn.parentElement.insertBefore(columnEl, before ? overColumn : overColumn.nextSibling);
    }
  }

  function finish(e) {
    if (!state) return;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pendingEvent = null;
    if (state.dragging) {
      columnEl.classList.remove('dragging');
      columnEl.style.zIndex = '';
      try {
        headerEl.releasePointerCapture(state.pointerId);
      } catch (_) {
        /* already released */
      }
      const order = Array.from(columnEl.parentElement.children)
        .filter((el) => el.classList.contains('column'))
        .map((el) => el.dataset.columnId);
      headerEl.addEventListener('click', (ev) => ev.stopPropagation(), { capture: true, once: true });
      onDrop(order);
    }
    state = null;
  }

  headerEl.addEventListener('pointerup', finish);
  headerEl.addEventListener('pointercancel', finish);
}
