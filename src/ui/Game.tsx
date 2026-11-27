/**
 * The game screen: the board for whoever holds the device, the prompt panel for the question the
 * engine or a cast in progress is asking, and the footer (PRD, "Playing"). Every gesture is an
 * intent; only an answer the engine accepts changes the game.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { characteristics } from '../engine/characteristics';
import { proposedSplit } from '../engine/combat';
import { attackCandidates, blockCandidates, legalActions, paymentPreview, triggerTargetOptions } from '../engine/engine';
import { triggeredAbility } from '../engine/triggers';
import type { Choice, Color, GameState, ObjectId, PlayerId, Target } from '../engine/types';
import { other } from '../engine/types';
import { canRedo, canUndo, current } from '../host/controller';
import { acting, choose, handingOff, look, newInHand, redoLast, resignGame, undoLast, visibleHand, type Session } from '../host/session';
import { Board, type Marks } from './Board';
import { CardView, type CardAction } from './CardView';
import { nextNeed, toChoice, withDrop, type Intent, type Need } from './flow';
import { beats, cardImage, formatCost, nameOf, passMeaning, playerName, siblings, type Beat } from './model';
import { CardList, Sheet } from './Sheets';

const EMPTY: Marks = { selectable: new Set(), selected: new Set(), glow: new Set(), paying: new Set(), blocks: new Map(), fresh: new Set(), pulse: new Map() };

/** Words for what the acting player must decide, for the hand-off bar. */
function asking(s: GameState): string {
  const d = s.decision;
  if (!d) return '';
  switch (d.kind) {
    case 'priority': return s.events[s.events.length - 1]?.text ?? 'your move';
    case 'mulligan': return 'keep or mulligan';
    case 'bottom': return `put ${d.count} card${d.count > 1 ? 's' : ''} on the bottom`;
    case 'attackers': return 'declare attackers';
    case 'blockers': return 'declare blockers';
    case 'damage': return `divide ${nameOf(s, d.attacker)}'s damage`;
    case 'discard': case 'discardEffect': return `discard ${d.count}`;
    case 'legend': return `keep one ${d.name}`;
    case 'triggerOrder': return 'order your triggers';
    case 'triggerTargets': return 'choose targets for a trigger';
    case 'may': return 'a "may" choice';
    case 'chooseColor': return `choose a colour for ${nameOf(s, d.object)}`;
    case 'arrange': return d.to === 'bottom' ? 'scry' : 'surveil';
    case 'search': return 'search your library';
    case 'optionalCost': return `you may ${d.pay}`;
    case 'payOrElse': return `pay ${d.cost}${d.waterbend ? `waterbend {${d.waterbend}}` : ''}?`;
    case 'pick': return d.text.toLowerCase();
  }
}

/** How long each step of playback shows. */
const BEAT_MS = 1100;

function BeatBanner({ s, beat, n, of }: { s: GameState; beat: Beat; n: number; of: number }) {
  return (
    <div class={`beat ${beat.controller ?? ''}`} data-testid="beat">
      {beat.image ? <img src={beat.image} alt="" /> : <span class="beat-icon">⚔</span>}
      <span class="beat-text">
        <b class={beat.controller ? `by ${beat.controller}` : ''}>{beat.title}</b>
        {beat.controller && <span class="dim"> · {playerName(s, beat.controller)}</span>}
        {of > 1 && <span class="dim"> · {n}/{of}</span>}
        {beat.text && <span class="beat-ability">{beat.text}</span>}
        {beat.lines.map((t, i) => <span key={i} class="beat-line">{t}</span>)}
      </span>
    </div>
  );
}

export function GameScreen({ session, onChange, onExit, onRematch }: {
  session: Session; onChange: (x: Session) => void; onExit: () => void; onRematch: (chooser: PlayerId) => void;
}) {
  const s = current(session.game);
  const d = s.decision;
  const actor = acting(session);
  const off = handingOff(session);
  const me = session.facing;
  const shown = visibleHand(session) === me;

  const [intent, setIntent] = useState<Intent | null>(null);
  const [picking, setPicking] = useState<Target[]>([]);
  const [viewing, setViewing] = useState<ObjectId | null>(null);
  const [pile, setPile] = useState<{ p: PlayerId; pile: 'graveyard' | 'exile' } | null>(null);
  const [menu, setMenu] = useState<'menu' | 'log' | 'undo' | 'ahead' | 'resign' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [folded, setFolded] = useState(false);
  // Answers being built for the engine's decision; reset whenever the decision changes.
  const [atk, setAtk] = useState<Set<ObjectId>>(new Set());
  const [blocks, setBlocks] = useState<Map<ObjectId, ObjectId>>(new Map());
  const [armed, setArmed] = useState<ObjectId | null>(null);
  const [chosen, setChosen] = useState<ObjectId[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [split, setSplit] = useState<Record<string, number>>({});
  const [modes, setModes] = useState<number[]>([]);
  const [x, setX] = useState(0);
  const [hold, setHold] = useState(false);
  const [away, setAway] = useState<string[] | null>(null);

  // ----- playback (PRD, "Playing"): after a tap, each spell or ability that resolved and each round
  // of combat damage is shown in turn, about a second each, with what it changed pulsing. A tap skips.
  const states = session.game.states;
  const seen = useRef(states.length);
  const [play, setPlay] = useState<{ beats: Beat[]; k: number } | null>(null);
  useEffect(() => {
    const before = seen.current;
    seen.current = states.length;
    if (states.length <= before) { setPlay(null); return; } // undo, or nothing new
    const bs = beats(states, before - 1, states.length - 1);
    setPlay(bs.length ? { beats: bs, k: 0 } : null);
  }, [states.length]);
  useEffect(() => {
    if (!play) return undefined;
    const t = setTimeout(() => setPlay((p) => (p && p.k + 1 < p.beats.length ? { ...p, k: p.k + 1 } : null)), BEAT_MS);
    return () => clearTimeout(t);
  }, [play]);
  const beat = play?.beats[play.k];

  useEffect(() => {
    setAtk(new Set()); setBlocks(new Map()); setArmed(null); setChosen([]); setPicking([]);
    setOrder(d?.kind === 'triggerOrder' ? d.triggers : []);
    setSplit(d?.kind === 'damage' ? proposedSplit(s, s.objects[d.attacker]!) : {});
    if (d?.kind === 'arrange') setChosen([]);
  }, [s.seq]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); } return undefined; }, [toast]);

  const send = (c: Choice, opts: Parameters<typeof choose>[2] = {}) => {
    const next = choose(session, c, opts);
    if ('refused' in next) { setToast(next.refused); return false; }
    setIntent(null); setPicking([]); setViewing(null); setAway(null);
    onChange(next);
    return true;
  };

  // ----- the cast or activation in progress
  const need: Need | null = intent && actor ? nextNeed(s, actor, intent) : null;
  const preview = intent && actor && need?.kind === 'confirm' ? paymentPreview(s, actor, toChoice(intent)) : null;
  const startIntent = (i: Intent, drop: Target | null = null) => {
    if (!actor) return;
    setViewing(null); setModes([]); setX(0); setPicking([]);
    setHold(false);
    setIntent(withDrop(s, actor, i, drop));
  };
  const pickTarget = (t: Target) => {
    if (!intent || need?.kind !== 'target') return;
    const next = picking.includes(t) ? picking.filter((y) => y !== t) : [...picking, t];
    if (next.length >= need.count && !need.upTo) { setIntent({ ...intent, targets: [...intent.targets, next] }); setPicking([]); } else setPicking(next);
  };

  // ----- legal moves glow for the player holding the device
  const priorityHere = !off && d?.kind === 'priority' && !intent;
  const glow = useMemo(() => {
    const g = new Set<ObjectId>();
    if (!priorityHere) return g;
    for (const c of legalActions(s)) if (c.kind === 'cast' || c.kind === 'play' || c.kind === 'activate') g.add(c.object);
    return g;
  }, [s.seq, priorityHere]);

  // ----- what the board marks
  let marks: Marks = { ...EMPTY, glow, fresh: shown ? newInHand(session, me) : new Set() };
  if (!off && need?.kind === 'target') marks = { ...marks, selectable: new Set(need.legal), selected: new Set(picking) };
  else if (!off && need?.kind === 'tap') marks = { ...marks, selectable: new Set(need.options), selected: new Set(picking) };
  else if (!off && preview) marks = { ...marks, paying: new Set(preview.tapped) };
  else if (!off && !intent && d) {
    switch (d.kind) {
      case 'attackers': marks = { ...marks, selectable: new Set(attackCandidates(s)), selected: new Set(atk) }; break;
      case 'blockers': {
        const cands = blockCandidates(s);
        const sel = armed ? new Set<Target>([armed, ...(cands.find((c) => c.blocker === armed)?.attackers ?? [])]) : new Set<Target>([...cands.map((c) => c.blocker)]);
        marks = { ...marks, selectable: sel, selected: new Set([...blocks.keys(), ...(armed ? [armed] : [])]), blocks };
        break;
      }
      case 'triggerTargets': {
        const spec = triggerTargetOptions(s)[picking.length];
        marks = { ...marks, selectable: new Set(spec?.legal ?? []), selected: new Set(picking) };
        break;
      }
      case 'bottom': case 'discard': case 'discardEffect': marks = { ...marks, selectable: new Set(s.zones[`${d.player}.hand`]), selected: new Set(chosen) }; break;
      case 'optionalCost': marks = { ...marks, selectable: new Set(d.options), selected: new Set(chosen) }; break;
      case 'legend': marks = { ...marks, selectable: new Set(d.objects), selected: new Set(chosen) }; break;
      default: break;
    }
  }

  if (beat) marks = { ...EMPTY, pulse: beat.pulses }; // playback: only what changed, nothing to pick

  const toggleChosen = (id: ObjectId, max: number) => setChosen((c) => (c.includes(id) ? c.filter((y) => y !== id) : c.length < max ? [...c, id] : max === 1 ? [id] : c));

  const onPick = (t: Target) => {
    if (off) return;
    if (intent && need?.kind === 'target') { pickTarget(t); return; }
    if (intent && need?.kind === 'tap') { setIntent({ ...intent, tapping: [t] }); return; }
    if (!d) return;
    switch (d.kind) {
      case 'attackers': setAtk((a) => { const n = new Set(a); if (n.has(t)) n.delete(t); else n.add(t); return n; }); return;
      case 'blockers': {
        if (armed === t) { setArmed(null); return; }
        if (armed) { setBlocks((b) => new Map(b).set(armed, t)); setArmed(null); return; }
        if (blocks.has(t)) { setBlocks((b) => { const n = new Map(b); n.delete(t); return n; }); return; }
        setArmed(t); return;
      }
      case 'triggerTargets': {
        const opts = triggerTargetOptions(s);
        const next = [...picking, t];
        if (next.length >= opts.length) send({ kind: 'targets', targets: next.map((y) => [y]) }); else setPicking(next);
        return;
      }
      case 'bottom': case 'discard': case 'discardEffect': toggleChosen(t, d.count); return;
      case 'optionalCost': toggleChosen(t, d.count); return;
      case 'legend': setChosen([t]); return;
      default: return;
    }
  };

  const handlers = {
    onCard: (id: ObjectId) => { if (marks.selectable.has(id)) onPick(id); else setViewing(id); },
    onPlayer: (p: PlayerId) => onPick(p),
    onPile: (p: PlayerId, which: 'graveyard' | 'exile') => setPile({ p, pile: which }),
    onHandChip: () => (off && actor === me ? takeLook() : setFolded((f) => !f)),
    onDrop: (id: ObjectId, at: Target | null) => {
      if (!priorityHere || !actor) return;
      const o = s.objects[id]!;
      if (characteristics(s, o).types.includes('Land')) { send({ kind: 'play', object: id }); return; }
      const acts = legalActions(s);
      if (!acts.some((c) => c.kind === 'cast' && c.object === id)) { setViewing(id); return; } // the full view says why
      startIntent({ kind: 'cast', object: id, targets: [] }, at);
    },
  };

  const onAction = (id: ObjectId, a: CardAction) => {
    if (a.kind === 'play') { send({ kind: 'play', object: id }); return; }
    if (a.kind === 'cast') startIntent({ kind: 'cast', object: id, targets: [] });
    else startIntent({ kind: 'activate', object: id, ability: a.ability, targets: [] });
  };

  // ----- Look: the acting player takes the device, and sees what happened since they last acted
  function takeLook() {
    if (!actor) return;
    const g = session.game;
    let i = g.record.choices.length - 1;
    while (i >= 0 && (g.record.choices[i]!.auto || g.record.choices[i]!.player !== actor)) i--;
    const since = i >= 0 ? g.states[i + 1]!.events.length : s.events.length;
    const lines = s.events.slice(since).map((e) => e.text);
    setAway(lines.length ? lines.slice(-6) : null);
    onChange(look(session));
  }

  // ----- undo, with confirmation when it takes back the other player's decision
  const lastManual = [...session.game.record.choices].reverse().find((c) => !c.auto);
  const doUndo = () => { setIntent(null); setMenu(null); onChange(undoLast(session)); };
  const askUndo = () => { if (lastManual && lastManual.player !== me) setMenu('undo'); else doUndo(); };

  // ----- the prompt panel and the footer
  const prompt = renderPrompt();
  const footer = renderFooter();

  function renderPrompt() {
    if (off || !d) return null;
    if (intent && need) {
      const name = nameOf(s, intent.object);
      const cancel = <button class="btn" onClick={() => { setIntent(null); setPicking([]); }} data-tip="Put the card back. Nothing changes." data-testid="cancel">Cancel</button>;
      switch (need.kind) {
        case 'modes': {
          const pickMode = (i: number) => (need.max === 1 ? setIntent({ ...intent, modes: [i], targets: [] }) : setModes((m) => (m.includes(i) ? m.filter((y) => y !== i) : [...m, i])));
          return (
            <div class="prompt">
              <p><b>{name}</b>: choose {need.max === 1 ? 'one' : `${need.min === need.max ? need.min : `${need.min} to ${need.max}`}`}</p>
              {need.options.map((m, i) => <button key={i} class={`btn opt ${modes.includes(i) ? 'on' : ''}`} disabled={!m.ok} onClick={() => pickMode(i)} data-testid={`mode-${i}`}>{m.text}</button>)}
              <div class="row">{cancel}{need.max > 1 && <button class="btn primary" disabled={modes.length < need.min} onClick={() => setIntent({ ...intent, modes: [...modes].sort(), targets: [] })}>Done</button>}</div>
            </div>
          );
        }
        case 'x': return (
          <div class="prompt">
            <p><b>{name}</b>: choose X</p>
            <div class="row stepper"><button class="btn" onClick={() => setX((v) => Math.max(0, v - 1))}>−</button><b data-testid="x-value">X = {x}</b><button class="btn" onClick={() => setX((v) => v + 1)}>+</button></div>
            <div class="row">{cancel}<button class="btn primary" onClick={() => setIntent({ ...intent, x })} data-tip="Use this value of X." data-testid="x-done">Done</button></div>
          </div>
        );
        case 'target': return (
          <div class="prompt">
            <p><b>{name}</b>: choose {need.text}{need.count > 1 ? ` (${picking.length}/${need.count})` : ''}</p>
            <div class="chips-row">
              {need.legal.map((t) => (
                <button key={t} class={`btn chipbtn ${picking.includes(t) ? 'on' : ''}`} onClick={() => pickTarget(t)} data-testid={`target-${t === 'p1' || t === 'p2' ? t : nameOf(s, t)}`}>
                  {t === 'p1' || t === 'p2' ? playerName(s, t) : `${nameOf(s, t)}${s.objects[t]!.controller !== actor ? ` (${playerName(s, s.objects[t]!.controller)})` : ''}`}
                </button>
              ))}
            </div>
            <div class="row">{cancel}{need.upTo && <button class="btn primary" onClick={() => { setIntent({ ...intent, targets: [...intent.targets, picking] }); setPicking([]); }}>Done</button>}</div>
          </div>
        );
        case 'tap': return (
          <div class="prompt">
            <p><b>{name}</b>: tap an untapped creature you control</p>
            <div class="chips-row">{need.options.map((id) => <button key={id} class="btn chipbtn" onClick={() => setIntent({ ...intent, tapping: [id] })}>{nameOf(s, id)}</button>)}</div>
            <div class="row">{cancel}</div>
          </div>
        );
        case 'confirm': {
          const printed = s.setup.cards[s.objects[intent.object]!.card]!;
          const cost = intent.kind === 'cast' ? (s.objects[intent.object]!.airbended ? '{2}' : formatCost(printed.manaCost, intent.x ?? 0))
            : printed.script?.activated?.[intent.ability ?? 0]?.text.split(':')[0] ?? '';
          return (
            <div class="prompt">
              <p><b>{intent.kind === 'cast' ? `Cast ${name}` : `Activate ${name}`}</b>{intent.targets.flat().length > 0 && <span> · target {intent.targets.flat().map((t) => (t === 'p1' || t === 'p2' ? playerName(s, t) : nameOf(s, t))).join(', ')}</span>}</p>
              <p class="dim">Cost {cost || 'none'}{preview ? ` · taps ${preview.tapped.map((id) => nameOf(s, id)).join(', ') || 'nothing'}${preview.floating ? ` · ${preview.floating} floating` : ''}` : ' · not enough mana'}</p>
              <div class="row">
                <label class="hold" data-tip="Keep priority after casting, to respond to your own spell."><input type="checkbox" checked={hold} onChange={(e) => setHold((e.target as HTMLInputElement).checked)} /> Hold priority</label>
                {cancel}<button class="btn primary" onClick={() => send(toChoice(intent), { hold })} data-tip="Pay the cost with the outlined sources and put it on the stack." data-testid="confirm">{intent.kind === 'cast' ? 'Cast' : 'Activate'}</button>
              </div>
            </div>
          );
        }
      }
    }
    switch (d.kind) {
      case 'mulligan': return (
        <div class="prompt">
          <p>{s.players[d.player].mulligans ? `Mulligan ${s.players[d.player].mulligans}: ` : ''}Keep this hand?</p>
          <div class="row"><button class="btn" onClick={() => send({ kind: 'mulligan' })} data-tip="Shuffle and draw seven again; then put one card on the bottom for each mulligan (London mulligan)." data-testid="mulligan">Mulligan</button><button class="btn primary" onClick={() => send({ kind: 'keep' })} data-tip="Keep this hand." data-testid="keep">Keep</button></div>
        </div>
      );
      case 'bottom': case 'discard': case 'discardEffect': return (
        <div class="prompt">
          <p>{d.kind === 'bottom' ? `Choose ${d.count} card${d.count > 1 ? 's' : ''} to put on the bottom` : `Choose ${d.count} card${d.count > 1 ? 's' : ''} to discard`} ({chosen.length}/{d.count})</p>
          <div class="row"><button class="btn primary" disabled={chosen.length !== d.count} onClick={() => send({ kind: d.kind === 'bottom' ? 'bottom' : 'discard', cards: chosen } as Choice)} data-testid="done">Done</button></div>
        </div>
      );
      case 'attackers': return (
        <div class="prompt">
          <p>Tap creatures to attack {playerName(s, other(d.player))}.</p>
          <div class="row"><button class="btn primary" onClick={() => send({ kind: 'attack', attackers: [...atk] })} data-tip="Attack with the creatures you tapped on; with none, skip combat." data-testid="attack">{atk.size ? `Attack with ${atk.size}` : 'No attack'}</button></div>
        </div>
      );
      case 'blockers': return (
        <div class="prompt">
          <p>{armed ? `${nameOf(s, armed)} blocks: tap the attacker` : 'Tap a creature to block with, then the attacker.'}</p>
          <div class="row"><button class="btn primary" onClick={() => send({ kind: 'block', blocks: [...blocks].map(([blocker, attacker]) => ({ blocker, attacker })) })} data-tip="Declare these blocks; with none, take the damage." data-testid="block">{blocks.size ? `Block with ${blocks.size}` : 'No blocks'}</button></div>
        </div>
      );
      case 'damage': {
        const keys = [...d.blockers, ...(d.trample ? ['player'] : [])];
        const total = keys.reduce((n, k) => n + (split[k] ?? 0), 0);
        return (
          <div class="prompt">
            <p>Divide {nameOf(s, d.attacker)}'s {d.power} damage ({total}/{d.power})</p>
            {keys.map((k) => (
              <div key={k} class="row stepper">
                <span>{k === 'player' ? playerName(s, other(d.player)) : nameOf(s, k)}</span>
                <button class="btn" onClick={() => setSplit((v) => ({ ...v, [k]: Math.max(0, (v[k] ?? 0) - 1) }))}>−</button>
                <b>{split[k] ?? 0}</b>
                <button class="btn" onClick={() => setSplit((v) => ({ ...v, [k]: (v[k] ?? 0) + 1 }))}>+</button>
              </div>
            ))}
            <div class="row"><button class="btn primary" onClick={() => send({ kind: 'damage', assign: split as Record<ObjectId | 'player', number> })}>Done</button></div>
          </div>
        );
      }
      case 'legend': return (
        <div class="prompt">
          <p>Legend rule: choose the {d.name} to keep.</p>
          <div class="row"><button class="btn primary" disabled={!chosen.length} onClick={() => send({ kind: 'legend', keep: chosen[0]! })}>Keep</button></div>
        </div>
      );
      case 'triggerOrder': return (
        <div class="prompt">
          <p>{playerName(s, d.player)}: order your triggers. The one on the left resolves first.</p>
          <div class="row"><button class="btn primary" onClick={() => send({ kind: 'order', triggers: [...order].reverse() })} data-tip="Put the triggers on the stack in this order: the left one resolves first." data-testid="accept-order">Accept order</button></div>
        </div>
      );
      case 'triggerTargets': {
        const t = s.pendingTriggers[d.trigger]!;
        const opts = triggerTargetOptions(s);
        const spec = opts[picking.length];
        return (
          <div class="prompt">
            <p><b>{t.sourceName}</b>: {triggeredAbility(s, t.card, t.index).text}</p>
            <p class="dim">Choose a target{opts.length > 1 ? ` (${picking.length + 1}/${opts.length})` : ''}.</p>
            <div class="chips-row">{(spec?.legal ?? []).map((x) => <button key={x} class="btn chipbtn" onClick={() => onPick(x)}>{x === 'p1' || x === 'p2' ? playerName(s, x) : nameOf(s, x)}</button>)}</div>
          </div>
        );
      }
      case 'may': return (
        <div class="prompt">
          <p>You may: {d.text}</p>
          <div class="row"><button class="btn" onClick={() => send({ kind: 'no' })} data-testid="no">No</button><button class="btn primary" onClick={() => send({ kind: 'yes' })} data-testid="yes">Yes</button></div>
        </div>
      );
      case 'payOrElse': return (
        <div class="prompt">
          <p>Pay {d.cost}{d.waterbend ? `waterbend {${d.waterbend}}` : ''}? If you don't: {d.otherwise}.</p>
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
          <CardList s={s} ids={d.cards} selectable={new Set(d.cards)} selected={new Set(chosen)} onPick={(id) => toggleChosen(id, d.cards.length)} />
          <div class="row"><button class="btn primary" onClick={() => send({ kind: 'arrange', top: d.cards.filter((c) => !chosen.includes(c)), away: chosen })} data-testid="done">Done</button></div>
        </div>
      );
      case 'search': return (
        <div class="prompt tall">
          <p>Search: choose up to {d.max}.</p>
          <CardList s={s} ids={d.options} selectable={new Set(d.options)} selected={new Set(chosen)} onPick={(id) => toggleChosen(id, d.max)} />
          <div class="row"><button class="btn primary" onClick={() => send({ kind: 'search', cards: chosen })} data-testid="done">{chosen.length ? 'Take' : 'Find nothing'}</button></div>
        </div>
      );
      case 'pick': return (
        <div class="prompt">
          <p>{d.text}</p>
          <CardList s={s} ids={d.from} selectable={new Set(d.options)} selected={new Set(chosen)} onPick={(id) => toggleChosen(id, d.max)} />
          <div class="row"><button class="btn primary" disabled={chosen.length < d.min} onClick={() => send({ kind: 'pick', cards: chosen })} data-testid="done">{chosen.length ? 'Done' : 'None'}</button></div>
        </div>
      );
      case 'optionalCost': return (
        <div class="prompt">
          <p>You may {d.pay} {d.count > 1 ? `${d.count} cards` : d.pay === 'sacrifice' ? 'a permanent' : 'a card'}.</p>
          {d.pay === 'sacrifice' && <CardList s={s} ids={d.options} selectable={new Set(d.options)} selected={new Set(chosen)} onPick={(id) => toggleChosen(id, d.count)} />}
          <div class="row"><button class="btn" onClick={() => send({ kind: 'optionalCost', objects: [] })} data-testid="no">Don't</button><button class="btn primary" disabled={chosen.length !== d.count} onClick={() => send({ kind: 'optionalCost', objects: chosen })} data-testid="yes">{d.pay === 'sacrifice' ? 'Sacrifice' : 'Discard'}</button></div>
        </div>
      );
      case 'priority': return null;
    }
  }

  function renderFooter() {
    if (!d) {
      const r = s.result;
      return (
        <div class="foot">
          <span class="say"><b>{r?.winner ? `${playerName(s, r.winner)} wins` : 'A draw'}</b> · {r?.reason}</span>
          <button class="btn" onClick={() => onRematch(r?.winner ? other(r.winner) : 'p1')} data-tip="Play again with the same decks; the loser chooses to play or draw." data-testid="rematch">Rematch</button>
          <button class="btn primary" onClick={onExit} data-testid="home">Home</button>
        </div>
      );
    }
    if (off && actor) {
      return (
        <div class="foot handoff" data-testid="handoff">
          <span class="say"><b class={`who ${actor}`}>{playerName(s, actor)} to act</b>: {asking(s)}</span>
          {d.kind === 'priority' && <button class="btn" onClick={() => setMenu('ahead')} data-tip="Pass this combat, or until end of turn, out loud: both players see it. It ends if the other player plays something." data-testid="bar-pass-ahead">»</button>}
          {d.kind === 'priority' && <button class="btn" onClick={() => send({ kind: 'pass' }, { fromBar: true })} data-tip="Pass without showing your hand. Nothing flips." data-testid="bar-pass">Pass</button>}
          <button class="btn primary" onClick={takeLook} data-tip="Take the phone and show your hand, to act." data-testid="look">Look</button>
        </div>
      );
    }
    return (
      <div class="foot">
        <span class="say">{d.kind === 'priority' && !intent ? <>Pass: <b>{passMeaning(s)}</b></> : <b>{playerName(s, d.player)}</b>}</span>
        <button class="btn" disabled={!canUndo(session.game)} onClick={askUndo} data-tip="Take back the last decision, with the automatic passes after it." data-testid="undo">Undo</button>
        <button class="btn" onClick={() => setMenu('menu')} data-tip="Log, redo, hide your hand, resign, or leave the game." data-testid="menu">☰</button>
        {d.kind === 'priority' && !intent && <button class="btn" onClick={() => setMenu('ahead')} data-tip="Pass this combat, or until end of turn, out loud: both players see it. It ends if the other player plays something." data-testid="pass-ahead">»</button>}
        {d.kind === 'priority' && !intent && <button class="btn primary" onClick={() => send({ kind: 'pass' })} data-tip={`Pass priority: ${passMeaning(s)}.`} data-testid="pass">Pass</button>}
      </div>
    );
  }

  const orderBand = !off && d?.kind === 'triggerOrder' ? (
    <div class="ordering">
      <div class="bandhead"><span>Order triggers · left resolves first</span></div>
      <div class="srow">
        {order.map((i, k) => {
          const t = s.pendingTriggers[i]!;
          const move = (by: number) => setOrder((o) => { const n = [...o]; const j = k + by; if (j < 0 || j >= n.length) return o; [n[k], n[j]] = [n[j]!, n[k]!]; return n; });
          return (
            <div key={i} class="sitem pending" data-testid={`trigger-${k}`}>
              <img src={cardImage(t.card)} alt="" />
              <span class="st"><b>{t.sourceName}</b><span>{triggeredAbility(s, t.card, t.index).text}</span>
                <span class="row"><button class="btn tiny" onClick={() => move(-1)} disabled={k === 0}>◀</button><button class="btn tiny" onClick={() => move(1)} disabled={k === order.length - 1}>▶</button></span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  ) : undefined;

  const viewActor = !off && d?.kind === 'priority' && !intent ? actor : null;
  const pileIds = pile ? s.zones[`${pile.p}.${pile.pile}`] : [];

  return (
    <div class="game" data-facing={me}>
      <Board s={beat ? states[beat.at]! : s} ahead={session.game.ahead ?? {}} bottom={me} handShown={shown} handFolded={folded} marks={marks} h={handlers} {...(beat ? { band: <BeatBanner s={s} beat={beat} n={play!.k + 1} of={play!.beats.length} /> } : orderBand ? { band: orderBand } : {})} />
      {beat && <div class="skip" data-testid="playback" onClick={() => setPlay(null)}><span>Tap to skip</span></div>}
      {away && !off && (
        <div class="away" data-testid="away" onClick={() => setAway(null)}>
          <b>While you were away</b>
          {away.map((t, i) => <span key={i}>{t}</span>)}
        </div>
      )}
      {prompt}
      {footer}
      {toast && <div class="toast" data-testid="toast" onClick={() => setToast(null)}>{toast}</div>}
      {viewing && s.objects[viewing] && <CardView s={s} id={viewing} actor={viewActor} siblings={siblings(s, viewing, shown ? me : null)} onAction={(a) => onAction(viewing, a)} onNavigate={setViewing} onClose={() => setViewing(null)} />}
      {pile && (
        <Sheet title={`${playerName(s, pile.p)}'s ${pile.pile}`} onClose={() => setPile(null)}>
          {pileIds.length ? <CardList s={s} ids={[...pileIds].reverse()} selectable={new Set()} selected={new Set()} onPick={() => undefined} onOpen={(id) => { setPile(null); setViewing(id); }} /> : <p class="dim">Empty.</p>}
        </Sheet>
      )}
      {menu === 'menu' && (
        <Sheet title="Menu" onClose={() => setMenu(null)}>
          <div class="menu">
            <button class="btn" onClick={() => setMenu('log')} data-testid="open-log">Log</button>
            <button class="btn" disabled={!canRedo(session.game)} onClick={() => { setMenu(null); onChange(redoLast(session)); }}>Redo</button>
            <button class="btn" onClick={() => { setFolded(true); setMenu(null); }}>Hide my hand</button>
            {d && <button class="btn" onClick={() => setMenu('resign')} data-testid="resign">Resign</button>}
            <button class="btn" onClick={onExit} data-testid="quit">Leave game (it stays saved)</button>
          </div>
        </Sheet>
      )}
      {menu === 'ahead' && (
        <Sheet title={`${actor ? playerName(s, actor) : ''}: pass ahead`} onClose={() => setMenu(null)}>
          <p class="dim">It ends early if the other player casts or activates something, or one of their abilities triggers. Both players will see it on your stats bar, as saying "no responses" would at a table.</p>
          <div class="menu">
            <button class="btn" onClick={() => { setMenu(null); send({ kind: 'pass' }, { ahead: 'combat', fromBar: off }); }} data-testid="pass-combat">Pass this combat</button>
            <button class="btn" onClick={() => { setMenu(null); send({ kind: 'pass' }, { ahead: 'turn', fromBar: off }); }} data-testid="pass-turn">Pass until end of turn</button>
          </div>
        </Sheet>
      )}
      {menu === 'resign' && (
        <Sheet title="Resign" onClose={() => setMenu(null)}>
          <p>Resign as <b>{playerName(s, me)}</b>? {playerName(s, other(me))} wins the game.</p>
          <div class="row">
            <button class="btn" onClick={() => setMenu(null)}>Cancel</button>
            <button class="btn primary" data-testid="confirm-resign" onClick={() => {
              const next = resignGame(session, me);
              setMenu(null);
              if ('refused' in next) setToast(next.refused); else onChange(next);
            }}>Resign</button>
          </div>
        </Sheet>
      )}
      {menu === 'log' && (
        <Sheet title="Log" onClose={() => setMenu(null)}>
          <ol class="log" data-testid="log">{[...s.events].reverse().slice(0, 300).map((e, i) => <li key={i}><span class="dim">T{e.turn}</span> {e.text}</li>)}</ol>
        </Sheet>
      )}
      {menu === 'undo' && lastManual && (
        <Sheet title="Undo" onClose={() => setMenu(null)}>
          <p>Undo {playerName(s, lastManual.player)}'s {lastManual.choice.kind}?</p>
          <div class="row"><button class="btn" onClick={() => setMenu(null)}>Cancel</button><button class="btn primary" onClick={doUndo} data-testid="confirm-undo">Undo</button></div>
        </Sheet>
      )}
    </div>
  );
}

