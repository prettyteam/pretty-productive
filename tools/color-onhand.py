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
        if d and (r[3] not in out or d > out[r[3]][1]):
            out[r[3]] = (n, d)
    return out


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
    if l == 'Technofruit' and par_of(key):
        return 'Alter Ego Technofruit ' + tok
    return s


def start_count(key, counts):
    """Newest of the Backbar count and any What To Order count for this item: (n, datetime, source) or None."""
    b, l, s = key
    found = [(*counts['b:%s|%s|%s' % key], 'backbar')] if 'b:%s|%s|%s' % key in counts else []
    # desk names use the short shade ('Shades EQ 09V'); Backbar keys carry the full name ('09V Platinum Iced')
    ids = {'c:' + norm(x + ' ' + y) for x in (l, b + ' ' + l, b, l.split(' ')[0], '') for y in {s, s.split(' ')[0]}} | {'c:' + norm(item_name(key))}
    for cid in ids:
        if cid in counts:
            found.append((*counts[cid], 'desk'))
    return max(found, key=lambda x: x[1]) if found else None


def is_alias(key):
    """Colorance 6N@GB isn't carried (Nov 2 2026): SureTint bowls logged under it are really Colorance 6N."""
    return key[1].startswith('Colorance Canister') and key[2].split(' ')[0].upper() == '6N@GB'


def alias_target(key, keys):
    return next((k for k in keys if k[1] == 'Colorance Canister' and k[2].split(' ')[0] == '6N'), None)


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
        k = names.get(it) or next((v for n, v in names.items() if len(n) > 6 and (n in it or it in n)), None)
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


# Color order rules (Alexandra, Nov 2 2026). Color shades: order par - on hand, rounded up, when above 0.
# Developers and other backbar keep the weeks-of-pace rule (under 3 weeks left: order 6 weeks of pace - on hand).
# Wella Color Renew and Colorance 6N@GB aren't carried: they stay off order, onHand and Count These First
# (6N@GB usage counts toward Colorance 6N, see on_hand).
PAR = [  # (line test, default par, {shade: par})
    (lambda l, s: l == 'Shades EQ' and s != 'EQ Processing Solution' and not s.startswith('Bonder'), 3, {'09NB': 6, '09M': 6, '010VV': 6, '07M': 6}),
    (lambda l, s: l.startswith('Colorance Canister'), 2, {'6A': 3, '2A': 3, '5NB': 3, '7NA': 3, '6N': 3}),
    (lambda l, s: l.startswith('Topchic Canister') and l != 'Topchic Canister Blonding Cream', 2, {'4NN': 3, '5NN': 3, '6NN': 3, '7NN': 3, '4G': 3}),
    (lambda l, s: l in ('Fast Color 10', 'Technofruit') and 'Coactivator' not in s, 3, {}),
]
STORE = {'Redken': 'SalonCentric', 'Goldwell': 'DePasquale', 'Alter Ego': 'DePasquale', 'Wella': 'CosmoProf'}
unused = lambda *t: 'color renew' in ' '.join(map(str, t)).lower() or '6n@gb' in ' '.join(map(str, t)).lower()


def par_of(key):
    b, l, s = key
    for test, dflt, ex in PAR:
        if test(l, s):
            return ex.get(s.split(' ')[0], dflt)
    return None


def order_qty(key, oh, pace, counted=None):
    """Units to order, or None when the count needs a recount first (used more than was counted, so it was restocked).
    A shade counted 0 and not used in 4 weeks isn't carried, so par doesn't apply to it."""
    if oh < 0:
        return None
    par = par_of(key)
    if par is not None and (counted or pace > 0):
        # less than a quarter can used since the count doesn't buy another can (Nov 10 2026: Rose counted 1 of a
        # par-2 shade and the list said order 2 because a sliver had been used since)
        return max(0, math.ceil(round(par - oh - 0.25, 2)))
    wl = oh / pace if pace > 0 else None
    return max(0, math.ceil(round(6 * pace - oh, 2))) if par is None and wl is not None and wl < 3 else 0


def order_lists(items):
    """items = [(key, counted, on hand, pace)] -> ({store: [(name, qty)]}, [recount names]); Color Renew left off."""
    stores, recount = {}, []
    for key, counted, oh, pace in items:
        if unused(*key):
            continue
        q = order_qty(key, oh, pace, counted)
        if q is None:
            recount.append(item_name(key))
        elif q > 0:
            stores.setdefault(STORE.get(key[0], 'Other'), []).append((item_name(key), q))
    for v in stores.values():
        v.sort(key=lambda x: x[0])
    return stores, recount
