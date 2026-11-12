#!/usr/bin/env python3
"""Daily color list refresh (Alexandra, Nov 9 2026: "there needs to be A DAILY RULE where the emails are checked for
orders and THEN UPDATE THE COUNTS").

The weekly color report (color-room-report skill) weighs SureTint use once a week. Between reports this script keeps the
What To Order color list honest every day, from three things the cloud can read:
  1. Stock Counts tab (Team Hub sheet): the newest shelf + back room count for each shade (Rose's app 'b:' ids or the
     Count buttons' 'c:' ids). A count typed after the report replaces the report's estimate.
  2. On Order sheet (filled hourly from the info@ order emails): boxes marked Received / Delivered, or past their
     "arrives" date, after the count are ADDED to on hand. Boxes still Ordered/Shipped count as on the way, so they
     aren't ordered twice.
  3. Color used since then: the real grams SureTint weighed each day when the daily scale pull has that day (Scale Usage
     tab, Alexandra Nov 11 2026: "the scale usage has to come in daily ... every morning before the new day"), else the
     report's weekly pace per shade as an estimate.
Then the order list is rebuilt with Rose's par levels (tools/color-onhand.py order_lists).

  python3 tools/color-refresh.py --inv inv.json --stock stock.json --orders orders.json [--usage usage.json] [--now 2026-11-09T14:00]
    inv.json    the decrypted inventory doc ({updated, report:{ran, onHand, order, ...}, ...}); rewritten in place
    stock.json  Stock Counts rows [[Updated, Name, App ID, Item ID, Item, On hand], ...] (header row is fine),
                or the desk script's ?stock=1 reply saved as-is
    orders.json On Order rows [[Ordered, Store, Order #, Item, Qty, Status, Updated, Email ID], ...]
    usage.json  Scale Usage rows [[Date, Manufacturer, Brand, Product, Type, Dispenses, Grams, Units], ...] (header fine):
                one row per product per day from SureTint Inventory Usage. A date with any row counts as weighed; a
                weighed day with no row for a shade means none of it was used.
Prints a short summary. Open the doc first with tools/inv-open.mjs and seal it again with tools/publish.mjs --inv inv.json.
Safe to run any number of times: it always starts from the weekly report rows saved in report.base.
"""
import argparse, json, math, os, re
from datetime import datetime, timedelta
from importlib.machinery import SourceFileLoader

co = SourceFileLoader('co', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'color-onhand.py')).load_module()
BRANDS = ('Alter Ego', 'Brazilian Blowout', 'Goldwell', 'Redken', 'Wella')
COLOR_STORES = ('DePasquale', 'SalonCentric', 'CosmoProf', 'Recount first')


def key_of(line):
    """'Goldwell Colorance Canister' -> ('Goldwell', 'Colorance Canister')"""
    for b in BRANDS:
        if line.startswith(b + ' '):
            return b, line[len(b) + 1:]
    return line.split(' ')[0], line.split(' ', 1)[-1]


def on_order(rows, keys, year, now):
    """{key: qty} still on the way (Ordered/Shipped in the last 21 days, not yet received)."""
    names = {}
    for k in keys:
        for nm in (co.item_name(k), k[1] + ' ' + k[2], k[0] + ' ' + k[1] + ' ' + k[2]):
            names.setdefault(co.norm(nm), k)
    got = co.received_from_orders(rows, keys, year)
    out = {}
    for r in rows or []:
        r = list(r) + [''] * 8
        st = str(r[5])
        if not st or re.search(r'cancel|deliver|receiv', st, re.I) or st.lower() == 'status':
            continue
        d = co.when(r[0], year)
        if not d or (now - d).days > 21:
            continue
        m = re.search(r'arrive[sd]?\s+(\w{3}\w*\s+\d{1,2})', st, re.I)
        if m:
            try:
                if datetime.strptime('%d %s %s' % (year, m.group(1)[:3], m.group(1).split()[-1]), '%Y %b %d') <= now:
                    continue   # past its arrival date: counted as received instead
            except ValueError:
                pass
        it = co.norm(r[3])
        k = co.match_item(it, names)
        try:
            q = float(r[4] or 1)
        except ValueError:
            q = 1
        if k:
            out[k] = out.get(k, 0) + q
    return out, got


def shade_code(shade):
    """'010VV Lavender Ice' and '10VV Lavender Ice' -> '10VV'; None when the first word has no digit ('Blondor ...')."""
    return co.code_of(shade)


def counted_extras(keys, counts, products, usage4, weeks=4, scale_products=()):
    """On hand rows for shades the weekly report left off On hand but that do have a Backbar shelf count, e.g. Shades EQ
    010VV: SureTint calls it '10VV Lavender Ice', the count says '010VV Lavender Ice', so the report listed it under
    NOT COUNTED YET and the color list never showed it (found Nov 11 2026). products = [(manufacturer, line, product)]
    from the daily scale and the report's 4-week use. Row: [line, shade, counted, used, on hand, pace/week, weeks left].
    """
    have = {co.norm(k[0] + k[1] + k[2]) for k in keys} | {co.norm(k[0] + k[1] + (shade_code(k[2]) or k[2])) for k in keys}
    shelf = {}
    for cid in counts:
        if not cid.startswith('b:') or cid.count('|') != 2:
            continue
        k = tuple(cid[2:].split('|'))
        shelf.setdefault(co.norm(k[0] + k[1] + k[2]), k)
        if shade_code(k[2]):
            shelf.setdefault(co.norm(k[0] + k[1] + shade_code(k[2])), k)
    u4 = {}
    for man, line, prod, units in usage4 or []:
        for nm in (prod, shade_code(prod)):
            if nm:
                u4[co.norm(man + line + nm)] = u4.get(co.norm(man + line + nm), 0) + float(units or 0)
    out, seen, nocount = [], set(), []
    for man, line, prod in products:
        ids = [co.norm(man + line + prod)] + ([co.norm(man + line + shade_code(prod))] if shade_code(prod) else [])
        if any(i in have for i in ids) or co.unused(man, line, prod) or re.match(r'(water|conditioner)$', prod, re.I):
            continue
        bid = co.backbar_id((man, line, prod), counts)
        k = tuple(bid[2:].split('|')) if bid else next((shelf[i] for i in ids if i in shelf), None)
        n = counts['b:%s|%s|%s' % k][0] if k else None
        if not k:                                 # no Backbar row: a Count These First count (Nov 12 2026) also works
            st = co.start_count((man, line, prod), counts)
            if st:
                k, n = (man, line, prod), st[0]
        if not k:
            nm = count_name(man, line, prod)
            if nm not in nocount and (man, line, prod) in scale_products:
                nocount.append(nm)
            continue
        if k in seen or co.is_alias(k):
            continue
        seen.add(k)
        used = round(next((u4[i] for i in ids if i in u4), 0.0), 2)   # report window starts the day of Rose's counts
        pace = round(used / weeks, 2)
        oh = round(n - used, 2)
        out.append(['%s %s' % (k[0], k[1]), k[2], n, used, oh, pace, round(oh / pace, 1) if pace > 0 else None])
    return out, nocount


ORDER_SHADE = re.compile(r'\b(Topchic|Colorance|Shades EQ)\s+(0*\d{1,2}[A-Z@]{0,4})\b')
LINE_OF = {'Topchic': ('Goldwell', 'Topchic Canister'), 'Colorance': ('Goldwell', 'Colorance Canister'),
           'Shades EQ': ('Redken', 'Shades EQ')}


def ordered_shades(rows, keys):
    """Topchic / Colorance / Shades EQ shades in the On Order sheet that match no known key: [(key, count name)]."""
    names = {}
    for k in keys:
        for nm in (co.item_name(k), k[1] + ' ' + k[2], k[0] + ' ' + k[1] + ' ' + k[2]):
            names.setdefault(co.norm(nm), k)
    have = {(k[1].split(' ')[0], co.code_of(k[2])) for k in keys}
    out, seen = [], set()
    for r in rows or []:
        r = list(r) + [''] * 8
        if re.search(r'cancel', str(r[5]), re.I):
            continue
        m = ORDER_SHADE.search(str(r[3]))
        if not m or co.match_item(co.norm(r[3]), names):
            continue
        b, l = LINE_OF[m.group(1)]
        code = m.group(2).upper()
        if (l.split(' ')[0], co.code_of(code)) in have or (l, code) in seen:
            continue
        seen.add((l, code))
        k = (b, l, code)
        if co.unused(*k):
            continue
        out.append((k, co.item_name(k)))
    return rows, out


def units_of(r):
    try:
        return float(str((list(r) + [''] * 8)[7]).replace(',', '') or 0)
    except ValueError:
        return 0.0


def count_name(man, line, prod):
    """Name for a never-counted item on Rose's Count These First list. Its saved id ('c:' + letters/digits) is one that
    color-onhand.start_count looks for, so the count is used on the next refresh."""
    k = (man, line, prod)
    if co.item_name(k) != prod:
        return co.item_name(k)                    # 'Colorance 6A'
    if line.endswith('Developers'):
        return prod if prod.lower().startswith(man.lower()) else man + ' ' + prod
    return line + ' ' + prod


def daily_usage(rows, keys):
    """({(key, date): units}, {weighed dates}, [unmatched products]) from Scale Usage rows."""
    full = {co.norm(k[0] + k[1] + k[2]): k for k in keys}
    # shade-code match ('10VV Lavender Ice' = '010VV Lavender Ice'), only for codes with a digit, so 'Blondor ...'
    # products never match each other by their first word
    code = co.code_of
    short = {}
    for k in keys:
        if code(k[2]):
            short.setdefault(co.norm(k[0] + k[1] + code(k[2])), k)
    six_n = next((k for k in keys if k[1] == 'Colorance Canister' and k[2].split(' ')[0] == '6N'), None)
    use, days, miss = {}, set(), set()
    for r in rows or []:
        r = [str(x).strip() for x in list(r) + [''] * 8]
        try:
            d = datetime.strptime(r[0][:10], '%Y-%m-%d').date()
        except ValueError:
            continue                                  # header or bad row
        days.add(d)
        try:
            u = float(r[7].replace(',', '') or 0)
        except ValueError:
            continue
        man, brand, prod = r[1], r[2], r[3]
        if '6n@gb' in prod.lower() and six_n:         # Colorance 6N@GB isn't carried: those bowls are Colorance 6N
            k = six_n
        else:
            k = full.get(co.norm(man + brand + prod)) or (code(prod) and short.get(co.norm(man + brand + code(prod))))
        if not k:
            if u > 0:
                miss.add(' '.join(x for x in (man, brand, prod) if x))
            continue
        use[(k, d)] = use.get((k, d), 0) + u
    return use, days, sorted(miss)


def used_between(k, start, end, pace, use, days):
    """Units of k used from start to end: weighed days use SureTint's real units (the part of the salon day, 8 AM-9 PM,
    after start), other days the weekly pace spread over the whole day, as before."""
    total, d = 0.0, start.date()
    while d <= end.date():
        day0 = datetime.combine(d, datetime.min.time())
        if d in days:
            o, c = day0.replace(hour=8), day0.replace(hour=21)
            a, b = max(start, o), min(end, c)
            frac = max(0.0, (b - a).total_seconds()) / (c - o).total_seconds()
            total += use.get((k, d), 0) * frac
        else:
            a, b = max(start, day0), min(end, day0 + timedelta(days=1))
            total += pace * max(0.0, (b - a).total_seconds()) / 604800
        d += timedelta(days=1)
    return total


def refresh(inv, stock_rows, order_rows, now=None, year=2026, usage_rows=None):
    now = now or datetime.now()
    R = inv['report']
    ran = co.when(str(R.get('ran', '')).replace(', %d' % year, ''), year) or co.when(R.get('ran', ''), year)
    ran = (ran or now).replace(hour=12, minute=0)
    counts = co.latest_counts(stock_rows, year)
    # Always start from the weekly report's own rows (kept in R.base on the first refresh), so running daily never
    # subtracts the same use twice or adds the same delivery twice. A new weekly report has a new 'ran' and resets it.
    if not (R.get('base') or {}).get('ran') == R.get('ran'):
        R['base'] = {'ran': R.get('ran'), 'onHand': R.get('onHand') or [], 'order': R.get('order') or []}
    rows = R['base']['onHand']
    keys = [(*key_of(r[0]), r[1]) for r in rows]
    # shades with a shelf count that the weekly report missed (name mismatch) join the list from their count
    products = [tuple(str(x).strip() for x in (list(r) + [''] * 4)[1:4]) for r in usage_rows or []
                if re.match(r'\d{4}-\d{2}-\d{2}', str((r or [''])[0]))]
    scale = {p for p, r in zip(products, [r for r in usage_rows or [] if re.match(r'\d{4}-\d{2}-\d{2}', str((r or [''])[0]))])
             if units_of(r) > 0}
    products += [tuple(r[:3]) for r in R.get('usage4') or []]
    # every color shade Rose counted on the shelf joins the list, even with no scale use yet (Nov 12 2026: Topchic 8CA,
    # Colorance 8BP were counted but never on the list)
    products += [tuple(c[2:].split('|')) for c in counts if c.startswith('b:') and c.count('|') == 2
                 and co.par_of(tuple(c[2:].split('|'))) is not None]
    extra, nocount = counted_extras(keys, counts, products, R.get('usage4'), scale_products=scale)
    rows = rows + extra
    keys = keys + [(*key_of(r[0]), r[1]) for r in extra]
    # color Rose orders that the list has never seen (Nov 12 2026: Colorance 8BA, 9BA, 6A, Topchic 9GB): counted on
    # Count These First -> joins the list from that count; not counted yet -> goes on Count These First
    o_rows, o_keys = ordered_shades(order_rows, keys)
    for (k, nm) in o_keys:
        st = co.start_count(k, counts)
        if st:
            rows.append(['%s %s' % (k[0], k[1]), k[2], st[0], 0.0, st[0], 0.0, None])
            keys.append(k)
        elif nm not in nocount:
            nocount.append(nm)
    R['countNew'] = nocount                       # never counted: Rose's Count These First list
    way, got = on_order(order_rows, keys, year, now)
    use, days, miss = daily_usage(usage_rows, keys)
    # The weekly report's estimate covers SureTint use through the report's Sunday. With daily scale numbers, count use
    # from the Monday after that Sunday, so the days between the Sunday and the day the report was made aren't missed.
    use_ran = ran
    m = re.search(r'[–-]\s*([A-Z][a-z]{2})[a-z]*\s+(\d{1,2})', str(R.get('week', '')))
    if days and m:
        try:
            wk_end = datetime.strptime('%d %s %s' % (year, m.group(1), m.group(2)), '%Y %b %d') + timedelta(days=1)
            if wk_end < ran:
                use_ran = wk_end
        except ValueError:
            pass
    new_rows, items, fresh, added = [], [], 0, 0
    for r, k in zip(rows, keys):
        line, shade, counted, used, oh, pace, wl = (list(r) + [None] * 8)[:7]
        pace = float(pace or 0)
        st = co.start_count(k, counts)
        if st and st[1] > ran:                       # counted after the report: start from that count
            counted, since, used, base, use_from = st[0], st[1], 0.0, st[0], st[1]
            fresh += 1
        else:                                        # report's estimate (its count minus SureTint use up to the report)
            since, base, use_from = (st[1] if st else ran), float(oh or 0), use_ran
        extra_use = round(used_between(k, use_from, now, pace, use, days), 2)
        recv = got(k, since) if since else 0
        added += recv
        now_oh = round(base - extra_use + recv, 2)
        new_rows.append([line, shade, counted, round(float(used or 0) + extra_use, 2), now_oh, round(pace, 2),
                         round(now_oh / pace, 1) if pace > 0 else None])
        fresh_count = bool(st) and (now - st[1]).days <= 7
        items.append((k, counted, now_oh + way.get(k, 0), pace, fresh_count))
    stores, recount = co.order_lists(items)
    order = []
    for s in ('DePasquale', 'SalonCentric', 'CosmoProf'):
        if stores.get(s):
            order.append([s, ', '.join('%s ×%d' % (n, q) for n, q in stores[s]) + '. Skip anything already on order.'])
    for s, x in R['base']['order']:
        if s not in COLOR_STORES or (s == 'CosmoProf' and not stores.get('CosmoProf')):
            order.append([s, x])
    if recount:
        order.append(['Recount first', 'Used more than was counted, so these were restocked. Count them before ordering: '
                      + ', '.join(recount) + '.'])
    new_rows = [r for r, k in zip(new_rows, keys) if not co.unused(*k)]
    R['onHand'] = sorted(new_rows, key=lambda r: r[6] if r[6] is not None else 999)
    R['order'] = order
    R['refreshed'] = now.strftime('%b %-d, %Y %-I:%M %p')
    inv['updated'] = now.strftime('%b %-d, %Y')
    n_items = sum(len(v) for v in stores.values())
    if days:
        R['scaleDays'] = [min(days).isoformat(), max(days).isoformat(), len(days)]
    return {'scaleDays': len([d for d in days if d >= use_ran.date()]), 'unmatchedScale': miss[:12], 'addedFromCounts': [r[0].split(' ', 1)[-1] + ' ' + r[1] for r in extra], 'countNew': nocount, 'freshCounts': fresh, 'receivedUnits': added, 'onTheWay': len(way), 'orderItems': n_items, 'recount': len(recount)}


if __name__ == '__main__':
    a = argparse.ArgumentParser()
    a.add_argument('--inv', required=True); a.add_argument('--stock', required=True); a.add_argument('--orders')
    a.add_argument('--now'); a.add_argument('--usage')
    o = a.parse_args()
    inv = json.load(open(o.inv))
    stock = json.load(open(o.stock))
    if isinstance(stock, dict):   # the desk script's ?stock=1 reply: {ok, stock: {id: {n, by, at, ts}}}
        st = stock.get('stock', stock)
        stock = [[datetime.fromtimestamp(v['ts'] / 1000).strftime('%Y-%m-%dT%H:%M:%S') if v.get('ts') else v.get('at', ''),
                  v.get('by', ''), '', k, '', v.get('n')] for k, v in st.items()]
    orders = json.load(open(o.orders)) if o.orders and os.path.exists(o.orders) else []
    now = datetime.fromisoformat(o.now) if o.now else None
    usage = json.load(open(o.usage)) if o.usage and os.path.exists(o.usage) else []
    print(json.dumps(refresh(inv, stock, orders, now, usage_rows=usage)))
    json.dump(inv, open(o.inv, 'w'))
