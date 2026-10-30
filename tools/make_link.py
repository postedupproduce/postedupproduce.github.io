"""Personal link maker (Oct 29, Sol): every person or group gets its own link, preview image and vibe.
Usage: python3 tools/make_link.py SLUG "Kicker" "Headline" "Line" TARGET [--vibe sosiego|market]
Makes /p/SLUG/index.html (own og:title/og:image, then forwards to TARGET) and /p/SLUG/og.png.
TARGET is a site path with its own ?for= / ?s= tags, e.g. /luna/next/?for=nathalys&s=luna-nathalys
Needs Playwright (preinstalled in Claude's workspace)."""
import sys, os, html, subprocess, json
slug, kicker, headline, line, target = sys.argv[1:6]
vibe = sys.argv[7] if len(sys.argv) > 7 and sys.argv[6] == "--vibe" else "sosiego"
V = {"sosiego": dict(bg="#2C2937", ink="#EEE9F3", k="#E8D6A2", s="#D9D3E2", b="#9DBA9F", moon=True),
     "market": dict(bg="#24392C", ink="#F4ECD9", k="#F3D58A", s="#E4DCC8", b="#F3D58A", moon=False)}[vibe]
e = html.escape
card = f"""<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Figtree:wght@500;700&display=swap" rel="stylesheet"><style>
body{{margin:0;width:1200px;height:630px;background:{V['bg']};color:{V['ink']};font-family:Figtree,sans-serif;position:relative;overflow:hidden}}
.moon{{position:absolute;right:120px;top:120px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle at 38% 35%,#FFF9EA,#E8D6A2 58%,#CDB577);box-shadow:0 0 120px rgba(232,214,162,.35)}}
.t{{position:absolute;left:80px;top:96px;width:{680 if V['moon'] else 1000}px}}
.k{{font:700 30px/1.2 Figtree;color:{V['k']};margin:0 0 26px}}
h1{{font:400 70px/1.05 "Alfa Slab One";margin:0}}
.s{{font:500 28px/1.35 Figtree;margin:24px 0 0;color:{V['s']}}}
.b{{position:absolute;left:80px;bottom:56px;font:700 26px/1 Figtree;color:{V['b']}}}
</style></head><body>{'<div class="moon"></div>' if V['moon'] else ''}
<div class="t"><p class="k">{e(kicker)}</p><h1>{e(headline)}</h1><p class="s">{e(line)}</p></div>
<p class="b">Posted Up Produce, Chicago</p></body></html>"""
d = f"p/{slug}"; os.makedirs(d, exist_ok=True)
open("/tmp/_card.html", "w").write(card)
js = "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:630}});await p.goto('file:///tmp/_card.html');await p.waitForTimeout(2500);await p.screenshot({path:%s});await b.close()})()" % json.dumps(os.path.abspath(f"{d}/og.png"))
subprocess.run(["node", "-e", js], check=True)
url = "https://postedupproduce.github.io"
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(headline)} · Posted Up Produce</title>
<meta name="robots" content="noindex">
<meta property="og:title" content="{e(headline)}">
<meta property="og:description" content="{e(line)}">
<meta property="og:image" content="{url}/p/{slug}/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url={e(target)}">
<style>body{{margin:0;background:{V['bg']};color:{V['ink']};font:17px/1.5 system-ui;display:grid;place-items:center;min-height:100vh}}a{{color:inherit}}</style>
</head><body><p><a href="{e(target)}">Opening your page</a></p>
<script>location.replace({json.dumps(target)})</script></body></html>"""
open(f"{d}/index.html", "w").write(page)
print(f"{url}/p/{slug}/")
