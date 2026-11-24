"""Render the three v3 board mockup frames and the side-by-side image in ../images/.

Usage: python3 render.py <unzipped v2 deck export>
The card images come from the export's images/ folder; cards.json maps card names to them.
Needs Playwright (with Chromium) and Pillow.
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
EXPORT = pathlib.Path(sys.argv[1]).resolve()
OUT = HERE.parent / "images"
BUILD = HERE / "build"; BUILD.mkdir(exist_ok=True)
IMG = json.loads((HERE / "cards.json").read_text())
def src(name): return (EXPORT / "images" / f"{IMG[name]}.jpg").as_uri()

CSS = (HERE / "style.css").read_text()
ARROW = """
const a=document.querySelector('.sitem.top'), t=document.getElementById('tgt');
if(a&&t){const s=document.getElementById('arrow');const r1=a.getBoundingClientRect(),r2=t.parentElement.getBoundingClientRect();
const x1=r1.left+r1.width*0.35,y1=r1.bottom,x2=r2.left+r2.width/2,y2=r2.top+r2.height*0.35;
s.innerHTML='<defs><marker id=h markerWidth=8 markerHeight=8 refX=6 refY=4 orient=auto><path d=\"M0,0 L8,4 L0,8 z\" fill=\"#ff7b5f\"/></marker></defs><path d=\"M'+x1+','+y1+' Q'+(x1-30)+','+((y1+y2)/2)+' '+x2+','+y2+'\" stroke=\"#ff7b5f\" stroke-width=3 fill=none stroke-dasharray=\"6 4\" marker-end=\"url(#h)\"/>';}
"""

def card(name, pt=None, cls="", extra=""):
    b = f'<span class="pt {cls}">{pt}</span>' if pt else ""
    return f'<div class="card">{extra}<img src="{src(name)}">{b}</div>'

def pips(spec):  # "RRr" -> lowercase = tapped
    return "".join(f'<span class="pip {c.upper()}{" off" if c.islower() else ""}">{c.upper()}</span>' for c in spec)

def lands(chips, open_):
    cs = "".join(f'<span class="chip">{pips(p)}{n}</span>' for n, p in chips)
    return f'<div class="lands">{cs}<span class="avail">open {pips(open_)}</span></div>'

def stats(name, life, hand, lib, grave, exile, mine, glow=False):
    h = f'<span class="handchip{" mine" if mine else ""}">Hand <b>{hand}</b>{" 👁" if mine else ""}</span>'
    g = " glow" if glow else ""
    return (f'<div class="stats"><span class="name">{name}</span><span class="life">♥ {life}</span>{h}'
            f'<span class="icons"><span class="ic">Lib <b>{lib}</b></span><span class="ic{g}">Grave <b>{grave[0]}</b> · L{grave[1]}</span>'
            f'<span class="ic">Exile <b>{exile}</b></span></span></div>')

def sitem(name, who, what, cls=""):
    return (f'<div class="sitem {cls}"><img src="{src(name)}"><div class="st"><b>{what}</b>'
            f'<span class="dim">{who}</span></div></div>')

CLAIRE_FIELD = card("Iroh, Firebending Instructor", "2/2") + card("Pretending Poxbearers", "2/1") + card("Corrupt Court Official", "1/1")

def page(cls, band, me_field, me_lands, me_stats, hand, foot, opp_lands, opp_hand=6):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body class="{cls}">
<div class="half opp">{stats("Claire", 20, opp_hand, 44, (3, 1), 1, False)}{opp_lands}<div class="field">{CLAIRE_FIELD}</div></div>
{band}
<div class="half me"><div class="field {cls}f">{me_field}</div>{me_lands}{me_stats}</div>
{hand}
<div class="foot">{foot}</div><svg id="arrow" class="arrow"></svg><script>{ARROW}</script></body></html>"""

atk = '<span class="atk">⚔</span>'
blk = '<span class="atk blk">⛨</span>'

# 1. Acting: empty stack, dragging Sokka's Sword Training; band lit as Cast.
acting = page(
    "acting",
    '<div class="band thin lit"><span class="emptyturn">T3 · Lawrence · Blockers</span>'
    '<span class="castzone">▾ Cast: drop here or on a target</span></div>',
    card("Sokka, Lateral Strategist", "2/4", extra=atk) + card("Ostrich-Horse", "3/1") + card("Avatar Enthusiasts", "2/2"),
    lands([("Plains ×4", "WWWW"), ("Forest ×2", "GG")], "WWWWGG"),
    stats("Lawrence", 18, 4, 41, (5, 3), 0, True, glow=True),
    '<div class="hand"><div class="card can lifted"><img src="' + src("Sokka's Sword Training") + '"></div>'
    '<div class="card can"><img src="' + src("Cloudshift") + '"></div>'
    '<div class="card no"><img src="' + src("Aang's Defense") + '"></div>'
    '<div class="card no"><img src="' + src("Forest") + '"></div></div>',
    '<span class="say"><b>Lawrence</b>, you have priority.<br>Pass: combat damage.</span><span class="btn primary">Pass</span>',
    lands([("Mountain ×3", "RRR"), ("Thriving Moor", "B")], "RRRB"),
)

# 2. Hand-off: three items on the stack, Lawrence's hand folded away.
handoff = page(
    "handoff",
    '<div class="band tall"><div class="bandhead"><span class="turn">T3 · Lawrence · Blockers</span>'
    '<span class="stackn">Stack 3 · resolves first ◂</span></div><div class="srow">'
    + sitem("Cloudshift", "Lawrence · target Sokka", "◎1 Cloudshift", "top")
    + sitem("Combustion Technique", "Claire · target Sokka", "◎2 Combustion Technique")
    + sitem("Sokka's Sword Training", "Lawrence · target Sokka", "Sokka's Sword Training")
    + "</div></div>",
    card("Sokka, Lateral Strategist", "2/4", extra=atk + '<span class="rings" id="tgt"><span class="ring me">◎1</span><span class="ring opp">◎2</span><span class="ring me">◎3</span></span>') + card("Ostrich-Horse", "3/1") + card("Avatar Enthusiasts", "2/2"),
    lands([("Plains ×4", "wwWW"), ("Forest ×2", "GG")], "WWGG"),
    stats("Lawrence", 18, 2, 41, (5, 3), 0, True),
    '<div class="hand folded"></div>',
    '<span class="say"><b>Claire to act:</b> Lawrence cast Cloudshift.<br>Pass: it resolves.</span>'
    '<span class="btn">Look</span><span class="btn primary">Pass</span>',
    lands([("Mountain ×3", "rrR"), ("Thriving Moor", "B")], "RB"),
    opp_hand=5,
)

# 3. Ordering: Jet entered; three of Lawrence's triggers wait to be ordered.
ordering = page(
    "ordering",
    '<div class="band tall"><div class="bandhead"><span class="turn">T5 · Lawrence · Main 1</span>'
    '<span class="stackn">3 triggers to order · resolves first ◂</span></div><div class="srow">'
    + sitem("Haru, Hidden Talent", "Earthbend 1 · Forest", "Haru", "pending")
    + sitem("Jet, Freedom Fighter", "Damage = creatures · Iroh", "Jet", "pending lifted")
    + sitem("Avatar Enthusiasts", "+1/+1 counter", "Enthusiasts", "pending")
    + "</div></div>",
    card("Jet, Freedom Fighter", "3/1") + card("Haru, Hidden Talent", "1/1") + card("Avatar Enthusiasts", "2/2") + card("Sokka, Lateral Strategist", "2/4"),
    lands([("Plains ×4", "wwwW"), ("Forest ×2", "gg")], "W"),
    stats("Lawrence", 18, 3, 39, (5, 3), 0, True),
    '<div class="hand"><div class="card no"><img src="' + src("Cloudshift") + '"></div>'
    '<div class="card no"><img src="' + src("Aang\'s Defense") + '"></div>'
    '<div class="card no"><img src="' + src("Forest") + '"></div></div>',
    '<span class="say"><b>Lawrence:</b> order your triggers.<br>Drag one up to lift it, then slide.</span>'
    '<span class="btn primary">Accept order</span>',
    lands([("Mountain ×3", "RRR"), ("Thriving Moor", "B")], "RRRB"),
)

shots = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    for name, html in [("mockup-acting", acting), ("mockup-handoff", handoff), ("mockup-ordering", ordering)]:
        f = BUILD / f"{name}.html"; f.write_text(html)
        pg.goto(f.as_uri()); pg.wait_for_timeout(300)
        out = BUILD / f"{name}.png"; pg.screenshot(path=str(out)); shots.append(out)
        Image.open(out).convert("RGB").save(OUT / f"{name}.jpg", quality=85, optimize=True)
    b.close()

ims = [Image.open(s) for s in shots]
gap = 40
W = sum(i.width for i in ims) + gap * (len(ims) + 1)
H = ims[0].height + gap * 2
canvas = Image.new("RGB", (W, H), (230, 230, 226))
x = gap
for i in ims:
    canvas.paste(i, (x, gap)); x += i.width + gap
canvas.save(OUT / "board-v3-mockup.jpg", quality=85, optimize=True)
print("ok")
