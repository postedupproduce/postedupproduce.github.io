"""Personal hockey-family pages (Oct 31, Sol): /p/coach/ and /p/sue/.
Each page: its own splash, the boxes picked for that person (all shown before the main site),
then Build Your Own (/?mode=pick#shop) and the full site. Add buttons go to /?s=TAG&box=ID#checkout.
Run from the repo root: python3 tools/make_fam.py   (keeps each /p/SLUG/og.png from make_link.py)"""
import json, html, os

SITE = "https://postedupproduce.github.io"
BOX = {
  "halfpeck": dict(n="Half Peck", p=50, m="About 4 to 5 meals of veg for two",
    has=["2 lb orchard apples", "2 lb sweet potatoes", "2 lb beets", "Onions", "1 bunch kale", "1 delicata squash"]),
  "crate": dict(n="Full Crate", p=72, m="About 7 meals of veg for two, about $5 a plate",
    has=["4 lb orchard apples", "2 lb sweet potatoes", "2 lb beets", "Onions", "1 butternut squash", "About 1 lb Brussels sprouts", "Kale and collards, 2 bunches"]),
  "breakfast": dict(n="Breakfast Box", p=40, m="About 10 to 12 breakfasts, about $3.50 a plate",
    has=["2 lb stone-ground rolled oats (about 20 bowls)", "Oat pancake mix", "A dozen farm eggs", "2 lb apples or pears"]),
  "grits": dict(n="Grits & Greens Box", p=38, m="About 8 plates, about $4.75 a plate",
    has=["2 lb heirloom stone-ground grits", "Collards or kale, a bunch", "About half a pound of local mushrooms", "Onions and garlic", "Last peppers or a leek"]),
  "nocook": dict(n="I Don't Cook Box", p=75, m="About a week of no-cook eating for one",
    has=["A fresh loaf, bagels or challah", "A local cheese", "Salami or seasoned tofu", "One ferment: kimchi, sauerkraut or pickles", "Apples and pears", "A jam, pesto or hot sauce"]),
  "fruit": dict(n="Fruit Box · a week", p=36, m="About 16 pieces, a piece or two a day",
    has=["About 10 crisp apples", "About 4 pears or Asian pears", "A pint of local blueberries, frozen or dried"]),
  "meatbox": dict(n="Meat Lovers Box", p=89, m="About 14 portions, 7 meals for two, about $6.40 a plate", add=True,
    has=["Steak night, 10 to 12 oz, a meal for two", "An everyday cut, about 1 lb (pork chops or stew meat)", "1 lb ground, about 4 burgers", "1 lb sausage, about 4 to 5 links"]),
  "lakehaul": dict(n="Lake Haul", p=70, m="About 4 portions plus a smoked-fish snack", add=True,
    has=["2 wild Great Lakes fish fillets, 8 to 16 oz each (walleye, whitefish or lake trout)", "Smoked fish or fish pate, a snack for 2 to 4"]),
  "thanks": dict(n="Thanksgiving Sides Box", p=95, m="Sides for 6 to 8, with leftovers", until="2026-11-22",
    has=["Potatoes and sweet potatoes", "Butternut squash and a pie pumpkin", "Brussels sprouts, collards or kale", "Apples for pie", "Onions, shallots, garlic, celery", "Sage, thyme and rosemary"]),
}

PEOPLE = {
  "coach": dict(
    tag="hockey-coach", title="For Coach", splash="coach",
    og_t="Fuel for the whole bench.", og_d="Farmers market boxes, picked and packed for game week. Order by Friday 9 PM.",
    hello="For Coach", h1="Fuel for the whole bench.",
    note="Coach, I pulled these from this week's market with your crew in mind: early ice, long weekends, big appetites. Pick one and I'll shop it, pack it and get it to you.",
    sig="M, Posted Up Produce",
    picks=[
      ("crate", "Feeds the whole house", "The most cooking per dollar. A full week of veg for a hungry household."),
      ("meatbox", "For the big eaters", "Steak night, burgers, sausage and an everyday cut. Grass-fed and pasture-raised, frozen packs."),
      ("breakfast", "For early ice", "Oats and a dozen eggs. Breakfast is handled before 6 AM practice."),
      ("nocook", "For tournament weekends", "Nothing to cook. Grab it between games and go."),
      ("lakehaul", "For a lighter game night", "Wild Great Lakes fish, frozen packs. Lean protein that cooks in 15 minutes."),
      ("fruit", "For the rink bag", "Apples and pears that travel. Better than the vending machine."),
    ]),
  "sue": dict(
    tag="hockey-sue", title="For Sue and the hockey fam", splash="sue",
    og_t="Rink to table, without the stress.", og_d="Market boxes and light dinners for busy hockey weeks, picked and packed for you.",
    hello="For Sue and the hockey fam", h1="Rink to table, without the stress.",
    note="Sue, these are the ones I'd hand your family this week: real breakfasts, easy dinners after practice, and veg that makes your dad's light dinners simple. Pick one and I'll do the shopping.",
    sig="M, Posted Up Produce",
    picks=[
      ("halfpeck", "For Dad's light dinners", "Veg-heavy sides. Pair kale, squash or beets with a palm of lean protein for a light plate."),
      ("lakehaul", "Protein for Dad's light dinners", "Wild Great Lakes fish, frozen packs. A fillet plus Half Peck veg makes an easy light plate."),
      ("breakfast", "For the big breakfasts", "Oats, eggs and fruit for the meals that carry the day, and early ice times."),
      ("grits", "For after late practice", "Savory, warm and filling. Grits with greens and mushrooms, ready in 20 minutes."),
      ("meatbox", "For the hungry players", "Steak night, burgers, sausage and an everyday cut. About 7 dinners for two."),
      ("thanks", "For Thanksgiving", "Every side for the table, shopped Sat Nov 21. All of it keeps till Thursday."),
      ("fruit", "For the rink bag", "Apples and pears that travel. Snacks for the stands and the car ride home."),
    ]),
}

SPLASH = {
  "coach": """<div class="sp-board" aria-hidden="true"><div class="sb-top">GAME WEEK</div>
<div class="sb-row"><span class="sb-l">HOME</span><span class="sb-n" id="sbn">0</span></div>
<div class="sb-row"><span class="sb-l">HUNGRY</span><span class="sb-n">0</span></div><div class="sb-per">PER 3 · 20:00</div></div>
<p class="sp-k">For Coach</p><p class="sp-h">Fuel for the whole bench.</p>""",
  "sue": """<svg class="sp-rink" viewBox="0 0 300 160" aria-hidden="true"><rect x="6" y="6" width="288" height="148" rx="60" fill="#F4F9FC" stroke="#13263A" stroke-width="4"/>
<line x1="100" y1="8" x2="100" y2="152" stroke="#2A6FB0" stroke-width="6"/><line x1="200" y1="8" x2="200" y2="152" stroke="#2A6FB0" stroke-width="6"/>
<line x1="150" y1="8" x2="150" y2="152" stroke="#C8202F" stroke-width="4"/><circle cx="150" cy="80" r="20" fill="none" stroke="#2A6FB0" stroke-width="3"/>
<path d="M262 64 h16 v32 h-16" fill="none" stroke="#C8202F" stroke-width="4"/><g class="net-lamp"><circle cx="284" cy="52" r="7" fill="#C8202F"/></g>
<ellipse class="puck" cx="40" cy="80" rx="9" ry="6" fill="#13263A"/></svg>
<p class="sp-k">For Sue and the hockey fam</p><p class="sp-h">Rink to table.</p>"""}

TEMPLATE = open(os.path.join(os.path.dirname(__file__), "fam_template.html")).read()

for slug, c in PEOPLE.items():
    cards = []
    for bid, why_h, why in c["picks"]:
        b = BOX[bid]
        cards.append(dict(add=b.get("add", False), id=bid, n=b["n"], p=b["p"], m=b["m"], has=b["has"], until=b.get("until", ""), wh=why_h, why=why))
    cfg = dict(tag=c["tag"], cards=cards, splash=slug)
    e = html.escape
    out = (TEMPLATE
      .replace("{{TITLE}}", e(c["title"]))
      .replace("{{OG_T}}", e(c["og_t"])).replace("{{OG_D}}", e(c["og_d"]))
      .replace("{{OG_IMG}}", f"{SITE}/p/{slug}/og.png").replace("{{URL}}", f"{SITE}/p/{slug}/")
      .replace("{{HELLO}}", e(c["hello"])).replace("{{H1}}", e(c["h1"]))
      .replace("{{NOTE}}", e(c["note"])).replace("{{SIG}}", e(c["sig"]))
      .replace("{{SPLASH}}", SPLASH[c["splash"]]).replace("{{SPCLASS}}", "sp-" + c["splash"])
      .replace("{{TAG}}", c["tag"])
      .replace("{{CFG}}", json.dumps(cfg, ensure_ascii=False)))
    os.makedirs(f"p/{slug}", exist_ok=True)
    open(f"p/{slug}/index.html", "w").write(out)
    print(f"{SITE}/p/{slug}/")
