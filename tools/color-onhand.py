#!/usr/bin/env python3
"""Color on hand (R.onHand) for the weekly color report.

Starting count for each SureTint item = the newest of
  - Rose's Backbar count   (Stock Counts id 'b:<Brand>|<Line>|<Shade>')
  - a What To Order count  (Stock Counts id 'c:' + name lowercased, letters/digits only,
                            name = order-list item name or '<Line> <Shade>'; PR #151, Nov 2 2026)
then subtract only the SureTint usage weighed after that count.
R.order and R.prices are not touched here.

  from importlib.machinery import SourceFileLoader
  co = SourceFileLoader('co', 'tools/color-onhand.py').load_module()
  counts = co.latest_counts(rows, year=2026)          # rows = Stock Counts tab: Updated, Name, App ID, Item ID, Item, On hand
  R['onHand'] = co.on_hand(keys, counts, used_since, pace)
    keys       = (brand, line, shade) tuples from SureTint
    used_since = f(key, datetime) -> units weighed after that time
    pace       = f(key) -> units per week (last 4 weeks)
  Deliveries (Alexandra, Nov 9 2026: "the deliveries were already made a rule"): color that came in AFTER the count is
  added back, so restocked shades stop showing on the order list:
    got = co.received_from_orders(order_rows, keys, year=2026)   # order_rows = On Order sheet or the info@ order emails:
                                                                  # [Ordered, Store, Order #, Item, Qty, Status, Updated, ...]
    R['onHand'] = co.on_hand(keys, counts, used_since, pace, got)
"""
import math, re
from datetime import datetime

norm = lambda t: re.sub(r'[^a-z0-9]', '', str(t or '').lower())


def when(s, year):
    s = str(s or '').strip()
    for f in ('%a %b %d, %I:%M %p', '%a %b %d %Y, %I:%M %p', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%m/%d/%Y %H:%M:%S', '%m/%d/%Y', '%b %d, %Y', '%B %d, %Y', '%b %d'):
        try:
            d = datetime.strptime(s[:19] if 'T' in s else s, f)
            return d.replace(year=year) if '%Y' not in f else d
        except ValueError:
            pass
    return None


def latest_counts(rows, year):
    """{item id: (n, datetime)} keeping the newest row per id."""
    out = {}
    for r in rows:
        if len(r) < 6 or not str(r[3]).startswith(('b:', 'c:')):
            continue
        try:
            n = float(r[5])
        except (TypeError, ValueError):
            continue
        d = when(r[0], year)
        cid = same_item(r[3])
        if d and (cid not in out or d > out[cid][1]):
            out[cid] = (n, d)
    return out


def same_item(cid):
    """One id per real item. Alexandra Nov 28 2026: "hi lift blonde 11V is a can thats goldwell topchic", so Rose's
    'Topchic Tubes High Blond' count is the same cans the scale logs as 'Topchic Canister High Blond'."""
    cid = re.sub(r'^b:Goldwell\|Topchic Tubes High Blond\|', 'b:Goldwell|Topchic Canister High Blond|', str(cid))
    # Alexandra Nov 28 2026: "colorance lotion is the same as 7 vol cream developers": one item, System Cream Developer 7vol
    cid = re.sub(r'^b:Goldwell\|Goldwell Developers\|Colorance Lotion$', 'b:Goldwell|Goldwell Developers|System Cream Developer 7vol', cid)
    return 'c:systemcreamdeveloper7vol' if cid == 'c:colorancelotion' else cid


def item_name(key):
    """Name used on the order list and for its What To Order Count id ('c:' + norm(name))."""
    b, l, s = key
    tok = s.split(' ')[0] if re.search(r'\d', s.split(' ')[0]) else s
    if l == 'Shades EQ' and par_of(key):
        return 'Shades EQ ' + tok
    if l.startswith('Colorance Canister'):
        return 'Colorance ' + tok
    if l.startswith('Topchic Canister') and par_of(key):
        return 'Topchic ' + tok
    if l == 'Fast Color 10':
        return 'Alter Ego 10-minute ' + tok
    if l == 'Technofruit' and 'coactivator' in s.lower():   # the developer mixed with Fast Color 10 (Nov 27 2026)
        v = re.search(r'(\d+)\s*vol', s, re.I)
        return 'Alter Ego Fast 10 Coactivator' + (' %s Vol' % v.group(1) if v else '')
    if l == 'Technofruit' and par_of(key):
        return 'Alter Ego Technofruit ' + tok
    return s


def code_of(shade):
    """Shade code with leading zeros dropped, so SureTint's '10VV Lavender Ice' = the shelf's '010VV Lavender Ice'.
    None when the first word has no digit ('Blondor ...', 'Crystal Clear')."""
    m = re.match(r'0*(\d+)\s?([A-Z@][A-Za-z@]{0,4})?(?=\s|$)', str(shade).strip())   # '010 NB' = '010NB'
    if m:
        return (m.group(1) + (m.group(2) or '')).upper()
    t = str(shade).split(' ')[0]
    return t.lstrip('0').upper() if re.search(r'\d', t) else None


def backbar_id(key, counts):
    """Stock Counts Backbar id for a SureTint (brand, line, shade), or None. Exact name first; then the same brand, line
    and shade code (leading zeros ignored: 10VV = 010VV); then, only when there is exactly one, the same brand, the same
    line family (first word, e.g. 'Topchic Canister High Blond' = 'Topchic Canister Blonding Cream') and
    code. Found Nov 11 2026: these name differences kept counted shades under NOT COUNTED YET."""
    b, l, s = key
    exact = 'b:%s|%s|%s' % key
    if exact in counts:
        return exact
    c = code_of(s)
    if not c:
        return None
    same, family = [], []
    for cid in counts:
        if not cid.startswith('b:') or cid.count('|') != 2:
            continue
        cb, cl, cs = cid[2:].split('|')
        if cb != b or code_of(cs) != c:
            continue
        if cl == l:
            same.append(cid)
        elif cl.split(' ')[0] == l.split(' ')[0]:
            family.append(cid)
    if same:
        return max(same, key=lambda i: counts[i][1])
    return family[0] if len(family) == 1 else None


def start_count(key, counts):
    """Newest of the Backbar count and any What To Order count for this item: (n, datetime, source) or None."""
    b, l, s = key
    bid = backbar_id(key, counts)
    found = [(*counts[bid], 'backbar')] if bid else []
    # desk names use the short shade ('Shades EQ 09V'); Backbar keys carry the full name ('09V Platinum Iced')
    ids = {'c:' + norm(x + ' ' + y) for x in (l, b + ' ' + l, b, l.split(' ')[0], '') for y in {s, s.split(' ')[0]}} | {'c:' + norm(item_name(key))}
    # leading zeros ignored on desk counts too (Nov 27 2026: Rose's "Shades EQ 10P" count is the shelf's 010P)
    c, nm = code_of(s), item_name(key)
    if c and ' ' in nm:
        ids |= {'c:' + norm(nm.rsplit(' ', 1)[0] + ' ' + z + c) for z in ('', '0')}
    for cid in ids:
        if cid in counts:
            found.append((*counts[cid], 'desk'))
    return max(found, key=lambda x: x[1]) if found else None


def is_alias(key):
    """Colorance 6N@GB isn't carried (Nov 2 2026): SureTint bowls logged under it are really Colorance 6N."""
    return key[1].startswith('Colorance Canister') and key[2].split(' ')[0].upper() == '6N@GB'


def alias_target(key, keys):
    return next((k for k in keys if k[1] == 'Colorance Canister' and k[2].split(' ')[0] == '6N'), None)


def match_item(it, names):
    """Key for a normalized order-email item name: exact name first, else the LONGEST known name inside it (or it inside
    the name), so 'Goldwell Topchic 6NN Dark Blonde Extra' is 6NN, not 6N (found Nov 12 2026)."""
    if it in names:
        return names[it]
    hits = [(len(n), v) for n, v in names.items() if len(n) > 6 and (n in it or it in n)]
    return max(hits, key=lambda x: x[0])[1] if hits else None


def received_from_orders(rows, keys, year=2026):
    """f(key, datetime) -> units delivered after that time.
    A row counts once its Status says Delivered/Received, or 'arrives <date>' with that date passed; it is dated by
    the arrival date, else Updated, else Ordered. Items match a key by the order-list name ('Shades EQ 09V') or the
    full shade name, letters and digits only. Cancelled rows are skipped."""
    names = {}
    for k in keys:
        for nm in (item_name(k), k[1] + ' ' + k[2], k[0] + ' ' + k[1] + ' ' + k[2]):
            names.setdefault(norm(nm), k)
    now = datetime.now()
    got = []
    for r in rows or []:
        r = list(r) + [''] * 8
        st = str(r[5])
        if re.search(r'cancel', st, re.I):
            continue
        m = re.search(r'arrive[sd]?\s+(\w{3}\w*\s+\d{1,2})', st, re.I)
        arr = None
        if m:
            for f in ('%b %d', '%B %d'):
                try:
                    arr = datetime.strptime(m.group(1), f).replace(year=year)
                    break
                except ValueError:
                    pass
        done = re.search(r'deliver|receiv', st, re.I) or (arr and arr <= now)
        if not done:
            continue
        d = arr or when(r[6], year) or when(r[0], year)
        it = norm(r[3])
        k = match_item(it, names)
        try:
            q = float(r[4] or 1)
        except ValueError:
            q = 1
        if k and d:
            got.append((k, d, q))
    return lambda key, since: sum(q for k, d, q in got if k == key and d > since)


def on_hand(keys, counts, used_since, pace, received_since=None):
    """[line, shade, counted, used since, on hand, per week, weeks left, order] sorted by weeks left (same shape as before).
    Color Renew is left off; 6N@GB usage is added to Colorance 6N."""
    keys = [k for k in keys if is_alias(k) or not unused(*k)]
    extra = {}
    for k in keys:
        if is_alias(k):
            t = alias_target(k, keys)
            if t:
                st = start_count(t, counts)
                e = extra.setdefault(t, [0, 0])
                e[0] += (used_since(k, st[1]) if st else 0) or 0
                e[1] += pace(k) or 0
    rows = []
    for k in keys:
        st = start_count(k, counts)
        if not st or is_alias(k):
            continue
        c, d, _ = st
        used = (used_since(k, d) or 0) + extra.get(k, [0, 0])[0]
        p = (pace(k) or 0) + extra.get(k, [0, 0])[1]
        oh = round(c - used + ((received_since(k, d) or 0) if received_since else 0), 2)
        wl = round(oh / p, 1) if p > 0 else None
        need = max(0, math.ceil(6 * p - oh)) if wl is not None and wl < 3 else 0
        rows.append([k[0] + ' ' + k[1], k[2], c, round(used, 2), oh, round(p, 2), wl, need])
    return sorted(rows, key=lambda r: r[6] if r[6] is not None else 999)


# Color order rules. Nov 2 2026: fill each shade to Rose's par. Nov 12 2026 (Alexandra, after Rose said the list was
# "off" next to her DePasquale order W-100148): order by how fast each shade is used instead. Every carried shade keeps
# at least its floor below (1 can, or the bigger number Alexandra set for her must-have shades); on top of that it is
# filled to WEEKS weeks of use. Fast shades get more, slow shades get nothing until they run low.
# Developers and other backbar keep the weeks-of-pace rule (under 3 weeks left: order 6 weeks of pace - on hand).
# Not carried, so never ordered: Wella Color Renew, Colorance 6N@GB (its bowls count as Colorance 6N), Colorance NN
# shades (Rose buys NN in Topchic) and Alter Ego Technofruit color (Rose buys Fast Color 10) (Nov 12 2026), and
# Colorance 3NA and 4R, which aren't real Colorance colors (Nov 27 2026). Colorance 4NN IS carried (Nov 27 2026).
# Topchic 8G and 8GB ARE carried: 3 of each on the wall by their caps (Alexandra Nov 27 2026: count by the cap, not the shelf label). Colorance 9N IS carried (Nov 27 2026).
WEEKS = 6
PAR = [  # (line test, floor, {shade: floor})
    (lambda l, s: l == 'Shades EQ' and s != 'EQ Processing Solution' and not s.startswith('Bonder'), 1, {'09NB': 6, '09M': 6, '010VV': 6, '07M': 6,
        '08GN': 2,   # Rose, Nov 27 2026: keep 2 of 08GN Ivy even though the scale shows little use
        '04NCH': 2,
        '09AA': 2,   # Alexandra, Nov 27 2026: keep 2 of 09AA Papaya
        '09V': 3,
        '08GI': 3}),   # Alexandra, Nov 27 2026: keep 3 of 08GI St. Barths   # Alexandra, Nov 27 2026: keep 3 of 09V Platinum Ice at all times   # Rose, Nov 27 2026: keep 2 of 04NCH Dark Chocolate (Bonder Inside, SalonCentric P2417502)
    # Alexandra Nov 27 2026: "we should have 6 in stock always" (Shades EQ Processing Solution)
    (lambda l, s: l == 'Shades EQ' and s == 'EQ Processing Solution', 6, {}),
    (lambda l, s: l.startswith('Colorance Canister'), 1, {'6A': 3, '2A': 3, '5NB': 3, '7NA': 3, '6N': 3}),
    (lambda l, s: l.startswith('Topchic Canister') and l != 'Topchic Canister Blonding Cream', 1, {'4NN': 3, '5NN': 3, '6NN': 3, '7NN': 3, '4G': 3}),
    (lambda l, s: l in ('Fast Color 10', 'Technofruit') and 'Coactivator' not in s, 1, {}),
    # Alexandra Nov 28 2026: "we only have 1 goldwell 20 vol gallon so we need 5": keep 5 gallons of Topchic 20 Volume
    (lambda l, s: s.strip().lower() == 'topchic 20 volume', 5, {}),
    # Alexandra Nov 28 2026: Colorance Lotion = 7 vol cream developer, "we need 6 in stock"
    (lambda l, s: re.sub(r'\s+', '', s.lower()) == 'systemcreamdeveloper7vol', 6, {}),
    # Alexandra Nov 27 2026: "its ok to have 5 blondor from cosmoprof in stock": keep 5 tubs of Blondor Multi, no more
    (lambda l, s: l == 'Wella Lighteners' and re.match(r'(?i)blondor multi', s) is not None, 5, {}),
]
STORE = {'Redken': 'SalonCentric', 'Goldwell': 'DePasquale', 'Alter Ego': 'DePasquale', 'Wella': 'CosmoProf'}


def unused(*t):
    j = ' '.join(map(str, t)).lower()
    return ('color renew' in j or '6n@gb' in j or bool(re.search(r'colorance canister\S* (?!0*4nn\b)0*\d+nn\b', j))
            or ('technofruit' in j and 'coactivator' not in j)
            # Alexandra Nov 27 2026: Colorance 3NA, 4R and 7RO aren't real Colorance colors (7RO is Topchic): never count or order them
            or bool(re.search(r'colorance canister\S* 0*(3na|4r|7ro)\b', j))
            # Alexandra Nov 27 2026: "5BM isnot a color" (Topchic 8G/8GB were hidden here too, but they are on the wall: un-hidden later Nov 27)
            or bool(re.search(r'topchic canister\S* 0*(5bm)\b', j))
            # Alexandra Nov 27 2026: same gallon as Topchic 20 Volume (its scale use is moved there in color-refresh.py)
            or bool(re.search(r'system cream developer ?20 ?vol', j))
            # Alexandra Nov 28 2026: Colorance Lotion is the 7 vol cream developer (merged in color-refresh.py)
            or 'goldwell developers colorance lotion' in j
            # Alexandra Nov 27 2026: the scale's "Generic Developer" button has no volume, and the general developers
            # are counted by volume (10vol, 20vol), so it's never counted or ordered on its own
            or bool(re.search(r'general developers generic developer', j))
            or 'redken developers shades eq processing solution' in j
            # Alexandra Nov 27 2026: "so can the silk lift condition developer" (10 and 20 vol): take it off
            or 'silk lift condition' in j
            # Alexandra Nov 27 2026: take off Redken 20 VOL Blonde Idol and 20 VOL PRO developers
            or bool(re.search(r'redken developers 20 vol (blonde idol|pro)\b', j)))


# Discontinued shades (Alexandra Nov 27 2026: "8k we have 1 and its discontinued"): stay on hand with their count,
# but are never ordered and never sent to Recount first.
DISCONTINUED = {('Goldwell', 'Topchic Canister', '8K')}


def discontinued(key):
    return (key[0], key[1], code_of(key[2]) or key[2]) in {(b, l, code_of(c) or c) for b, l, c in DISCONTINUED}


# Keep numbers Alexandra or Rose typed in the app's Full Color List (Nov 27 2026: "an option for us to adjust those
# counts when we want"). Saved on Stock Counts as 'k:Brand|Line|Shade'; color-refresh.py fills this per run.
# A typed Keep is exact: the list orders up to that number, not up to 6 weeks of use.
KEEP_OV = {}


def exact_keep(key):
    """Keep numbers Alexandra set as exact (order up to that number, never more for 6 weeks of use): typed Keeps,
    Wella lighteners, and (Nov 28 2026: "we only have 1 ... so we need 5" -> order 4) the gallon and lotion developers."""
    return key in KEEP_OV or key[1] == 'Wella Lighteners' or re.sub(r'\s+', '', key[2].lower()) in (
        'topchic20volume', 'systemcreamdeveloper7vol')


def par_of(key):
    if key in KEEP_OV:
        return KEEP_OV[key]
    b, l, s = key
    c = code_of(s)
    for test, dflt, ex in PAR:
        if test(l, s):
            # leading zeros ignored: SureTint's 10VV gets Rose's 010VV par
            return next((v for x, v in ex.items() if c and code_of(x) == c), ex.get(s.split(' ')[0], dflt))
    return None


def set_par(key):
    """True when Alexandra or Rose named this shade's own number in PAR (not just the brand's floor): always carried."""
    if key in KEEP_OV:
        return True
    b, l, s = key
    c = code_of(s)
    for test, dflt, ex in PAR:
        if test(l, s):
            return any(c and code_of(x) == c for x in ex) or s.split(' ')[0] in ex
    return False


def order_qty(key, oh, pace, counted=None, fresh=True):
    """Units to order, or None when the count needs a recount first (used more than was counted, so it was restocked).
    A shade Rose counted at 0 in the last week is ordered, never sent to recount (Nov 12 2026); an older 0 count that
    has been used since was restocked, so it still asks for a recount. A shade counted 0 and not used in 4 weeks isn't
    carried, so it isn't ordered."""
    zero = counted is not None and float(counted or 0) <= 0
    if oh < 0:
        if not (zero and fresh):
            return None
        oh = 0.0
    par = par_of(key)
    if par is not None:
        if zero and pace <= 0 and not set_par(key):
            return 0
        target = par if exact_keep(key) else max(par, WEEKS * pace)
        # less than a quarter can short doesn't buy another can (Nov 10 2026)
        return max(0, math.ceil(round(target - oh - 0.25, 2)))
    wl = oh / pace if pace > 0 else None
    return max(0, math.ceil(round(6 * pace - oh, 2))) if wl is not None and wl < 3 else 0


def order_lists(items):
    """items = [(key, counted, on hand, pace)] -> ({store: [(name, qty)]}, [recount names]); Color Renew left off."""
    stores, recount = {}, []
    for key, counted, oh, pace, *more in items:
        if unused(*key) or discontinued(key):
            continue
        q = order_qty(key, oh, pace, counted, *more)
        if q is None:
            recount.append(item_name(key))
        elif q > 0:
            stores.setdefault(STORE.get(key[0], 'Other'), []).append((item_name(key), q))
    for v in stores.values():
        v.sort(key=lambda x: x[0])
    return stores, recount
