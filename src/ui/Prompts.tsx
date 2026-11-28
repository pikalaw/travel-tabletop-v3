/**
 * The prompt panel: the question the engine is asking (a decision), or the next thing a cast or
 * activation in progress needs (an intent). Effects ask through a few general decisions (pick,
 * arrange, may, pay or else, choose a colour), so a new mechanic needs no new prompt here.
 */
import type { Dispatch, StateUpdater } from 'preact/hooks';
import { characteristics } from '../engine/characteristics';
import { triggerTargetOptions } from '../engine/engine';
import { triggeredAbility } from '../engine/triggers';
import type { Choice, Color, Decision, GameState, ObjectId, PlayerId, Target } from '../engine/types';
import { other } from '../engine/types';
import type { Intent, Need } from './flow';
import { formatCost, nameOf, playerName } from './model';
import { CardList } from './Sheets';

/** The answer being built for the engine's decision, much of it chosen on the board. */
export interface Answering {
  chosen: ObjectId[];
  toggleChosen: (id: ObjectId, max: number) => void;
  atk: Set<ObjectId>;
  blocks: Map<ObjectId, ObjectId>;
  armed: ObjectId | null;
  split: Record<string, number>;
  setSplit: Dispatch<StateUpdater<Record<string, number>>>;
  order: number[];
  picking: Target[];
  onPick: (t: Target) => void;
}

/** Words for what the acting player must decide, for the hand-off bar. */
export function asking(s: GameState): string {
  const d = s.decision;
  if (!d) return '';
  switch (d.kind) {
    case 'priority': return s.events[s.events.length - 1]?.text ?? 'your move';
    case 'mulligan': return 'keep or mulligan';
    case 'bottom': return `put ${d.count} card${d.count > 1 ? 's' : ''} on the bottom`;
    case 'attackers': return 'declare attackers';
    case 'blockers': return 'declare blockers';
    case 'damage': return `divide ${nameOf(s, d.attacker)}'s damage`;
    case 'discard': return `discard ${d.count}`;
    case 'legend': return `keep one ${d.name}`;
    case 'triggerOrder': return 'order your triggers';
    case 'triggerTargets': return 'choose targets for a trigger';
    case 'may': return 'a "may" choice';
    case 'chooseColor': return `choose a colour for ${nameOf(s, d.object)}`;
    case 'arrange': return d.to === 'bottom' ? 'scry' : 'surveil';
    case 'payOrElse': return `pay ${payWords(d)}?`;
    case 'pick': case 'choose': case 'distribute': return d.text.toLowerCase();
    case 'castFree': return 'cast a spell for free?';
  }
}

const payWords = (d: Extract<Decision, { kind: 'payOrElse' }>) => [d.cost, d.waterbend ? `waterbend {${d.waterbend}}` : ''].filter(Boolean).join(' and ');

const targetName = (s: GameState, t: Target) => (t === 'p1' || t === 'p2' ? playerName(s, t) : nameOf(s, t));

/** The engine's question. */
export function DecisionPrompt({ s, d, a, send }: { s: GameState; d: Decision; a: Answering; send: (c: Choice) => void }) {
  switch (d.kind) {
    case 'mulligan': return (
      <div class="prompt">
        <p>{s.players[d.player].mulligans ? `Mulligan ${s.players[d.player].mulligans}: ` : ''}Keep this hand?</p>
        <div class="row"><button class="btn" onClick={() => send({ kind: 'mulligan' })} data-tip="Shuffle and draw seven again; then put one card on the bottom for each mulligan (London mulligan)." data-testid="mulligan">Mulligan</button><button class="btn primary" onClick={() => send({ kind: 'keep' })} data-tip="Keep this hand." data-testid="keep">Keep</button></div>
      </div>
    );
    case 'bottom': case 'discard': return (
      <div class="prompt">
        <p>{d.kind === 'bottom' ? `Choose ${d.count} card${d.count > 1 ? 's' : ''} to put on the bottom` : `Choose ${d.count} card${d.count > 1 ? 's' : ''} to discard`} ({a.chosen.length}/{d.count})</p>
        <div class="row"><button class="btn primary" disabled={a.chosen.length !== d.count} onClick={() => send({ kind: d.kind, cards: a.chosen })} data-testid="done">Done</button></div>
      </div>
    );
    case 'attackers': return (
      <div class="prompt">
        <p>Tap creatures to attack {playerName(s, other(d.player))}.</p>
        <div class="row"><button class="btn primary" onClick={() => send({ kind: 'attack', attackers: [...a.atk] })} data-tip="Attack with the creatures you tapped on; with none, skip combat." data-testid="attack">{a.atk.size ? `Attack with ${a.atk.size}` : 'No attack'}</button></div>
      </div>
    );
    case 'blockers': return (
      <div class="prompt">
        <p>{a.armed ? `${nameOf(s, a.armed)} blocks: tap the attacker` : 'Tap a creature to block with, then the attacker.'}</p>
        <div class="row"><button class="btn primary" onClick={() => send({ kind: 'block', blocks: [...a.blocks].map(([blocker, attacker]) => ({ blocker, attacker })) })} data-tip="Declare these blocks; with none, take the damage." data-testid="block">{a.blocks.size ? `Block with ${a.blocks.size}` : 'No blocks'}</button></div>
      </div>
    );
    case 'damage': {
      const keys = [...d.blockers, ...(d.trample ? ['player'] : [])];
      const total = keys.reduce((n, k) => n + (a.split[k] ?? 0), 0);
      return (
        <div class="prompt">
          <p>Divide {nameOf(s, d.attacker)}'s {d.power} damage ({total}/{d.power})</p>
          {keys.map((k) => (
            <div key={k} class="row stepper">
              <span>{k === 'player' ? playerName(s, other(d.player)) : nameOf(s, k)}</span>
              <button class="btn" onClick={() => a.setSplit((v) => ({ ...v, [k]: Math.max(0, (v[k] ?? 0) - 1) }))}>−</button>
              <b>{a.split[k] ?? 0}</b>
              <button class="btn" onClick={() => a.setSplit((v) => ({ ...v, [k]: (v[k] ?? 0) + 1 }))}>+</button>
            </div>
          ))}
          <div class="row"><button class="btn primary" onClick={() => send({ kind: 'damage', assign: a.split as Record<ObjectId | 'player', number> })}>Done</button></div>
        </div>
      );
    }
    case 'legend': return (
      <div class="prompt">
        <p>Legend rule: choose the {d.name} to keep.</p>
        <div class="row"><button class="btn primary" disabled={!a.chosen.length} onClick={() => send({ kind: 'legend', keep: a.chosen[0]! })} data-testid="keep-legend">Keep</button></div>
      </div>
    );
    case 'triggerOrder': return (
      <div class="prompt">
        <p>{playerName(s, d.player)}: order your triggers. The one on the left resolves first.</p>
        <div class="row"><button class="btn primary" onClick={() => send({ kind: 'order', triggers: [...a.order].reverse() })} data-tip="Put the triggers on the stack in this order: the left one resolves first." data-testid="accept-order">Accept order</button></div>
      </div>
    );
    case 'triggerTargets': {
      const t = s.pendingTriggers[d.trigger]!;
      const opts = triggerTargetOptions(s);
      const spec = opts[a.picking.length];
      return (
        <div class="prompt">
          <p><b>{t.sourceName}</b>: {triggeredAbility(s, t.card, t.index).text}</p>
          <p class="dim">Choose a target{opts.length > 1 ? ` (${a.picking.length + 1}/${opts.length})` : ''}.</p>
          <div class="chips-row">{(spec?.legal ?? []).map((x) => <button key={x} class="btn chipbtn" onClick={() => a.onPick(x)}>{targetName(s, x)}</button>)}</div>
        </div>
      );
    }
    case 'may': return (
      <div class="prompt">
        <p>You may {d.text}.</p>
        <div class="row"><button class="btn" onClick={() => send({ kind: 'no' })} data-testid="no">No</button><button class="btn primary" onClick={() => send({ kind: 'yes' })} data-testid="yes">Yes</button></div>
      </div>
    );
    case 'payOrElse': return (
      <div class="prompt">
        <p>Pay {payWords(d)}? {d.reward ? `If you do, ${d.reward}.` : `If you don't, ${d.otherwise}.`}</p>
        <div class="row"><button class="btn" onClick={() => send({ kind: 'no' })} data-testid="no">Don't pay</button><button class="btn primary" onClick={() => send({ kind: 'yes' })} data-testid="yes">Pay</button></div>
      </div>
    );
    case 'chooseColor': return (
      <div class="prompt">
        <p>Choose a colour for {nameOf(s, d.object)}</p>
        <div class="row">{d.options.map((c: Color) => <button key={c} class={`btn pipbtn ${c}`} onClick={() => send({ kind: 'color', color: c })}>{c}</button>)}</div>
      </div>
    );
    case 'arrange': return (
      <div class="prompt">
        <p>{d.to === 'bottom' ? 'Scry' : 'Surveil'} {d.cards.length}: tap a card to put it {d.to === 'bottom' ? 'on the bottom' : 'into your graveyard'}.</p>
        <CardList s={s} ids={d.cards} selectable={new Set(d.cards)} selected={new Set(a.chosen)} onPick={(id) => a.toggleChosen(id, d.cards.length)} />
        <div class="row"><button class="btn primary" onClick={() => send({ kind: 'arrange', top: d.cards.filter((c) => !a.chosen.includes(c)), away: a.chosen })} data-testid="done">Done</button></div>
      </div>
    );
    case 'pick': {
      const n = a.chosen.length;
      // "Total power 4 or less": the power chosen so far, against the limit.
      const power = d.maxPower === undefined ? 0 : a.chosen.reduce((k, id) => k + (s.objects[id] ? characteristics(s, s.objects[id]!).power : 0), 0);
      const fits = n >= d.min && n <= d.max && (d.maxPower === undefined || power <= d.maxPower);
      // Cards in the chooser's own hand are picked there; anything else is listed here.
      const inHand = d.from.every((id) => s.objects[id]?.zone === `${d.player}.hand`);
      return (
        <div class={`prompt ${d.from.length > 4 && !inHand ? 'tall' : ''}`}>
          <p>{d.text}{d.maxPower !== undefined ? ` (power ${power}/${d.maxPower})` : d.max > 1 ? ` (${n}/${d.max})` : ''}</p>
          {!inHand && <CardList s={s} ids={d.from} selectable={new Set(d.options)} selected={new Set(a.chosen)} onPick={(id) => a.toggleChosen(id, d.max)} />}
          <div class="row">
            {d.orNone && <button class="btn" onClick={() => send({ kind: 'pick', cards: [] })} data-testid="no">{d.none ?? 'None'}</button>}
            <button class="btn primary" disabled={!fits || (d.orNone && n === 0)} onClick={() => send({ kind: 'pick', cards: a.chosen })} data-testid="done">{n || d.orNone ? d.done ?? 'Done' : d.none ?? 'None'}</button>
          </div>
        </div>
      );
    }
    case 'choose': if (d.max !== undefined) {
      const on = a.chosen.map(Number);
      return (
        <div class="prompt">
          <p>{d.text}</p>
          {d.options.map((o, i) => <button key={i} class={`btn opt ${on.includes(i) ? 'on' : ''}`} onClick={() => a.toggleChosen(String(i), d.max!)} data-testid={`option-${i}`}>{o}</button>)}
          <div class="row"><button class="btn primary" onClick={() => send({ kind: 'options', indices: on })} data-testid="done">{on.length ? 'Done' : 'None'}</button></div>
        </div>
      );
    } else return (
      <div class="prompt">
        <p>{d.text}</p>
        {d.cards && <CardList s={s} ids={d.cards} selectable={new Set()} selected={new Set()} onPick={() => undefined} />}
        <div class="menu">{d.options.map((o, i) => <button key={i} class={`btn ${i === 0 ? 'primary' : ''}`} onClick={() => send({ kind: 'option', index: i })} data-testid={`option-${i}`}>{o}</button>)}</div>
      </div>
    );
    case 'distribute': {
      const given = d.options.reduce((n, id) => n + (a.split[id] ?? 0), 0);
      return (
        <div class="prompt">
          <p>{d.text} ({given}/{d.total})</p>
          {d.options.map((id) => (
            <div key={id} class="row stepper">
              <span>{nameOf(s, id)}</span>
              <button class="btn" onClick={() => a.setSplit((v) => ({ ...v, [id]: Math.max(0, (v[id] ?? 0) - 1) }))}>−</button>
              <b>{a.split[id] ?? 0}</b>
              <button class="btn" disabled={given >= d.total} onClick={() => a.setSplit((v) => ({ ...v, [id]: (v[id] ?? 0) + 1 }))} data-testid={`more-${nameOf(s, id)}`}>+</button>
            </div>
          ))}
          <div class="row"><button class="btn primary" disabled={given !== d.total} onClick={() => send({ kind: 'distribute', amounts: a.split })} data-testid="done">Done</button></div>
        </div>
      );
    }
    case 'castFree': return (
      <div class="prompt">
        <p>You may cast one of these without paying its mana cost. Tap a card to cast it.</p>
        <CardList s={s} ids={d.options} selectable={new Set(d.options)} selected={new Set()} onPick={(id) => a.onPick(id)} />
        <div class="row"><button class="btn" onClick={() => send({ kind: 'no' })} data-testid="cast-nothing">Cast nothing</button></div>
      </div>
    );
    case 'priority': return null;
  }
}

/** What the cast or activation in progress needs next. */
export interface Casting {
  s: GameState;
  actor: PlayerId;
  intent: Intent;
  need: Need;
  setIntent: (i: Intent | null) => void;
  picking: Target[];
  setPicking: (t: Target[]) => void;
  pickTarget: (t: Target) => void;
  /** Picks an object for a cost that sacrifices or discards; the intent takes them once there are enough. */
  pickCost: (id: ObjectId) => void;
  modes: number[];
  setModes: Dispatch<StateUpdater<number[]>>;
  x: number;
  setX: Dispatch<StateUpdater<number>>;
  preview: { tapped: ObjectId[]; floating: number } | null;
  /** It goes straight on the stack: no confirm step. */
  plainPayment: boolean;
  send: (c: Choice) => void;
  confirm: Choice;
}

export function IntentPrompt(c: Casting) {
  const { s, intent, need, setIntent, picking } = c;
  const name = nameOf(s, intent.object);
  const cancel = <button class="btn" onClick={() => { setIntent(null); c.setPicking([]); }} data-tip="Put the card back. Nothing changes." data-testid="cancel">Cancel</button>;
  switch (need.kind) {
    case 'modes': {
      const pickMode = (i: number) => (need.max === 1 ? setIntent({ ...intent, modes: [i], targets: [] }) : c.setModes((m) => (m.includes(i) ? m.filter((y) => y !== i) : [...m, i])));
      return (
        <div class="prompt">
          <p><b>{name}</b>: choose {need.max === 1 ? 'one' : `${need.min === need.max ? need.min : `${need.min} to ${need.max}`}`}</p>
          {need.options.map((m, i) => <button key={i} class={`btn opt ${c.modes.includes(i) ? 'on' : ''}`} disabled={!m.ok} onClick={() => pickMode(i)} data-testid={`mode-${i}`}>{m.text}</button>)}
          <div class="row">{cancel}{need.max > 1 && <button class="btn primary" disabled={c.modes.length < need.min} onClick={() => setIntent({ ...intent, modes: [...c.modes].sort(), targets: [] })}>Done</button>}</div>
        </div>
      );
    }
    case 'cost': return (
      <div class="prompt">
        <p><b>{name}</b>: as an additional cost</p>
        {need.options.map((o, i) => <button key={i} class="btn opt" disabled={!o.ok} onClick={() => setIntent({ ...intent, cost: i })} data-testid={`cost-${i}`}>{o.text}</button>)}
        <div class="row">{cancel}</div>
      </div>
    );
    case 'sacrifice': case 'discard': return (
      <div class="prompt">
        <p><b>{name}</b>: choose {need.count > 1 ? `${need.count} ` : ''}to {need.kind}{need.count > 1 ? ` (${picking.length}/${need.count})` : ''}</p>
        <div class="chips-row">{need.options.map((id) => <button key={id} class={`btn chipbtn ${picking.includes(id) ? 'on' : ''}`} onClick={() => c.pickCost(id)} data-testid={`${need.kind}-${nameOf(s, id)}`}>{nameOf(s, id)}</button>)}</div>
        <div class="row">{cancel}</div>
      </div>
    );
    case 'x': return (
      <div class="prompt">
        <p><b>{name}</b>: choose X</p>
        <div class="row stepper"><button class="btn" onClick={() => c.setX((v) => Math.max(0, v - 1))}>−</button><b data-testid="x-value">X = {c.x}</b><button class="btn" onClick={() => c.setX((v) => v + 1)}>+</button></div>
        <div class="row">{cancel}<button class="btn primary" onClick={() => setIntent({ ...intent, x: c.x })} data-tip="Use this value of X." data-testid="x-done">Done</button></div>
      </div>
    );
    case 'target': return (
      <div class="prompt">
        <p><b>{name}</b>: choose {need.text}{need.count > 1 ? ` (${picking.length}/${need.count})` : ''}</p>
        <div class="chips-row">
          {need.legal.map((t) => (
            <button key={t} class={`btn chipbtn ${picking.includes(t) ? 'on' : ''}`} onClick={() => c.pickTarget(t)} data-testid={`target-${t === 'p1' || t === 'p2' ? t : nameOf(s, t)}`}>
              {t === 'p1' || t === 'p2' ? playerName(s, t) : `${nameOf(s, t)}${s.objects[t]!.controller !== c.actor ? ` (${playerName(s, s.objects[t]!.controller)})` : ''}`}
            </button>
          ))}
        </div>
        <div class="row">{cancel}{need.upTo && <button class="btn primary" onClick={() => { setIntent({ ...intent, targets: [...intent.targets, picking] }); c.setPicking([]); }} data-testid="targets-done">Done</button>}</div>
      </div>
    );
    case 'tap': return (
      <div class="prompt">
        <p><b>{name}</b>: {need.power !== undefined ? `crew ${need.power}: tap creatures with total power ${need.power} or more` : 'tap an untapped creature you control'}</p>
        <div class="chips-row">{need.options.map((id) => <button key={id} class={`btn chipbtn ${picking.includes(id) ? 'on' : ''}`} onClick={() => c.pickCost(id)} data-testid={`tap-${nameOf(s, id)}`}>{nameOf(s, id)}</button>)}</div>
        <div class="row">{cancel}</div>
      </div>
    );
    case 'confirm': {
      if (c.plainPayment) return null; // it goes straight on the stack
      const printed = s.setup.cards[s.objects[intent.object]!.card]!;
      const cost = intent.kind === 'cast' ? (s.objects[intent.object]!.airbended ? '{2}' : formatCost(printed.manaCost, intent.x ?? 0))
        : printed.script?.activated?.[intent.ability ?? 0]?.text.split(':')[0] ?? '';
      const { preview } = c;
      return (
        <div class="prompt">
          <p><b>{intent.kind === 'cast' ? `Cast ${name}` : `Activate ${name}`}</b>{intent.targets.flat().length > 0 && <span> · target {intent.targets.flat().map((t) => targetName(s, t)).join(', ')}</span>}</p>
          <p class="dim">Cost {cost || 'none'}{preview ? ` · taps ${preview.tapped.map((id) => nameOf(s, id)).join(', ') || 'nothing'}${preview.floating ? ` · ${preview.floating} floating` : ''}` : ' · not enough mana'}</p>
          <div class="row">
            {cancel}<button class="btn primary" onClick={() => c.send(c.confirm)} data-tip="Pay the cost with the outlined sources and put it on the stack." data-testid="confirm">{intent.kind === 'cast' ? 'Cast' : 'Activate'}</button>
          </div>
        </div>
      );
    }
  }
}
