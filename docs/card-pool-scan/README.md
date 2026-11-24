# Card-pool scan

The one-off scan of the v2 deck export (9 November 2026) behind the PRD's "Card pool and set
mechanics" numbers. Each script takes the export's `manifest.json`:

| Script | Prints |
| --- | --- |
| `packets.py` | The decks in the export: 76 twenty-card packets (10 Beginner Box, 66 Jumpstart) and the two token decks |
| `pool.py` | Sets, card types, rarities, colours, keywords, subtypes and mana values of the cards in the packets |
| `rules-hits.py` | For each rules pattern (copy effects, replacement effects, earthbend, X costs, …) how many cards match, with examples; writes `hits.json` and `cards_text.json` |

```sh
python3 rules-hits.py path/to/unzipped-v2-export/manifest.json
```

- `hits.json`: rules pattern → the names of the cards that match it.
- `cards_text.json`: card name → Oracle text for the non-basic cards (337 names; the PRD counts 338 cards because one name has two printings).

The patterns are regular expressions over Oracle text, so a count is a first sort, not a ruling:
M0 replaces this with the real card-data build step and coverage report.
