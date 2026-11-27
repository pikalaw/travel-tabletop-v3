/**
 * The full card view (PRD, "Long-press a card"): the large image, its text and current values, and
 * what the player holding the device can do with it now: Cast or Play, each ability, greyed with
 * the reason when it isn't legal. Rulings below.
 */
import { useRef, useState } from 'preact/hooks';
import { pool } from '../cards/pool';
import { characteristics } from '../engine/characteristics';
import { whyNotActivate, whyNotCast, whyNotPlay } from '../engine/engine';
import type { GameState, ObjectId, PlayerId } from '../engine/types';
import { imageOf, nameOf, ptBreakdown } from './model';

export type CardAction = { kind: 'cast' } | { kind: 'play' } | { kind: 'activate'; ability: number };

/** How far a finger moves before a swipe counts, and under which a press is a tap (as in v2). */
const SWIPE_PX = 50;

export function CardView({ s, id, actor, siblings, onAction, onNavigate, onClose }: {
  s: GameState; id: ObjectId;
  /** The player who may act from this view now (holding the device with priority), or null. */
  actor: PlayerId | null;
  /** The cards a sideways swipe steps through, this one among them. */
  siblings: ObjectId[];
  onAction: (a: CardAction) => void; onNavigate: (id: ObjectId) => void; onClose: () => void;
}) {
  // Swipes on the picture (v2's full view): up casts or plays it, down closes, sideways steps to
  // the previous or next card. The text below scrolls as usual.
  const start = useRef<{ x: number; y: number } | null>(null);
  const [shift, setShift] = useState<{ x: number; y: number } | null>(null);
  const o = s.objects[id];
  if (!o) return null;
  const card = pool.cards[o.card];
  const printed = s.setup.cards[o.card]!;
  const c = characteristics(s, o);
  const onStack = o.zone === 'stack';
  const ability = o.ability;
  const script = printed.script;
  const actions: { label: string; why: string | null; act: CardAction }[] = [];
  if (actor && !onStack) {
    if (c.types.includes('Land') && o.zone !== 'battlefield') actions.push({ label: 'Play', why: whyNotPlay(s, actor, id), act: { kind: 'play' } });
    else if (o.zone !== 'battlefield') actions.push({ label: 'Cast', why: whyNotCast(s, actor, id), act: { kind: 'cast' } });
    (script?.activated ?? []).forEach((a, i) => {
      if (a.mana) return; // mana is paid automatically
      if (a.zone ? !o.zone.endsWith(`.${a.zone}`) : o.zone !== 'battlefield') return; // where it works from
      actions.push({ label: a.text, why: whyNotActivate(s, actor, id, i), act: { kind: 'activate', ability: i } });
    });
  }
  const rulings = card ? pool.rulings[card.oracleId] ?? [] : [];
  const abilityText = ability ? (ability.kind === 'activated' ? script?.activated?.[ability.index]?.text : script?.triggered?.[ability.index]?.text) : undefined;
  const attached = s.zones.battlefield.filter((a) => s.objects[a]!.attachedTo === id);
  return (
    <div class="sheet full" data-testid="card-view" onClick={onClose}>
      <div class="full-inner" onClick={(e) => e.stopPropagation()}>
        <img class="full-img" src={imageOf(s, id)} alt={c.name} draggable={false} data-testid="full-img"
          style={shift ? { transform: `translate(${shift.x}px, ${shift.y}px)`, transition: 'none' } : undefined}
          onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY }; (e.currentTarget as Element).setPointerCapture?.(e.pointerId); }}
          onPointerMove={(e) => { const s0 = start.current; if (s0) setShift({ x: e.clientX - s0.x, y: e.clientY - s0.y }); }}
          onPointerCancel={() => { start.current = null; setShift(null); }}
          onPointerUp={(e) => {
            const s0 = start.current;
            start.current = null;
            setShift(null);
            if (!s0) return;
            const dx = e.clientX - s0.x, dy = e.clientY - s0.y;
            if (-dy > SWIPE_PX && -dy > 1.5 * Math.abs(dx)) {
              const main = actions.find((a) => a.act.kind !== 'activate');
              if (main && !main.why) onAction(main.act);
            } else if (dy > SWIPE_PX && dy > 1.5 * Math.abs(dx)) onClose();
            else if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) >= Math.abs(dy)) {
              const i = siblings.indexOf(id);
              const next = siblings[i + (dx < 0 ? 1 : -1)];
              if (i >= 0 && next) onNavigate(next);
            }
          }} />
        {siblings.length > 1 && <p class="dim nav-hint">{siblings.indexOf(id) + 1} of {siblings.length} · swipe sideways for the {siblings.indexOf(id) > 0 ? 'previous or ' : ''}next</p>}
        <div class="full-text">
          <h2>{ability ? `${ability.sourceName}'s ability` : c.name}</h2>
          {abilityText && <p class="ability-text">{abilityText}</p>}
          {!ability && <p class="dim">{[...c.supertypes, ...c.types].join(' ')}{c.subtypes.length ? ` — ${c.subtypes.join(' ')}` : ''}</p>}
          {c.types.includes('Creature') && (
            <p data-testid="pt-breakdown">
              <b>{o.zone === 'battlefield' ? ptBreakdown(s, id) : `${c.power}/${c.toughness}`}</b>
              {o.damage > 0 && <span class="dmg"> · {o.damage} damage marked</span>}
            </p>
          )}
          {Object.entries(o.counters).filter(([, n]) => n > 0).map(([k, n]) => <p key={k} class="dim">{n} {k} counter{n > 1 ? 's' : ''}</p>)}
          {c.abilitiesRemoved && <p class="dim">It has lost all abilities.</p>}
          {c.keywords.length > 0 && <p class="dim">{c.keywords.join(', ')}</p>}
          {!ability && <p class="oracle">{printed.text}</p>}
          {attached.length > 0 && <p class="dim">Attached: {attached.map((a) => nameOf(s, a)).join(', ')}</p>}
          {o.targets && o.targets.flat().length > 0 && <p class="dim">Targets: {o.targets.flat().map((t) => (t === 'p1' || t === 'p2' ? s.setup.players[t].name : s.objects[t] ? nameOf(s, t) : 'gone')).join(', ')}</p>}
          <div class="actions">
            {actions.map((a, i) => (
              <button key={i} class={`btn ${a.why ? 'off' : 'primary'}`} disabled={!!a.why} onClick={() => onAction(a.act)} data-testid={`action-${a.act.kind}`}>
                {a.label}{a.why && <span class="why">{a.why}</span>}
              </button>
            ))}
          </div>
          {rulings.length > 0 && (
            <details class="rulings">
              <summary>Rulings ({rulings.length})</summary>
              {rulings.map((r, i) => <p key={i}><span class="dim">{r.date}</span> {r.text}</p>)}
            </details>
          )}
          <button class="btn close" onClick={onClose} data-testid="close-view">Close</button>
        </div>
      </div>
    </div>
  );
}
