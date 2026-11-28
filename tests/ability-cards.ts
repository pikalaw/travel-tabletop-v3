/**
 * Made-up cards with scripts, one per rule the M2 tests exercise. They use only the vocabulary,
 * as real card scripts will.
 */
import type { CardScript } from '../src/engine/abilities';
import { parseCost } from '../src/engine/mana';
import type { Printed } from '../src/engine/types';
import { CARDS } from './engine-support';

function card(name: string, cost: string, typeLine: string, script: Omit<CardScript, 'oracleId' | 'name'>, pt?: [number, number], keywords: string[] = []): Printed {
  const [left = '', right = ''] = typeLine.split('—').map((x) => x.trim());
  const words = left.split(/\s+/);
  const supers: string[] = words.filter((w) => w === 'Legendary' || w === 'Basic');
  return {
    name, oracleId: name, manaCost: parseCost(cost), supertypes: supers, types: words.filter((w) => !supers.includes(w)),
    subtypes: right ? right.split(/\s+/) : [], ...(pt ? { power: pt[0], toughness: pt[1] } : {}), keywords, text: '',
    script: { oracleId: name, name, ...script },
  };
}

export const ABILITY_CARDS: Record<string, Printed> = {
  ...CARDS,
  // Spells.
  shock: card('Shock', '{R}', 'Instant', { spell: { targets: [{ any: true }], effects: [{ damage: 2, to: { target: 0 } }] } }),
  growth: card('Giant Growth', '{G}', 'Instant', { spell: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ pump: { target: 0 }, power: 3, toughness: 3, duration: 'endOfTurn' }] } }),
  frog: card('Turn to Frog', '{1}{U}', 'Instant', { spell: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ continuous: { removeAllAbilities: true, setBase: [1, 1] }, on: { target: 0 }, duration: 'endOfTurn' }] } }),
  cancel: card('Cancel', '{1}{U}{U}', 'Instant', { spell: { targets: [{ objects: { zone: 'stack' } }], effects: [{ counterSpell: { target: 0 } }] } }),
  study: card('Quick Study', '{U}', 'Sorcery — Lesson', { spell: { effects: [{ draw: 'you', n: 1 }] } }),
  wither: card('Wither Away', '{B}', 'Instant', { spell: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ pump: { target: 0 }, power: -3, toughness: -3, duration: 'endOfTurn' }] } }),
  burnout: card('Burn Out', '{1}{R}', 'Instant', { spell: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ exileIfWouldDie: { target: 0 }, duration: 'endOfTurn' }, { damage: 3, to: { target: 0 } }] } }),
  stunner: card('Stun Shot', '{U}', 'Instant', { spell: { targets: [{ objects: { types: ['Creature'] } }], effects: [{ tap: { target: 0 } }, { addCounters: 'stun', n: 1, on: { target: 0 } }] } }),
  rally: card('Rally', '{W}', 'Instant', { spell: { effects: [{ createToken: 'soldierToken', n: 2 }] } }),
  musing: card('Musing', '{U}', 'Sorcery', { spell: { effects: [{ may: [{ draw: 'you', n: 2 }, { discard: 'you', n: 1 }], text: 'draw two cards, then discard a card' }] } }),
  // Permanents with static abilities.
  anthem: card('Glorious Anthem', '{1}{W}{W}', 'Enchantment', { statics: [{ effect: { affects: { all: { types: ['Creature'], controller: 'you' } }, modify: [1, 1] }, text: 'Creatures you control get +1/+1.' }] }),
  lord: card('Sky Lord', '{2}{W}', 'Creature — Bird', { statics: [{ effect: { affects: { all: { types: ['Creature'], controller: 'you', other: true } }, addKeywords: ['flying'] }, text: 'Other creatures you control have flying.' }] }, [1, 1]),
  muzzle: card('Mass Muzzle', '{2}{U}', 'Enchantment', { statics: [{ effect: { affects: { all: { types: ['Creature'], controller: 'opponent' } }, removeAllAbilities: true }, text: 'Creatures your opponents control lose all abilities.' }] }),
  cadet: card('Lesson Cadet', '{1}{R}', 'Creature — Human Soldier', {
    statics: [{ while: { exists: { subtypes: ['Lesson'], zone: 'graveyard', controller: 'you' } }, effect: { affects: 'self', addKeywords: ['first strike'] }, text: 'First strike as long as there\'s a Lesson card in your graveyard.' }],
    activated: [{ cost: { mana: '{2}' }, effects: [{ pump: 'self', power: 1, toughness: 0, duration: 'endOfTurn' }], text: '{2}: +1/+0 until end of turn.' }],
  }, [2, 2]),
  elf: card('Mana Elf', '{G}', 'Creature — Elf', { activated: [{ cost: { tap: true }, effects: [{ addMana: ['G'] }], mana: true, text: '{T}: Add {G}.' }] }, [1, 1]),
  pinger: card('Once Pinger', '{1}{R}', 'Creature — Human', { activated: [{ cost: { mana: '{1}' }, targets: [{ any: true }], effects: [{ damage: 1, to: { target: 0 } }], oncePerTurn: true, text: '{1}: 1 damage to any target. Activate only once each turn.' }] }, [1, 1]),
  // Permanents with triggered abilities.
  scholar: card('Scholar', '{1}{U}', 'Creature — Human', { triggered: [{ when: { enters: {} }, self: true, effects: [{ draw: 'you', n: 1 }], text: 'When ~ enters, draw a card.' }] }, [1, 1]),
  sparker: card('Sparker', '{1}{R}', 'Creature — Goblin', { triggered: [{ when: { enters: {} }, self: true, targets: [{ any: true }], effects: [{ damage: 1, to: { target: 0 } }], text: 'When ~ enters, it deals 1 damage to any target.' }] }, [1, 1]),
  assassin: card('Assassin', '{2}{B}', 'Creature — Human', { triggered: [{ when: { enters: {} }, self: true, targets: [{ objects: { types: ['Creature'], controller: 'opponent' } }], effects: [{ destroy: { target: 0 } }], text: 'When ~ enters, destroy target creature an opponent controls.' }] }, [1, 1]),
  mourner: card('Mourner', '{1}{B}', 'Creature — Human', { triggered: [{ when: { dies: { types: ['Creature'] } }, effects: [{ loseLife: 'opponent', n: 1 }], text: 'Whenever a creature dies, each opponent loses 1 life.' }] }, [1, 1]),
  martyr: card('Martyr', '{W}', 'Creature — Human', { triggered: [{ when: { dies: {} }, self: true, effects: [{ gainLife: 'you', n: 3 }], text: 'When ~ dies, you gain 3 life.' }] }, [1, 1]),
  monk: card('Prowess Monk', '{R}', 'Creature — Human Monk', {}, [1, 1], ['Prowess']),
  sentinel: card('Upkeep Sentinel', '{1}{W}', 'Creature — Human', { triggered: [{ when: { step: 'upkeep', whose: 'yours' }, if: { atLeast: { count: { types: ['Creature'], controller: 'you' } }, n: 3 }, effects: [{ gainLife: 'you', n: 5 }], text: 'At the beginning of your upkeep, if you control three or more creatures, you gain 5 life.' }] }, [1, 1]),
  herald: card('Herald', '{1}{W}', 'Creature — Human', { triggered: [{ when: { enters: { types: ['Creature'], controller: 'you', other: true } }, effects: [{ gainLife: 'you', n: 1 }], text: 'Whenever another creature you control enters, you gain 1 life.' }] }, [1, 1]),
  drummer: card('Drummer', '{1}{G}', 'Creature — Human', { triggered: [{ when: { enters: { types: ['Creature'], controller: 'you', other: true } }, effects: [{ addCounters: '+1/+1', n: 1, on: 'self' }], text: 'Whenever another creature you control enters, put a +1/+1 counter on ~.' }] }, [1, 1]),
  // Replacement effects.
  tapland: card('Slow Grove', '', 'Land — Forest', { replacements: [{ replace: { entersTapped: true }, text: '~ enters tapped.' }] }),
  hatchling: card('Hatchling', '{1}{G}', 'Creature — Beast', { replacements: [{ replace: { entersWithCounters: '+1/+1', n: 2 }, text: '~ enters with two +1/+1 counters.' }] }, [0, 0]),
  ground: card('Solid Ground', '{G}', 'Enchantment', { replacements: [{ replace: { moreCounters: '+1/+1', extra: 1, on: { controller: 'you' } }, text: 'If one or more +1/+1 counters would be put on a permanent you control, that many plus one are put on it instead.' }] }),
  // Tokens.
  soldierToken: { name: 'Soldier', oracleId: 'Soldier', manaCost: [], supertypes: [], types: ['Creature'], subtypes: ['Soldier'], power: 1, toughness: 1, keywords: [], text: '', token: true },
};
