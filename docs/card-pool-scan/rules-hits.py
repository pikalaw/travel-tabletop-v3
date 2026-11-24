import json, sys, collections, re
m = json.load(open(sys.argv[1]))
defs = {d['id']: d for d in m['defs']}
used = {c for d in m['decks'] if d['kind']=='deck' for c in d['cards']}
def text(i):
    r=(defs[i].get('text') or {}).get('record') or {}
    if r.get('card_faces'): return '\n'.join(f.get('oracle_text','') for f in r['card_faces'])
    return r.get('oracle_text','')
cards={defs[i]['name']:text(i) for i in used if 'Basic Land' not in ((defs[i].get('text') or {}).get('record') or {}).get('type_line','')}
pats={
 'copy':r'\bcop(y|ies)\b','gain control':r'gain control|exchange control','replacement (instead)':r'\binstead\b',
 'cast/play from other zone':r'(cast|play) (it|that card|cards?|spells?|this card)[^.]*from|may cast [^.]* from|from (your|their|a) graveyard[^.]*(cast|play)|without paying',
 'prevent':r'\bprevent','X cost/value':r'\{X\}|\bX\b','modal':r'Choose (one|two|three|any)',
 'counter spell':r'counter target','extra turn/combat':r'extra turn|additional combat','double':r'\bdouble',
 'can\'t (restrictions)':r"can't",'for each':r'for each','until end of turn':r'until end of turn',
 'this turn (history)':r'this turn','your graveyard':r'graveyard','search library':r'search your library','reveal':r'\breveal',
 'Lesson refs':r'Lesson','airbend':r'airbend','earthbend':r'earthbend','waterbend':r'waterbend','firebending':r'firebending',
 'exhaust':r'Exhaust','saga chapter':r'\b(I|II|III|IV)\b —','crew':r'Crew','equip':r'Equip','aura':r'Enchant (creature|land|permanent|artifact)',
 'tokens made':r'create','Food/Clue/Treasure':r'Food|Clue|Treasure','sacrifice':r'sacrifice','discard':r'discard','opponent choices':r'(opponent|that player|target player) (chooses|discards|sacrifices|reveals)',
 'cost reduction':r'costs? \{\d\} less|cost \{\d\} less|less to cast','"becomes" type change':r'becomes? (a|an) [^.]*(creature|land|artifact)','protection/hexproof/ward':r'protection from|hexproof|Ward',
 'damage division':r'divided as you choose|distribute','storm/affinity/flashback/kicker':r'Storm|Affinity|Flashback|Kicker',
 'loses abilities/set P/T':r'loses all abilities|base power and toughness','switch P/T':r'switch',
}
res={}
for k,p in pats.items():
    hits=[n for n,t in cards.items() if re.search(p,t,re.I if k not in ('saga chapter',) else 0)]
    res[k]=hits
    print(f'{k:32} {len(hits):3}  e.g. {", ".join(sorted(hits)[:4])}')
json.dump({k:sorted(v) for k,v in res.items()},open('hits.json','w'),indent=1)
json.dump(cards,open('cards_text.json','w'),indent=1)
print(len(cards),'non-basic cards')
