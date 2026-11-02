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
"""
import math, re
from datetime import datetime

norm = lambda t: re.sub(r'[^a-z0-9]', '', str(t or '').lower())


def when(s, year):
    s = str(s or '').strip()
    for f in ('%a %b %d, %I:%M %p', '%a %b %d %Y, %I:%M %p', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%m/%d/%Y %H:%M:%S', '%m/%d/%Y'):
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


def start_count(key, counts):
    """Newest of the Backbar count and any What To Order count for this item: (n, datetime, source) or None."""
    b, l, s = key
    found = [(*counts['b:%s|%s|%s' % key], 'backbar')] if 'b:%s|%s|%s' % key in counts else []
    # desk names use the short shade ('Shades EQ 09V'); Backbar keys carry the full name ('09V Platinum Iced')
    ids = {'c:' + norm(x + ' ' + y) for x in (l, b + ' ' + l, b) for y in {s, s.split(' ')[0]}}
    for cid in ids:
        if cid in counts:
            found.append((*counts[cid], 'desk'))
    return max(found, key=lambda x: x[1]) if found else None


def on_hand(keys, counts, used_since, pace):
    """[line, shade, counted, used since, on hand, per week, weeks left, order] sorted by weeks left (same shape as before)."""
    rows = []
    for k in keys:
        st = start_count(k, counts)
        if not st:
            continue
        c, d, _ = st
        used = used_since(k, d) or 0
        p = pace(k) or 0
        oh = round(c - used, 2)
        wl = round(oh / p, 1) if p > 0 else None
        need = max(0, math.ceil(6 * p - oh)) if wl is not None and wl < 3 else 0
        rows.append([k[0] + ' ' + k[1], k[2], c, round(used, 2), oh, round(p, 2), wl, need])
    return sorted(rows, key=lambda r: r[6] if r[6] is not None else 999)
