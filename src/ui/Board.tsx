/**
 * The portrait board (PRD, "Board layout"): from the top, the opponent's stats bar, lands strip and
 * battlefield; the centre band (turn line, or the stack row); then the same for the player the board
 * faces, and their hand. Components only lay out the view model; taps go to the game screen.
 */
import type { ComponentChildren } from 'preact';
import { useRef, useState } from 'preact/hooks';
import type { GameState, ObjectId, PlayerId, Target } from '../engine/types';
import { other } from '../engine/types';
import { battlefieldRow, imageOf, landsStrip, stackItems, stats, targetRings, turnLine, type Permanent } from './model';

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

function StatsBar({ s, p, mine, handHidden, marks, rings, h }: {
  s: GameState; p: PlayerId; mine: boolean; handHidden: boolean; marks: Marks;
  rings: ReturnType<typeof targetRings>; h: BoardHandlers;
}) {
  const st = stats(s, p);
  const pick = marks.selectable.has(p);
  return (
    <div class={`stats ${pick ? 'pickable' : ''} ${marks.selected.has(p) ? 'picked' : ''}`} data-target={p} data-testid={`stats-${p}`} onClick={() => pick && h.onPlayer(p)}>
      <span class={`name ${p}`}>{st.name}</span>
      <span class="life" data-testid={`life-${p}`}>♥ {st.life}</span>
      <button class={`handchip ${mine ? 'mine' : ''}`} onClick={(e) => { if (mine) { e.stopPropagation(); h.onHandChip(); } }} data-testid={`hand-${p}`}>
        Hand <b>{st.hand}</b>{mine && handHidden ? ' · hidden' : ''}
      </button>
      <Rings list={rings.get(p)} />
      <span class="icons">
        <span class="ic">Lib <b>{st.library}</b></span>
        <button class="ic" onClick={(e) => { e.stopPropagation(); h.onPile(p, 'graveyard'); }} data-testid={`grave-${p}`}>Grave <b>{st.graveyard}</b>{st.lessons ? ` L${st.lessons}` : ''}</button>
        <button class={`ic ${st.exileUsable && mine ? 'glow' : ''}`} onClick={(e) => { e.stopPropagation(); h.onPile(p, 'exile'); }} data-testid={`exile-${p}`}>Exile <b>{st.exile}</b></button>
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
  const cls = ['card', perm.tapped ? 'tapped' : '', pick ? 'pickable' : '', marks.selected.has(perm.id) ? 'picked' : '',
    marks.glow.has(perm.id) ? 'glow' : '', marks.paying.has(perm.id) ? 'paying' : ''].filter(Boolean).join(' ');
  return (
    <div class={cls} data-target={perm.id} data-testid={`perm-${perm.name}`} onClick={() => h.onCard(perm.id)}>
      {perm.auras.map((a, i) => <img key={a.id} class={`aura ${a.controller}`} style={{ top: `${-10 - i * 8}px` }} src={a.image} alt="" onClick={(e) => { e.stopPropagation(); h.onCard(a.id); }} />)}
      <img src={perm.image} alt={perm.name} draggable={false} />
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
  const drag = useRef<{ id: ObjectId; x: number; y: number; lifted: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ id: ObjectId; x: number; y: number } | null>(null);
  const down = (id: ObjectId) => (e: PointerEvent) => { drag.current = { id, x: e.clientX, y: e.clientY, lifted: false }; };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.lifted && Math.abs(e.clientY - d.y) > 14 && Math.abs(e.clientY - d.y) > Math.abs(e.clientX - d.x)) {
      d.lifted = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      onLift(true);
    }
    if (d.lifted) setGhost({ id: d.id, x: e.clientX, y: e.clientY });
  };
  const up = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.lifted) { if (Math.abs(e.clientX - d.x) < 8) h.onCard(d.id); return; }
    setGhost(null);
    onLift(false);
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-target]');
    const t = el?.getAttribute('data-target');
    h.onDrop(d.id, t && t !== 'cast' ? t : null);
  };
  const cancel = () => { if (drag.current?.lifted) { setGhost(null); onLift(false); } drag.current = null; };
  const ids = s.zones[`${p}.hand`];
  // Cards overlap just enough to fit the width (80 px each at this height), keeping at least 34 px of each in view.
  const overlap = ids.length > 1 ? Math.min(46, Math.max(4, (ids.length * 80 - (window.innerWidth - 20)) / (ids.length - 1))) : 0;
  return (
    <div class="hand" data-testid="hand" onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
      {ids.map((id) => {
        const pick = marks.selectable.has(id);
        const cls = ['card', marks.glow.has(id) ? 'can' : 'no', pick ? 'pickable' : '', marks.selected.has(id) ? 'picked' : '', ghost?.id === id ? 'lifting' : ''].filter(Boolean).join(' ');
        return (
          <div key={id} class={cls} style={{ marginLeft: `${-overlap}px` }} data-testid={`handcard-${s.setup.cards[s.objects[id]!.card]!.name}`} onPointerDown={down(id)}>
            <img src={imageOf(s, id)} alt={s.setup.cards[s.objects[id]!.card]!.name} draggable={false} />
          </div>
        );
      })}
      {ghost && <img class="ghost" src={imageOf(s, ghost.id)} style={{ left: `${ghost.x - 40}px`, top: `${ghost.y - 112}px` }} alt="" />}
    </div>
  );
}

export function Board({ s, bottom, handShown, handFolded, marks, h, band }: {
  s: GameState; bottom: PlayerId; handShown: boolean; handFolded: boolean; marks: Marks; h: BoardHandlers;
  /** Replaces the band's contents (ordering triggers). */
  band?: ComponentChildren;
}) {
  const top = other(bottom);
  const rings = targetRings(s);
  const [lifted, setLifted] = useState(false);
  return (
    <div class={`board facing-${bottom}`} key={bottom}>
      <div class={`half opp ${top}`}>
        <StatsBar s={s} p={top} mine={false} handHidden marks={marks} rings={rings} h={h} />
        <LandsStrip s={s} p={top} marks={marks} h={h} />
        <Field s={s} p={top} marks={marks} rings={rings} h={h} />
      </div>
      <Band s={s} lit={lifted} marks={marks} h={h}>{band}</Band>
      <div class={`half me ${bottom}`}>
        <Field s={s} p={bottom} marks={marks} rings={rings} h={h} />
        <LandsStrip s={s} p={bottom} marks={marks} h={h} />
        <StatsBar s={s} p={bottom} mine handHidden={!handShown || handFolded} marks={marks} rings={rings} h={h} />
      </div>
      {handShown && !handFolded ? <Hand s={s} p={bottom} marks={marks} h={h} onLift={setLifted} /> : <div class="hand folded" data-testid="hand-folded" />}
    </div>
  );
}
