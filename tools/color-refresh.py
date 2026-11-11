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
        k = names.get(it) or next((v for n, v in names.items() if len(n) > 6 and (n in it or it in n)), None)
        try:
            q = float(r[4] or 1)
        except ValueError:
            q = 1
        if k:
            out[k] = out.get(k, 0) + q
    return out, got


def daily_usage(rows, keys):
    """({(key, date): units}, {weighed dates}, [unmatched products]) from Scale Usage rows."""
    full = {co.norm(k[0] + k[1] + k[2]): k for k in keys}
    short = {}
    for k in keys:
        short.setdefault(co.norm(k[0] + k[1] + k[2].split(' ')[0]), k)
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
            k = full.get(co.norm(man + brand + prod)) or short.get(co.norm(man + brand + prod.split(' ')[0]))
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
        items.append((k, counted, now_oh + way.get(k, 0), pace))
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
    R['onHand'] = sorted(new_rows, key=lambda r: r[6] if r[6] is not None else 999)
    R['order'] = order
    R['refreshed'] = now.strftime('%b %-d, %Y %-I:%M %p')
    inv['updated'] = now.strftime('%b %-d, %Y')
    n_items = sum(len(v) for v in stores.values())
    if days:
        R['scaleDays'] = [min(days).isoformat(), max(days).isoformat(), len(days)]
    return {'scaleDays': len([d for d in days if d >= use_ran.date()]), 'unmatchedScale': miss[:12], 'freshCounts': fresh, 'receivedUnits': added, 'onTheWay': len(way), 'orderItems': n_items, 'recount': len(recount)}


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
