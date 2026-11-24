# Travel Tabletop v3

<p align="center">
  <img src="docs/images/board-v3-mockup.jpg" width="720" alt="Mockup of the v3 board on a phone, three moments: casting with the centre band lit, a hand-off with three spells on the stack and their target rings, and ordering three triggers">
</p>

A rules-enforcing Magic: The Gathering game that runs as an offline web app on phones and tablets.
Two players share one device; the app runs every turn, step and priority pass, pays mana, resolves
combat and tallies every number, and allows only legal moves. It plays the Avatar card pool: each
deck is three of the 76 twenty-card Beginner Box and Jumpstart packets.

**Status:** in design and early development. The board above is a mockup. The current version of
the app is [v2](https://github.com/pikalaw/travel-tabletop), the rules-free playmat.

**Site:** https://pikalaw.github.io/travel-tabletop-v3/

## Docs

- [Product requirements](docs/prd.md)
- [Technical design](docs/technical-design.md), with the build order (M0–M5)
- [All docs and assets](docs/README.md)

## Run it

```sh
npm install
npm run dev          # development server with hot reload
npm run build        # type check, then build into dist/
npm run preview      # serve dist/ at http://localhost:4173/travel-tabletop-v3/, as GitHub Pages will
```

## Check it

```sh
npm run typecheck && npm run lint && npm test && npm run e2e
```

Every push runs the same checks on GitHub Actions; a push to `main` that passes them is published
to GitHub Pages.

Strict TypeScript, built with Vite; Preact for the UI; Vitest with fast-check, and Playwright.
