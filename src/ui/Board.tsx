/**
 * The portrait board (PRD, "Board layout"): from the top, the opponent's stats bar, lands strip and
 * battlefield; the centre band (turn line, or the stack row); then the same for the player the board
 * faces, and their hand. Components only lay out the view model; taps go to the game screen.
 */
import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { GameState, ObjectId, PlayerId, Target } from '../engine/types';
import { other } from '../engine/types';
import { stillPassing, type PassAhead } from '../host/controller';
import { battlefieldRow, imageOf, landsStrip, stackItems, stats, targetRings, turnLine, type Permanent, type Pulse } from './model';

/** What the board highlights, and where taps go. */
export interface Marks {
  /** Legal choices for the current question: outlined, and a tap picks them. */
  selectable: Set<Target>;
  selected: Set<Target>;
  /** Legal moves for the player holding the device: castable cards, abilities, attackers. */
  glow: Set<ObjectId>;
  /** Sources the payment will tap, during the confirm step. */
  paying: Set<ObjectId>;
  /** Blocks being declared: blocker → attacker. */
  blocks: Map<ObjectId, ObjectId>;
  /** Cards new in the shown hand since the device last left its player. */
  fresh: Set<ObjectId>;
  /** What the step being played back changed: these pulse, with a label. */
  pulse: Map<Target, Pulse>;
}

export interface BoardHandlers {
  onCard: (id: ObjectId) => void;
  onPlayer: (p: PlayerId) => void;
  onPile: (p: PlayerId, pile: 'graveyard' | 'exile') => void;
  onHandChip: () => void;
  /** A card dragged out of the hand was dropped: on a target, or elsewhere. */
  onDrop: (id: ObjectId, at: Target | null) => void;
}

const COLOR_CLASS = (c: string) => (c === 'C' ? 'C' : c);

function Rings({ list }: { list: { n: number; controller: PlayerId }[] | undefined }) {
  if (!list?.length) return null;
  return <span class="rings">{list.map((r) => <span key={r.n} class={`ring ${r.controller}`}>◎{r.n}</span>)}</span>;
}

function StatsBar({ s, p, mine, handHidden, marks, rings, h, ahead }: {
  s: GameState; p: PlayerId; mine: boolean; handHidden: boolean; marks: Marks; ahead: PassAhead | undefined;
  rings: ReturnType<typeof targetRings>; h: BoardHandlers;
}) {
  const st = stats(s, p);
  const pick = marks.selectable.has(p);
  const pulse = marks.pulse.get(p);
  return (
    <div class={`stats ${pick ? 'pickable' : ''} ${marks.selected.has(p) ? 'picked' : ''}`} data-target={p} data-testid={`stats-${p}`} onClick={() => pick && h.onPlayer(p)}>
      <span class={`name ${p}`}>{st.name}</span>
      <span class={`life ${pulse ? `pulse ${pulse.kind}` : ''}`} data-testid={`life-${p}`}>♥ {st.life}{pulse && <span class={`float ${pulse.kind}`}>{pulse.label}</span>}</span>
      <button class={`handchip ${mine ? 'mine' : ''}`} data-tip={mine ? 'Hide or show your hand.' : 'Cards in hand. Only its owner sees them.'} onClick={(e) => { if (mine) { e.stopPropagation(); h.onHandChip(); } }} data-testid={`hand-${p}`}>
        Hand <b>{st.hand}</b>{mine && handHidden ? ' · hidden' : ''}
      </button>
      <Rings list={rings.get(p)} />
      {stillPassing(s, ahead) && <span class="passing" data-testid={`passing-${p}`}>passes {ahead!.until === 'combat' ? 'this combat' : 'this turn'}</span>}
      <span class="icons">
        <span class="ic" data-tip="Cards left in the library.">Lib <b>{st.library}</b></span>
        <button class="ic" data-tip="Open the graveyard. L counts Lesson cards." onClick={(e) => { e.stopPropagation(); h.onPile(p, 'graveyard'); }} data-testid={`grave-${p}`}>Grave <b>{st.graveyard}</b>{st.lessons ? ` L${st.lessons}` : ''}</button>
        <button class={`ic ${st.exileUsable && mine ? 'glow' : ''}`} data-tip="Open exile. It glows when you can cast or play a card from it." onClick={(e) => { e.stopPropagation(); h.onPile(p, 'exile'); }} data-testid={`exile-${p}`}>Exile <b>{st.exile}</b></button>
      </span>
    </div>
  );
}

function LandsStrip({ s, p, marks, h }: { s: GameState; p: PlayerId; marks: Marks; h: BoardHandlers }) {
  const { chips, open, floating } = landsStrip(s, p);
  return (
    <div class="lands" data-testid={`lands-${p}`}>
      <div class="chips">
        {chips.map((c) => {
          const pick = c.ids.find((id) => marks.selectable.has(id));
          const paying = c.ids.some((id) => marks.paying.has(id));
          return (
            <button key={c.name} class={`chip ${pick ? 'pickable' : ''} ${paying ? 'paying' : ''}`} data-target={pick} onClick={() => h.onCard(pick ?? c.ids[0]!)}>
              {c.pips.map((x, i) => <span key={i} class={`pip ${COLOR_CLASS(x.color)} ${x.tapped ? 'off' : ''}`} />)}
              <span>{c.name}{c.ids.length > 1 ? ` ×${c.ids.length}` : ''}</span>
            </button>
          );
        })}
      </div>
      <span class="avail">
        {open.length ? 'open' : ''}{open.map((c, i) => <span key={i} class={`pip ${COLOR_CLASS(c)}`} />)}
        {floating.map((c, i) => <span key={`f${i}`} class={`pip float ${COLOR_CLASS(c)}`} />)}
      </span>
    </div>
  );
}

function CardTile({ s, perm, marks, rings, h, attackerOf }: {
  s: GameState; perm: Permanent; marks: Marks; rings: ReturnType<typeof targetRings>; h: BoardHandlers; attackerOf?: string;
}) {
  const pick = marks.selectable.has(perm.id);
  const pulse = marks.pulse.get(perm.id);
  const cls = ['card', pulse ? `pulse ${pulse.kind}` : '', perm.tapped ? 'tapped' : '', pick ? 'pickable' : '', marks.selected.has(perm.id) ? 'picked' : '',
    marks.glow.has(perm.id) ? 'glow' : '', marks.paying.has(perm.id) ? 'paying' : ''].filter(Boolean).join(' ');
  return (
    <div class={cls} data-target={perm.id} data-testid={`perm-${perm.name}`} onClick={() => h.onCard(perm.id)}>
      {perm.auras.map((a, i) => <img key={a.id} class={`aura ${a.controller}`} style={{ top: `${-10 - i * 8}px` }} src={a.image} alt="" onClick={(e) => { e.stopPropagation(); h.onCard(a.id); }} />)}
      <img src={perm.image} alt={perm.name} draggable={false} />
      {perm.sick && !perm.attacking && <span class="sick" title="Summoning sick: it can't attack or tap yet">zZ</span>}
      {perm.attacking && <span class="atk">ATK</span>}
      {perm.blocking && <span class="atk blk">BLK</span>}
      {attackerOf && <span class="atk blk">→ {attackerOf}</span>}
      {perm.counters.length > 0 && <span class="counters">{perm.counters.map(([k, n]) => <span key={k}>{k === '+1/+1' ? `+${n}` : `${n} ${k}`}</span>)}</span>}
      {perm.attachedTo && <span class="equipped">on {perm.attachedTo}</span>}
      {perm.pt && (
        <span class={`pt ${perm.pt.up ? 'up' : ''} ${perm.pt.down ? 'down' : ''}`}>
          {perm.pt.power}/{perm.pt.toughness}{perm.damage > 0 && <span class="dmg"> −{perm.damage}</span>}
        </span>
      )}
      <Rings list={rings.get(perm.id)} />
      {pulse && <span class={`float ${pulse.kind}`} data-testid="pulse">{pulse.label}</span>}
      <span class="sr">{s.setup.players[s.objects[perm.id]!.controller].name}</span>
    </div>
  );
}

function Field({ s, p, marks, rings, h }: { s: GameState; p: PlayerId; marks: Marks; rings: ReturnType<typeof targetRings>; h: BoardHandlers }) {
  const row = battlefieldRow(s, p);
  const names = new Map(row.map((x) => [x.id, x.name]));
  return (
    <div class="field" style={{ '--n': Math.max(row.length, 3) }} data-testid={`field-${p}`}>
      {row.map((perm) => {
        const a = marks.blocks.get(perm.id);
        const attackerName = a ? (names.get(a) ?? battlefieldRow(s, other(p)).find((x) => x.id === a)?.name) : undefined;
        return <CardTile key={perm.id} s={s} perm={perm} marks={marks} rings={rings} h={h} {...(attackerName ? { attackerOf: attackerName } : {})} />;
      })}
    </div>
  );
}

/** The centre band: a thin turn line, or the stack row with the item that resolves first at the left. */
function Band({ s, lit, marks, h, children }: { s: GameState; lit: boolean; marks: Marks; h: BoardHandlers; children?: ComponentChildren }) {
  const items = stackItems(s);
  if (children) return <div class="band tall">{children}</div>;
  if (!items.length) {
    return (
      <div class={`band thin ${lit ? 'lit' : ''}`} data-target="cast" data-testid="band">
        <span class={`emptyturn ${s.active}`}>{turnLine(s)}</span>
        {lit && <span class="castzone">Cast</span>}
      </div>
    );
  }
  return (
    <div class={`band tall ${lit ? 'lit' : ''}`} data-target="cast" data-testid="band">
      <div class="bandhead"><span class={`turn ${s.active}`}>{turnLine(s, true)}</span>{lit && <span class="castzone">Cast</span>}<span class="stackn">Stack {items.length}</span></div>
      <div class="srow">
        {items.map((it) => {
          const pick = marks.selectable.has(it.id);
          return (
            <div key={it.id} class={`sitem ${it.n === 1 ? 'top' : ''} ${pick ? 'pickable' : ''} ${marks.selected.has(it.id) ? 'picked' : ''}`} data-target={it.id} data-testid={`stack-${it.n}`} onClick={() => h.onCard(it.id)}>
              <img src={it.image} alt="" />
              <span class="st">
                {it.n === 1 && <span class="first">resolves first</span>}
                <b>{it.name}</b>
                {it.text && <span class="abil">ability: {it.text.length > 48 ? `${it.text.slice(0, 46)}…` : it.text}</span>}
                <span class={`by ${it.controller}`}>{s.setup.players[it.controller].name}</span>
                {it.targetsGone ? <span class="gone">target gone: does nothing</span> : it.targets && <span>target {it.targets}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The hand: a sideways drag scrolls; a drag up or down lifts a card to cast it; a tap opens it. */
function Hand({ s, p, marks, h, onLift }: { s: GameState; p: PlayerId; marks: Marks; h: BoardHandlers; onLift: (lifted: boolean) => void }) {
  // The pointer's last press in the hand: `down` while pressed, `lifted` once it became a drag.
  const drag = useRef<{ id: ObjectId; x: number; y: number; lifted: boolean; down: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ id: ObjectId; x: number; y: number } | null>(null);
  const down = (id: ObjectId) => (e: PointerEvent) => { drag.current = { id, x: e.clientX, y: e.clientY, lifted: false, down: true }; };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d?.down) return;
    if (!d.lifted && Math.abs(e.clientY - d.y) > 14 && Math.abs(e.clientY - d.y) > Math.abs(e.clientX - d.x)) {
      d.lifted = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      onLift(true);
    }
    if (d.lifted) setGhost({ id: d.id, x: e.clientX, y: e.clientY });
  };
  const up = (e: PointerEvent) => {
    const d = drag.current;
    if (!d?.down) return;
    d.down = false;
    if (!d.lifted) return; // a tap: handled on its click (below)
    setGhost(null);
    onLift(false);
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-target]');
    const t = el?.getAttribute('data-target');
    h.onDrop(d.id, t && t !== 'cast' ? t : null);
  };
  // A tap opens the card on its click, not on pointerup: opened earlier, the full view would be under
  // the finger when the browser delivers the tap's click, which would then close it or press Cast.
  const tap = (id: ObjectId) => (e: MouseEvent) => {
    const d = drag.current;
    if (d && d.id === id && !d.lifted && Math.abs(e.clientX - d.x) < 8) h.onCard(id);
  };
  const cancel = () => { if (drag.current?.lifted) { setGhost(null); onLift(false); } drag.current = null; };
  const ids = s.zones[`${p}.hand`];
  // Cards overlap just enough to fit the width (80 px each at this height), keeping at least 34 px of each in view.
  const overlap = ids.length > 1 ? Math.min(46, Math.max(4, (ids.length * 80 - (window.innerWidth - 20)) / (ids.length - 1))) : 0;
  return (
    <div class="hand" data-testid="hand" onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
      {ids.map((id) => {
        const pick = marks.selectable.has(id);
        const cls = ['card', marks.fresh.has(id) ? 'fresh' : '', marks.glow.has(id) ? 'can' : 'no', pick ? 'pickable' : '', marks.selected.has(id) ? 'picked' : '', ghost?.id === id ? 'lifting' : ''].filter(Boolean).join(' ');
        return (
          <div key={id} class={cls} style={{ marginLeft: `${-overlap}px` }} data-testid={`handcard-${s.setup.cards[s.objects[id]!.card]!.name}`} onPointerDown={down(id)} onClick={tap(id)}>
            <img src={imageOf(s, id)} alt={s.setup.cards[s.objects[id]!.card]!.name} draggable={false} />
            {marks.fresh.has(id) && <span class="new-tab">NEW</span>}
          </div>
        );
      })}
      {ghost && <img class="ghost" src={imageOf(s, ghost.id)} style={{ left: `${ghost.x - 40}px`, top: `${ghost.y - 112}px` }} alt="" />}
    </div>
  );
}

/**
 * One arrow at a time (PRD, "Showing targets"): from a stack item to each of its targets, for the
 * top item by default or the item last tapped. Positions come from the laid-out board.
 */
function Arrows({ s, from, root }: { s: GameState; from: ObjectId | null; root: { current: HTMLDivElement | null } }) {
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
  const item = from && s.zones.stack.includes(from) ? from : s.zones.stack[s.zones.stack.length - 1];
  const targets = item ? (s.objects[item]!.targets ?? []).flat() : [];
  const key = `${s.seq}:${item}:${targets.join()}`;
  const measure = useRef<() => void>(() => undefined);
  measure.current = () => {
    const el = root.current;
    if (!el || !item || !targets.length) { setLines((l) => (l.length ? [] : l)); return; }
    const box = el.getBoundingClientRect();
    const at = (id: string) => el.querySelector(`[data-target="${id}"]`)?.getBoundingClientRect();
    const a = at(item);
    if (!a) { setLines([]); return; }
    setLines(targets.flatMap((t) => {
      const b = at(t);
      if (!b) return [];
      const down = b.top > a.bottom;
      return [{ x1: a.left + a.width / 2 - box.left, y1: (down ? a.bottom : a.top) - box.top, x2: b.left + b.width / 2 - box.left, y2: (down ? b.top + Math.min(12, b.height / 2) : b.bottom - Math.min(12, b.height / 2)) - box.top }];
    }));
  };
  useLayoutEffect(() => measure.current(), [key]);
  // Card images load after the first layout and move things, and the flip animation transforms the board: measure again then, and on resize.
  useLayoutEffect(() => {
    const el = root.current;
    const again = () => measure.current();
    el?.addEventListener('load', again, true);
    el?.addEventListener('animationend', again);
    window.addEventListener('resize', again);
    return () => { el?.removeEventListener('load', again, true); el?.removeEventListener('animationend', again); window.removeEventListener('resize', again); };
  }, []);
  if (!lines.length || !item) return null;
  return (
    <svg class={`arrow ${s.objects[item]!.controller}`} data-testid="arrow">
      <defs><marker id="head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" /></marker></defs>
      {lines.map((l, i) => <line key={i} {...l} marker-end="url(#head)" />)}
    </svg>
  );
}

export function Board({ s, ahead, bottom, handShown, handFolded, marks, h: handlers, band }: {
  s: GameState; ahead: Partial<Record<PlayerId, PassAhead>>; bottom: PlayerId; handShown: boolean; handFolded: boolean; marks: Marks; h: BoardHandlers;
  /** Replaces the band's contents (ordering triggers). */
  band?: ComponentChildren;
}) {
  const top = other(bottom);
  const rings = targetRings(s);
  const [lifted, setLifted] = useState(false);
  const [arrowFrom, setArrowFrom] = useState<ObjectId | null>(null);
  const root = useRef<HTMLDivElement>(null);
  // Tapping a stack item also points the arrow at its targets.
  const h: BoardHandlers = { ...handlers, onCard: (id) => { if (s.zones.stack.includes(id)) setArrowFrom(id); handlers.onCard(id); } };
  return (
    <div class={`board facing-${bottom}`} key={bottom} ref={root}>
      <div class={`half opp ${top}`}>
        <StatsBar s={s} p={top} mine={false} handHidden marks={marks} rings={rings} h={h} ahead={ahead[top]} />
        <LandsStrip s={s} p={top} marks={marks} h={h} />
        <Field s={s} p={top} marks={marks} rings={rings} h={h} />
      </div>
      <Band s={s} lit={lifted} marks={marks} h={h}>{band}</Band>
      <div class={`half me ${bottom}`}>
        <Field s={s} p={bottom} marks={marks} rings={rings} h={h} />
        <LandsStrip s={s} p={bottom} marks={marks} h={h} />
        <StatsBar s={s} p={bottom} mine handHidden={!handShown || handFolded} marks={marks} rings={rings} h={h} ahead={ahead[bottom]} />
      </div>
      {handShown && !handFolded ? <Hand s={s} p={bottom} marks={marks} h={h} onLift={setLifted} /> : <div class="hand folded" data-testid="hand-folded" />}
      <Arrows s={s} from={arrowFrom} root={root} />
    </div>
  );
}
