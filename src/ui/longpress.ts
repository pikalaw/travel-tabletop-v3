/**
 * Long press on any card opens its full view (as in v2), wherever the card is: in play, attached,
 * a lands chip, the stack, a hand, a pile or a prompt's list. A tap keeps its meaning where it is
 * (pick an attacker, a target), so the long press is the one gesture that always shows the card.
 * Cards mark themselves with `data-card="<object id>"`.
 */
const HOLD_MS = 450;
const MOVE_PX = 10;

let long = false;

/** Whether the press in progress has become a long press (a hand's drag ignores it then). */
export const pressIsLong = () => long;

export function installLongPress(root: HTMLElement, open: (id: string) => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let start: { x: number; y: number } | null = null;
  let swallow = false;

  const down = (e: PointerEvent) => {
    clearTimeout(timer);
    long = false;
    swallow = false;
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-card]');
    if (!el || (e.pointerType === 'mouse' && e.button !== 0)) { start = null; return; }
    start = { x: e.clientX, y: e.clientY };
    const id = el.dataset.card!;
    timer = setTimeout(() => { long = true; swallow = true; navigator.vibrate?.(15); open(id); }, HOLD_MS);
  };
  const move = (e: PointerEvent) => {
    if (start && !long && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_PX) { clearTimeout(timer); start = null; }
  };
  const up = () => { clearTimeout(timer); start = null; setTimeout(() => { long = false; }, 0); };
  // The tap that ends a long press is not a tap.
  const click = (e: MouseEvent) => { if (swallow) { swallow = false; e.preventDefault(); e.stopPropagation(); } };
  const menu = (e: Event) => { if ((e.target as Element | null)?.closest('[data-card]')) e.preventDefault(); };

  root.addEventListener('pointerdown', down, true);
  root.addEventListener('pointermove', move, true);
  root.addEventListener('pointerup', up, true);
  root.addEventListener('pointercancel', up, true);
  root.addEventListener('click', click, true);
  root.addEventListener('contextmenu', menu, true);
  return () => {
    clearTimeout(timer);
    root.removeEventListener('pointerdown', down, true);
    root.removeEventListener('pointermove', move, true);
    root.removeEventListener('pointerup', up, true);
    root.removeEventListener('pointercancel', up, true);
    root.removeEventListener('click', click, true);
    root.removeEventListener('contextmenu', menu, true);
  };
}
