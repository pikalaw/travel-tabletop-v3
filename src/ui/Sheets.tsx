/** Bottom sheets (piles, log, menu) and the card list prompts and piles share. */
import type { ComponentChildren } from 'preact';
import type { GameState, ObjectId } from '../engine/types';
import { imageOf, nameOf } from './model';

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ComponentChildren }) {
  return (
    <div class="sheet" onClick={onClose}>
      <div class="sheet-inner" onClick={(e) => e.stopPropagation()}>
        <header><b>{title}</b><button class="btn" onClick={onClose} data-testid="close-sheet">Close</button></header>
        <div class="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/** A row of cards: selectable ones can be tapped to pick; with `onOpen`, a tap opens the card instead. */
export function CardList({ s, ids, selectable, selected, onPick, onOpen }: {
  s: GameState; ids: ObjectId[]; selectable: Set<ObjectId>; selected: Set<ObjectId>;
  onPick: (id: ObjectId) => void; onOpen?: (id: ObjectId) => void;
}) {
  return (
    <div class="cardlist">
      {ids.map((id) => (
        <button key={id} class={`card ${selectable.has(id) ? 'pickable' : onOpen ? '' : 'no'} ${selected.has(id) ? 'picked' : ''}`}
          onClick={() => (onOpen ? onOpen(id) : selectable.has(id) && onPick(id))} data-testid={`list-${nameOf(s, id)}`}>
          <img src={imageOf(s, id)} alt={nameOf(s, id)} />
        </button>
      ))}
    </div>
  );
}
