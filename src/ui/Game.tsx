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
import type { Choice, ObjectId, PlayerId, Target } from '../engine/types';
import { other } from '../engine/types';
import { canRedo, canUndo, current } from '../host/controller';
import { acting, choose, handingOff, look, newInHand, redoLast, resignGame, undoLast, visibleHand, type Session } from '../host/session';
import { Board, type Marks } from './Board';
import { CardView, type CardAction } from './CardView';
import { colorVars } from './colors';
import { nextNeed, toChoice, withDrop, type Intent, type Need } from './flow';
import { Footer } from './Footer';
import { LogPanel, turnPlayer } from './LogPanel';
import { installLongPress } from './longpress';
import { beats, cardImage, playerName, siblings, type Beat } from './model';
import { BEAT_MS, BeatBanner, type Controls } from './Playback';
import { DecisionPrompt, IntentPrompt, type Answering } from './Prompts';
import { CardList, Sheet } from './Sheets';

const EMPTY: Marks = { selectable: new Set(), selected: new Set(), glow: new Set(), paying: new Set(), blocks: new Map(), fresh: new Set(), pulse: new Map() };

/** How long the new-turn banner shows. */
const TURN_FLASH_MS = 1800;

export function GameScreen({ session, colors, onChange, onExit, onRematch }: {
  session: Session; colors: Record<PlayerId, string>; onChange: (x: Session) => void; onExit: () => void; onRematch: (chooser: PlayerId) => void;
}) {
  const s = current(session.game);
  const d = s.decision;
  const actor = acting(session);
  const off = handingOff(session);
  const me = session.facing;
  const shown = visibleHand(session) === me;
  // The board faces whoever must act: during a hand-off it turns to them at once (blinded, no hand
  // showing), so the bottom half, the footer and the acting player are always the same colour.
  const bottom = off && actor ? actor : me;

  const [intent, setIntent] = useState<Intent | null>(null);
  const [picking, setPicking] = useState<Target[]>([]);
  const [viewing, setViewing] = useState<ObjectId | null>(null);
  /** When the full view shows a card as it was in an earlier state (a step being played back): that state's index. */
  const [viewAt, setViewAt] = useState<number | null>(null);
  // While a step is played back, the board shows that step's state: a card opened then is shown as it was.
  const playedAt = useRef<number | null>(null);
  const view = (id: ObjectId, at: number | null = null) => { setViewAt(at ?? playedAt.current); setViewing(id); };
  const [pile, setPile] = useState<{ p: PlayerId; pile: 'graveyard' | 'exile' } | null>(null);
  const [menu, setMenu] = useState<'menu' | 'undo' | 'ahead' | 'resign' | null>(null);
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
  const [logOpen, setLogOpen] = useState(false);
  /** Where the log's "since you last acted" lines start, for the player who just looked. */
  const [since, setSince] = useState<number | null>(null);

  // ----- playback (PRD, "Playing"): after a tap, each spell or ability that resolved and each round
  // of combat damage is shown in turn, about a second each, with what it changed pulsing. A tap skips.
  // A long press on any card opens its full view (longpress.ts).
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => (root.current ? installLongPress(root.current, view) : undefined), []);

  const states = session.game.states;
  const seen = useRef(states.length);
  // Playback starts paused on its first step: › steps, » runs the rest, ✕ or the player's next move ends it.
  const [play, setPlay] = useState<{ beats: Beat[]; k: number; auto: boolean } | null>(null);
  useEffect(() => {
    const before = seen.current;
    seen.current = states.length;
    if (states.length <= before) { setPlay(null); return; } // undo, or nothing new
    const bs = beats(states, before - 1, states.length - 1);
    setPlay(bs.length ? { beats: bs, k: 0, auto: false } : null);
  }, [states.length]);
  useEffect(() => {
    if (!play?.auto) return undefined;
    const t = setTimeout(() => setPlay((p) => (p && p.k + 1 < p.beats.length ? { ...p, k: p.k + 1 } : null)), BEAT_MS);
    return () => clearTimeout(t);
  }, [play]);
  // A new turn announces itself: "Turn 6 · Claire" sweeps across the board in her colour.
  const lastTurn = useRef(s.turn);
  const [turnFlash, setTurnFlash] = useState<number | null>(null);
  useEffect(() => {
    const before = lastTurn.current;
    lastTurn.current = s.turn;
    if (s.turn > before && s.turn > 0) {
      setTurnFlash(s.turn);
      const t = setTimeout(() => setTurnFlash(null), TURN_FLASH_MS);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [s.turn]);

  const beat = play?.beats[play.k];
  playedAt.current = beat ? beat.at : null;
  const controls: Controls = {
    next: () => setPlay((p) => (p && p.k + 1 < p.beats.length ? { ...p, k: p.k + 1 } : p)),
    auto: () => setPlay((p) => (p && p.k + 1 < p.beats.length ? { ...p, k: p.k + 1, auto: true } : p)),
    end: () => setPlay(null),
    running: !!play?.auto, last: !!play && play.k + 1 >= play.beats.length, view,
  };

  useEffect(() => {
    setAtk(new Set()); setBlocks(new Map()); setArmed(null); setChosen([]); setPicking([]);
    setOrder(d?.kind === 'triggerOrder' ? d.triggers : []);
    setSplit(d?.kind === 'damage' ? proposedSplit(s, s.objects[d.attacker]!) : {});
    if (d?.kind === 'arrange') setChosen([]);
  }, [s.seq]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); } return undefined; }, [toast]);

  const send = (c: Choice, opts: Parameters<typeof choose>[2] = {}) => {
    setPlay(null); // the player's move ends any playback
    const next = choose(session, c, opts);
    if ('refused' in next) { setToast(next.refused); return false; }
    setIntent(null); setPicking([]); setViewing(null);
    onChange(next);
    return true;
  };

  // ----- the cast or activation in progress
  const need: Need | null = intent && actor ? nextNeed(s, actor, intent) : null;
  const preview = intent && actor && need?.kind === 'confirm' ? paymentPreview(s, actor, toChoice(intent)) : null;
  // No confirm step when the payment only taps lands (and floating mana): Undo takes back a miscast.
  // It stays when the payment taps a creature or an artifact (waterbend) or converts mana, which
  // are easy to miss and costly to notice late.
  const plainPayment = !!preview && !preview.converted && preview.tapped.every((id) => {
    const c = characteristics(s, s.objects[id]!);
    return c.types.includes('Land') && !c.types.includes('Creature');
  });
  useEffect(() => { if (intent && plainPayment) send(toChoice(intent)); }, [intent, plainPayment]);
  const startIntent = (i: Intent, drop: Target | null = null) => {
    if (!actor) return;
    setViewing(null); setModes([]); setX(0); setPicking([]);
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
      case 'bottom': case 'discard': marks = { ...marks, selectable: new Set(s.zones[`${d.player}.hand`]), selected: new Set(chosen) }; break;
      case 'pick': marks = { ...marks, selectable: new Set(d.options), selected: new Set(chosen) }; break;
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
      case 'bottom': case 'discard': toggleChosen(t, d.count); return;
      case 'pick': toggleChosen(t, d.max); return;
      case 'legend': setChosen([t]); return;
      default: return;
    }
  };

  const handlers = {
    onCard: (id: ObjectId) => { if (marks.selectable.has(id)) onPick(id); else view(id); },
    onPlayer: (p: PlayerId) => onPick(p),
    onPile: (p: PlayerId, which: 'graveyard' | 'exile') => setPile({ p, pile: which }),
    onHandChip: () => (off && actor === me ? takeLook() : setFolded((f) => !f)),
    onDrop: (id: ObjectId, at: Target | null) => {
      if (!priorityHere || !actor) return;
      const o = s.objects[id]!;
      if (characteristics(s, o).types.includes('Land')) { send({ kind: 'play', object: id }); return; }
      const acts = legalActions(s);
      if (!acts.some((c) => c.kind === 'cast' && c.object === id)) { view(id); return; } // the full view says why
      startIntent({ kind: 'cast', object: id, targets: [] }, at);
    },
  };

  const onAction = (id: ObjectId, a: CardAction) => {
    if (a.kind === 'play') { send({ kind: 'play', object: id }); return; }
    if (a.kind === 'cast') startIntent({ kind: 'cast', object: id, targets: [] });
    else startIntent({ kind: 'activate', object: id, ability: a.ability, targets: [] });
  };

  // ----- Look: the acting player takes the device; the log marks what happened since they last acted
  function takeLook() {
    if (!actor) return;
    setPlay(null);
    const g = session.game;
    let i = g.record.choices.length - 1;
    while (i >= 0 && (g.record.choices[i]!.auto || g.record.choices[i]!.player !== actor)) i--;
    setSince(i >= 0 ? g.states[i + 1]!.events.length : null);
    onChange(look(session));
  }

  // ----- undo, with confirmation when it takes back the other player's decision
  const lastManual = [...session.game.record.choices].reverse().find((c) => !c.auto);
  const doUndo = () => { setPlay(null); setIntent(null); setMenu(null); onChange(undoLast(session)); };
  const askUndo = () => { if (lastManual && lastManual.player !== me) setMenu('undo'); else doUndo(); };

  // ----- the prompt panel
  const answering: Answering = { chosen, toggleChosen, atk, blocks, armed, split, setSplit, order, picking, onPick };
  const prompt = off || !d ? null
    : intent && need && actor ? <IntentPrompt {...{ s, actor, intent, need, setIntent, picking, setPicking, pickTarget, modes, setModes, x, setX, preview, plainPayment, send, confirm: toChoice(intent) }} />
    : <DecisionPrompt s={s} d={d} a={answering} send={send} />;

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
    <div class="game" data-facing={bottom} style={colorVars(colors)} ref={root}>
      <Board s={beat ? states[beat.at]! : s} ahead={session.game.ahead ?? {}} bottom={bottom} handShown={shown} handFolded={folded} marks={marks} h={handlers} {...(beat ? { band: <BeatBanner s={s} beat={beat} n={play!.k + 1} of={play!.beats.length} c={controls} /> } : orderBand ? { band: orderBand } : {})} />
      {turnFlash !== null && turnPlayer(s, turnFlash) && (
        <div class={`turn-flash ${turnPlayer(s, turnFlash)}`} data-testid="turn-flash" aria-live="polite">
          <span>Turn {turnFlash}</span><b>{playerName(s, turnPlayer(s, turnFlash)!)}</b>
        </div>
      )}
      {prompt}
      <Footer s={s} handoffTo={off ? actor : null} casting={!!intent} canUndo={canUndo(session.game)} lastManual={lastManual}
        onMenu={() => setMenu('menu')} onUndo={askUndo} onPassAhead={() => setMenu('ahead')} onPass={(fromBar) => send({ kind: 'pass' }, fromBar ? { fromBar } : {})}
        onLook={takeLook} onRematch={onRematch} onExit={onExit} />
      {toast && <div class="toast" data-testid="toast" onClick={() => setToast(null)}>{toast}</div>}
      {viewing && viewAt !== null && states[viewAt]?.objects[viewing] && (
        <CardView s={states[viewAt]!} id={viewing} actor={null} siblings={[viewing]} onAction={() => undefined} onNavigate={(id) => view(id, viewAt)} onClose={() => setViewing(null)} />
      )}
      {viewing && viewAt === null && s.objects[viewing] && <CardView s={s} id={viewing} actor={viewActor} siblings={siblings(s, viewing, shown ? me : null)} onAction={(a) => onAction(viewing, a)} onNavigate={(id) => view(id)} onClose={() => setViewing(null)} />}
      {pile && (
        <Sheet title={`${playerName(s, pile.p)}'s ${pile.pile}`} onClose={() => setPile(null)}>
          {pileIds.length ? <CardList s={s} ids={[...pileIds].reverse()} selectable={new Set()} selected={new Set()} onPick={() => undefined} onOpen={(id) => { setPile(null); view(id); }} /> : <p class="dim">Empty.</p>}
        </Sheet>
      )}
      {menu === 'menu' && (
        <Sheet title="Menu" onClose={() => setMenu(null)}>
          <div class="menu">
            <button class="btn" onClick={() => { setLogOpen((o) => !o); setMenu(null); }} data-testid="log-button">{logOpen ? 'Close the log' : 'Log'}</button>
            <button class="btn" disabled={!canRedo(session.game)} onClick={() => { setMenu(null); onChange(redoLast(session)); }}>Redo</button>
            {d && !off && <button class="btn" onClick={() => { setFolded(true); setMenu(null); }}>Hide my hand</button>}
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
      {logOpen && <LogPanel s={s} since={since} onClose={() => setLogOpen(false)} />}
      {menu === 'undo' && lastManual && (
        <Sheet title="Undo" onClose={() => setMenu(null)}>
          <p>Undo {playerName(s, lastManual.player)}'s {lastManual.choice.kind}?</p>
          <div class="row"><button class="btn" onClick={() => setMenu(null)}>Cancel</button><button class="btn primary" onClick={doUndo} data-testid="confirm-undo">Undo</button></div>
        </Sheet>
      )}
    </div>
  );
}

