import json, sys, collections, re
m = json.load(open(sys.argv[1]))
defs = {d['id']: d for d in m['defs']}
tokdeck = {c for d in m['decks'] if d['kind']=='token' for c in d['cards']}
used = collections.Counter(c for d in m['decks'] if d['kind']=='deck' for c in d['cards'])
recs = {}
for i,d in defs.items():
    r = (d.get('text') or {}).get('record') or {}
    recs[i]=r
C=collections.Counter
print('sets', C(r.get('set') for r in recs.values()))
print('set names', C(r.get('set_name') for r in recs.values()))
print('layouts', C(r.get('layout') for r in recs.values()))
print('in decks:', len(used), 'unique; in token decks:', len(tokdeck), '; neither:', len(set(defs)-set(used)-tokdeck))
nonbasic=[i for i in used if 'Basic Land' not in (recs[i].get('type_line') or '')]
print('non-basic unique in decks', len(nonbasic))
types=C()
for i in nonbasic:
    tl=recs[i].get('type_line','')
    main=tl.split('—')[0]
    for t in ['Creature','Instant','Sorcery','Enchantment','Artifact','Land','Planeswalker','Battle','Kindred']:
        if t in main: types[t]+=1
    if 'Legendary' in main: types['(Legendary)']+=1
print('types', types)
print('rarity', C(recs[i].get('rarity') for i in nonbasic))
print('colors', C(''.join(recs[i].get('colors') or []) or 'C' for i in nonbasic))
kw=C(k for i in nonbasic for k in recs[i].get('keywords') or [])
print('keywords', kw.most_common())
sub=C()
for i in nonbasic:
    tl=recs[i].get('type_line','')
    if '—' in tl: 
        for s in tl.split('—')[1].split(): sub[s]+=1
print('subtypes top', sub.most_common(40))
print('mana values', sorted(C(recs[i].get('cmc') for i in nonbasic).items()))
neither=set(defs)-set(used)-tokdeck
print('neither:', [defs[i]['name'] for i in neither][:30])
