/**
 * The full card view (PRD, "Long-press a card"): the large image, its text and current values, and
 * what the player holding the device can do with it now: Cast or Play, each ability, greyed with
 * the reason when it isn't legal. Rulings below.
 */
import { pool } from '../cards/pool';
import { characteristics } from '../engine/characteristics';
import { whyNotActivate, whyNotCast, whyNotPlay } from '../engine/engine';
import type { GameState, ObjectId, PlayerId } from '../engine/types';
import { imageOf, nameOf, ptBreakdown } from './model';

export type CardAction = { kind: 'cast' } | { kind: 'play' } | { kind: 'activate'; ability: number };

export function CardView({ s, id, actor, onAction, onClose }: {
  s: GameState; id: ObjectId;
  /** The player who may act from this view now (holding the device with priority), or null. */
  actor: PlayerId | null;
  onAction: (a: CardAction) => void; onClose: () => void;
}) {
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
        <img class="full-img" src={imageOf(s, id)} alt={c.name} />
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
