#!/usr/bin/env python3
"""Load a new weekly Color Room Report sheet into the app's color report (Alexandra, Nov 10 2026: "anytime this report is
run, it needs to update in the apps as well").

The color-room-report skill saves the weekly report as a Google Sheet in Drive (Front Desk & Inventory folder,
"Color Room Report – Week of <Mon> – <Sun>, <Year>"). This turns that sheet (exported as CSV) into inv.json's
report: week, tiles, services, artists, audit flags, fastest-used, On hand rows and the order list. Prices, foil costs and
"no price yet" are kept from the last report when the sheet has nothing better. Then tools/color-refresh.py rebuilds
What To Order from it with the newest shelf counts and deliveries, so run that right after.

  python3 tools/color-import.py --inv inv.json --csv report.csv --url <sheet link> [--force]
Does nothing (prints {"imported": false}) when inv.json already holds that week, unless --force.
"""
import argparse, csv, json, re
from datetime import datetime, timedelta

SECTIONS = ('AT A GLANCE', 'COST PER BOWL', 'ARTIST AUDIT', 'AUDIT FLAGS', 'ORDER LIST', 'RECOUNT FIRST', 'PRICE CHECK',
            'FASTEST-USED', 'ON HAND', 'NOT COUNTED', 'STOP REORDERING', 'FULL USAGE')
UNUSED = lambda t: 'color renew' in t.lower() or '6n@gb' in t.lower()


def num(x):
    try:
        return float(str(x).replace('$', '').replace(',', '').replace('%', '').replace('+', '').strip())
    except ValueError:
        return None


def sections(rows):
    out, cur = {}, None
    for r in rows:
        r = [c.strip() for c in r]
        while r and not r[-1]:
            r.pop()
        if not r:
            continue
        head = next((s for s in SECTIONS if r[0].upper().startswith(s)), None)
        if head and len(r) == 1:
            cur = head
            out[cur] = []
        elif cur:
            out[cur].append(r)
    return out


def first(name):
    p = name.replace('(', ' ').split()
    if not p:
        return name
    return p[0] + (' ' + p[1] if len(p) > 1 and len(p[1]) == 1 else '')   # 'Jennifer M' stays 'Jennifer M'


def who(name):
    return ' + '.join(first(x) for x in name.split('+'))


def flag_kind(text):
    t = text.lower()
    if 'extra bowl' in t:
        return 'Extra bowl (2 bowls for a 1-bowl service)'
    if 'no color service charged' in t or 'no colour service charged' in t:
        return 'Color mixed, no color service charged'
    if 'no ticket' in t:
        return 'Color mixed, no ticket found'
    if 'not weighed' in t or 'cancelled' in t or 'no bowl' in t:
        return 'Color charged, no bowl weighed'
    if 'another artist' in t:
        return 'Charged under another artist'
    if '20%' in t and 'over' in t:
        return 'Mixed 20%+ over recommended'
    if 'date' in t:
        return 'Date differs (mixed vs. charged)'
    return 'Charged differs from what was mixed'


def import_report(inv, rows, url=None, force=False):
    R = inv.setdefault('report', {})
    title = next((c for c in rows[0] if c), '')
    m = re.search(r'Week of (.+)$', title)
    week = m.group(1).strip() if m else ''
    if not week:
        raise SystemExit('no "Week of" in the sheet title row: ' + title)
    if R.get('week') == week and not force:
        return {'imported': False, 'week': week}
    end = re.search(r'– (\w+ \d+), (\d{4})$', week)
    ran = datetime.strptime(end.group(1) + ' ' + end.group(2), '%b %d %Y') + timedelta(days=1) if end else datetime.now()
    S = sections(rows)

    g = {r[0].lower(): r[1] for r in S.get('AT A GLANCE', []) if len(r) > 1}
    pick = lambda k: next((v for n, v in g.items() if n.startswith(k)), None)
    mix = pick('average bowl') or ''
    mm = re.findall(r'([\d.]+)\s*g', mix)
    tiles = {'cpb': num(pick('average cost per bowl') or ''), 'bowls': int(num(pick('bowls mixed') or 0) or 0),
             'grams': round(num(pick('total grams') or 0) or 0), 'over': num(pick('what over-mixing cost') or 0) or 0,
             'avgMix': ('%d g color + %d g developer' % (round(float(mm[0])), round(float(mm[1])))) if len(mm) >= 2 else mix}

    services = []
    for r in S.get('COST PER BOWL', []):
        if len(r) < 7 or num(r[1]) is None:
            continue
        fo = re.match(r'(\d+)\s*foils', r[7]) if len(r) > 7 else None
        gl = num(r[8]) if len(r) > 8 else 0
        services.append([r[0], int(num(r[1])), num(r[5]), int(fo.group(1)) if fo else None, round((num(r[6]) or 0) + (gl or 0), 2)])

    flags, not_weighed = {}, {}
    for r in S.get('AUDIT FLAGS', []):
        if len(r) < 8 or r[0].lower() == 'date':
            continue
        k = flag_kind(r[7])
        grams, var = num(r[5]), (num(r[6]) if '%' in r[6] else None)
        flags.setdefault(k, []).append([r[0], who(r[1]), r[2], r[3], r[4], grams, var])
        if k == 'Color charged, no bowl weighed':
            n = re.search(r'(\d+)\s*(color|colour)?\s*services?', r[4])
            cnt = int(n.group(1)) if n else max(1, len([x for x in re.split(r',|\band\b', r[2]) if x.strip() and '…' not in x]))
            not_weighed[first(r[1])] = not_weighed.get(first(r[1]), 0) + cnt
    tiles['notWeighed'] = sum(not_weighed.values())
    tiles['charged'] = None

    artists, look = [], []
    for r in S.get('ARTIST AUDIT', []):
        if len(r) < 8 or r[0].lower() == 'artist':
            continue
        a = first(r[0])
        fl = 'Over-mixing' if len(r) > 8 and 'over' in r[8].lower() else None
        v = num(r[3])
        artists.append([a, int(num(r[1]) or 0), v, int(num(r[4]) or 0), num(r[6]), num(r[7]), not_weighed.pop(a, 0), fl])
    for a, n in not_weighed.items():           # 'Jen M' in the flags is 'Jennifer M' in the audit table
        hit = next((x for x in artists if x[0].split()[0].lower().startswith(a.split()[0].lower())
                    and x[0].split()[1:] == a.split()[1:]), None)
        if hit:
            hit[6] += n
        else:
            artists.append([a, 0, None, 0, 0, 0, n, None])
    for a in artists:
        if a[7]:
            look.append([a[0], ('+%d%%' % round(a[2])) + ' over the recipe'])
    for a in artists:
        if a[6] >= 3:
            look.append([a[0], '%d color services not weighed' % a[6]])

    fastest = []
    for r in S.get('FASTEST-USED', []):
        if len(r) < 5 or r[0].lower() == 'brand' or UNUSED(' '.join(r)):
            continue
        fastest.append([r[1].replace(' Canister', ''), r[2], num(r[4])])

    onhand = []
    for r in S.get('ON HAND', []):
        if len(r) < 7 or r[0].lower() == 'line' or UNUSED(' '.join(r)):
            continue
        onhand.append([r[0], r[1], num(r[2]), num(r[3]), num(r[4]), num(r[5]), num(r[6])])

    order, by = [], {}
    for r in S.get('ORDER LIST', []):
        if len(r) < 3 or r[0].lower() == 'supplier' or UNUSED(r[1]):
            continue
        by.setdefault(r[0], []).append('%s ×%d' % (r[1], int(num(r[2]) or 1)))
    for s, items in by.items():
        order.append([s, ', '.join(items) + '. Skip anything already on order.'])
    for s, x in R.get('order') or []:          # keep non-color notes (Paramount, CosmoProf) from the last report
        if s not in by and s != 'Recount first':
            order.append([s, x])

    links = dict(R.get('links') or {})
    if url and links.get('report') != url:
        links['prev'], links['report'] = links.get('report'), url

    R.update({'week': week, 'ran': ran.strftime('%b %-d, %Y'), 'tiles': tiles, 'services': services or R.get('services', []),
              'artists': artists, 'flags': flags, 'look': look, 'fastest': fastest[:11] or R.get('fastest', []),
              'onHand': onhand, 'order': order, 'links': links})
    R.pop('base', None)          # color-refresh.py starts again from these rows
    R.pop('refreshed', None)
    inv['updated'] = datetime.now().strftime('%b %-d, %Y')
    return {'imported': True, 'week': week, 'ran': R['ran'], 'onHand': len(onhand), 'artists': len(artists),
            'flags': sum(len(v) for v in flags.values())}


if __name__ == '__main__':
    a = argparse.ArgumentParser()
    a.add_argument('--inv', required=True); a.add_argument('--csv', required=True); a.add_argument('--url')
    a.add_argument('--force', action='store_true')
    o = a.parse_args()
    inv = json.load(open(o.inv))
    res = import_report(inv, list(csv.reader(open(o.csv, encoding='utf-8'))), o.url, o.force)
    print(json.dumps(res))
    if res['imported']:
        json.dump(inv, open(o.inv, 'w'))
