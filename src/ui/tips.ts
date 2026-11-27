/**
 * Long-press tips (v2's TipButton): holding a finger on anything with `data-tip` shows its text in
 * a bubble; lifting hides it, and the held button is not pressed. A tap still presses it as usual.
 */
const HOLD_MS = 450;
const MOVE_PX = 10;

export function installTips(root: Document = document): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let start: { x: number; y: number; el: HTMLElement } | null = null;
  let bubble: HTMLElement | null = null;
  /** The press became a tip: swallow the click that would otherwise follow it. */
  let swallow = false;

  const hide = () => { clearTimeout(timer); bubble?.remove(); bubble = null; start = null; };
  const show = (el: HTMLElement) => {
    bubble = root.createElement('div');
    bubble.className = 'tip-bubble';
    bubble.setAttribute('role', 'tooltip');
    bubble.dataset.testid = 'tip';
    bubble.textContent = el.dataset.tip ?? '';
    root.body.appendChild(bubble);
    const r = el.getBoundingClientRect(), b = bubble.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - b.width - 8, r.left + r.width / 2 - b.width / 2));
    const top = r.top - b.height - 8 >= 8 ? r.top - b.height - 8 : r.bottom + 8;
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
    swallow = true;
    navigator.vibrate?.(15);
  };

  const down = (e: PointerEvent) => {
    hide();
    swallow = false;
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-tip]');
    if (!el || (e.pointerType === 'mouse' && e.button !== 0)) return;
    start = { x: e.clientX, y: e.clientY, el };
    timer = setTimeout(() => { if (start) show(start.el); }, HOLD_MS);
  };
  const move = (e: PointerEvent) => {
    if (start && !bubble && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_PX) hide();
  };
  const click = (e: MouseEvent) => {
    if (!swallow) return;
    swallow = false;
    e.preventDefault();
    e.stopPropagation();
  };
  const menu = (e: Event) => { if ((e.target as Element | null)?.closest('[data-tip]')) e.preventDefault(); };

  root.addEventListener('pointerdown', down, true);
  root.addEventListener('pointermove', move, true);
  root.addEventListener('pointerup', hide, true);
  root.addEventListener('pointercancel', hide, true);
  root.addEventListener('click', click, true);
  root.addEventListener('contextmenu', menu, true);
  return () => {
    hide();
    root.removeEventListener('pointerdown', down, true);
    root.removeEventListener('pointermove', move, true);
    root.removeEventListener('pointerup', hide, true);
    root.removeEventListener('pointercancel', hide, true);
    root.removeEventListener('click', click, true);
    root.removeEventListener('contextmenu', menu, true);
  };
}
