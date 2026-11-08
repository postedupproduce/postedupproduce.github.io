#!/usr/bin/env python3
"""Posted Up site check (Nov 7, 2026). Walks the site like a stranger on an iPhone and prints a pass/fail report.

Usage:
  python3 tools/site_check.py                      # live site
  python3 tools/site_check.py http://localhost:8765 # a local copy (python3 -m http.server 8765 from the repo root)
  python3 tools/site_check.py --order              # also submit a stubbed order (never reaches the sheet)

Needs: pip install playwright && playwright install chromium (or set CHROME=/path/to/chrome).
The order endpoint (script.google.com) and Square are always stubbed, so nothing real is submitted or logged.
"""
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright

BASE = next((a for a in sys.argv[1:] if a.startswith("http")), "https://postedupproduce.github.io").rstrip("/")
DO_ORDER = "--order" in sys.argv
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
PAGES = ["/", "/how/", "/faq/", "/join/", "/services/", "/play/", "/winter/", "/go/", "/days/", "/pay/?o=12345&a=50", "/track.html?o=12345", "/thanks.html"]
BANNED = ["organic ", "certified organic", "no middleman"]  # public-copy rule: never claim these; "organic" only inside the certification sentence
posted = []

async def stub(route):
    u = route.request.url
    if "script.google.com" in u:
        if route.request.method == "POST":
            try: posted.append(json.loads(route.request.post_data or "{}"))
            except Exception: posted.append({})
        await route.fulfill(status=200, content_type="application/json", body='{"cap":5,"counts":{}}' if "q=counts" in u else '{"ok":false}')
    elif "square.link" in u:
        await route.fulfill(status=200, body="<html>stub</html>")
    else:
        await route.continue_()

def ok(cond, label, detail=""):
    print(("PASS " if cond else "FAIL ") + label + (f"  ({detail})" if detail else ""))
    return bool(cond)

async def main():
    fails = 0
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path=os.environ.get("CHROME") or None, headless=True)
        c = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=UA, timezone_id="America/Chicago")
        await c.route("**/*", stub)
        errs = []
        p = await c.new_page()
        p.on("pageerror", lambda e: errs.append(str(e)))
        p.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)

        # 1. every page loads, no overflow, Beta pill, no banned words
        for pg in PAGES:
            r = await p.goto(BASE + pg + ("&" if "?" in pg else "?") + "v=" + str(int(time.time())), wait_until="domcontentloaded")
            await p.wait_for_timeout(600)
            d = await p.evaluate("()=>({ov:document.documentElement.scrollWidth>document.documentElement.clientWidth, beta:/\\bBeta\\b/i.test(document.body.innerText), text:document.body.innerText.toLowerCase()})")
            fails += not ok(r and r.status == 200 and not d["ov"], f"page {pg}", f"status {r.status if r else None}, overflow {d['ov']}")
            if pg in ("/", "/how/", "/faq/", "/join/"):
                fails += not ok(d["beta"], f"  Beta pill on {pg}")
            bad = [w for w in BANNED if w in d["text"] and not ("organic" in w and "certification" in d["text"])]  # "organic" is fine only inside the certification sentence
            fails += not ok(not bad, f"  public-copy words on {pg}", ",".join(bad))

        # 2. stranger path: /how/?s=ref-check -> gate -> sticky -> #shop lands on Half Peck, no splash
        await p.goto(BASE + "/how/?s=ref-check&from=Check"); await p.wait_for_timeout(900)
        g = await p.evaluate("()=>({shown:!!document.getElementById('gate')&&!document.getElementById('gate').hidden, h:document.getElementById('gateH')?.textContent})")
        fails += not ok(g["shown"] and g["h"] == "Check sent you here.", "gate for ref link", g["h"])
        await p.click("#gateGo"); await p.wait_for_timeout(600)
        links = await p.evaluate("()=>[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')))].filter(h=>!/^(sms:|mailto:|https?:\\/\\/fonts)/.test(h))")
        bad = []
        for h in links:
            u = h if h.startswith("http") else (BASE + "/" if h.startswith("..") else BASE + h.split("#")[0])
            q = await c.new_page()
            try:
                r = await q.goto(u, wait_until="domcontentloaded", timeout=20000)
                if not r or r.status != 200: bad.append(h)
            except Exception: bad.append(h)
            await q.close()
        fails += not ok(not bad, f"links on /how/ ({len(links)})", ",".join(bad))
        how = await p.evaluate("()=>({tabs:[...document.querySelectorAll('.tabs a')].filter(a=>a.getBoundingClientRect().width>0).length, bar:document.getElementById('stickbar')?.classList.contains('show'), reel:[...document.querySelectorAll('.reel img')].filter(i=>i.naturalWidth>0).length, why:!!document.querySelector('.sign .why')})")
        fails += not ok(how["tabs"] == 4 and how["bar"] and how["reel"] == 5 and how["why"], "/how/ ref view", json.dumps(how))
        await p.click("#stickShop"); await p.wait_for_load_state(); await p.wait_for_timeout(1800)
        shop = await p.evaluate("()=>{const c=[...document.querySelectorAll('.bcard')].find(e=>/^Half Peck/.test(e.querySelector('h3')?.textContent||''));return {splash:!!(document.getElementById('pu-show')||document.getElementById('pu-dsplash')), hpTop:c?Math.round(c.getBoundingClientRect().top):null, src:sessionStorage.getItem('pu-src')}}")
        fails += not ok(not shop["splash"] and shop["hpTop"] is not None and shop["hpTop"] < 200 and shop["src"] == "ref-check", "#shop landing", json.dumps(shop))

        # 3. money: Half Peck pickup $45, delivery $58, Game Day Kit not discounted
        hp = await p.evaluate_handle("()=>[...document.querySelectorAll('.bcard')].find(e=>/^Half Peck/.test(e.querySelector('h3')?.textContent||'')).querySelector('button')")
        await hp.as_element().click(); await p.wait_for_timeout(700)
        await p.select_option("#fulfill", "goose")
        t1 = await p.evaluate("()=>(document.body.innerText.match(/Total\\n\\$[\\d.]+/)||[''])[0]")
        fails += not ok(t1 == "Total\n$45", "Half Peck pickup = $45 (founder)", t1.replace("\n", " "))
        await p.select_option("#fulfill", "del-hyde"); await p.wait_for_timeout(400)
        t2 = await p.evaluate("()=>(document.body.innerText.match(/Total\\n\\$[\\d.]+/)||[''])[0]")
        fails += not ok(t2 == "Total\n$58", "Half Peck + Hyde Park delivery = $58 (no founder)", t2.replace("\n", " "))
        gd = await p.query_selector("#gdShop [data-gd]")
        if gd:
            await p.select_option("#fulfill", "goose"); await gd.click(); await p.wait_for_timeout(500)
            t3 = await p.evaluate("()=>(document.body.innerText.match(/Total\\n\\$[\\d.]+/)||[''])[0]")
            fails += not ok(t3 == "Total\n$120", "Half Peck + Game Day Kit Feeds 12 = $120", t3.replace("\n", " "))

        # 4. optional stubbed order
        if DO_ORDER:
            await p.fill("#name", "Site Check"); await p.fill("#phone", "7735550100")
            await p.evaluate("()=>{const c=document.getElementById('agree');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}")
            await p.click("button:has-text('Get my order ticket')"); await p.wait_for_timeout(2500)
            done = await p.evaluate("()=>({done:/Order in! Last step: pay/.test(document.body.innerText), memo:(document.body.innerText.match(/POSTED #\\d+/)||[''])[0]})")
            o = [x for x in posted if x.get("orderNo")]
            fails += not ok(done["done"] and o and "ref-check" in str(o[0].get("notes", "")), "stubbed order ticket + sheet row", json.dumps(done))

        fails += not ok(not errs, "no console errors", "; ".join(errs[:3]))
        await b.close()
    print(f"\n{'ALL PASS' if not fails else str(fails)+' FAIL(S)'}  ·  {BASE}")
    sys.exit(1 if fails else 0)

asyncio.run(main())
