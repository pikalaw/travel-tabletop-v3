# Board mockup

`render.py` draws the three frames of the PRD's board mockup (acting, a hand-off with three items
on the stack, ordering triggers) with the real card images, screenshots them at 390×844, and writes
them to [`../images/`](../images/), with the three side by side as `board-v3-mockup.jpg`.

```sh
pip install playwright pillow && playwright install chromium
python3 render.py path/to/unzipped-v2-export
```

- `style.css`: the mockup's styles.
- `cards.json`: card name → image hash in the export's `images/` folder.
- `build/`: the generated HTML and full-size PNGs (not committed).

It is a static picture of the agreed layout, not app code.
