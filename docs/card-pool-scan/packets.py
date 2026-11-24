import json, sys, collections, re
m = json.load(open(sys.argv[1]))
defs = {d['id']: d for d in m['defs']}
print('decks', len(m['decks']), 'defs', len(defs))
kinds = collections.Counter(d['kind'] for d in m['decks'])
print('deck kinds', kinds)
for d in m['decks']:
    print(f"  {d['kind']:6} {len(d['cards']):3} cmdr={len(d.get('commanders') or [])} {d['name']}")
