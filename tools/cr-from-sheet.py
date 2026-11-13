#!/usr/bin/env python3
"""Turn a "Weekly Stylist Sales – <week>" Drive sheet (CSV export) into the input.json that tools/make-cr.py reads.
Usage: python3 tools/cr-from-sheet.py week.csv team.json input.json
team.json = The Pretty Report's board/team doc (commission rates + retailRate). Rows must add up to each stylist's totals.
Prints {"week": "YYYY-MM-DD", "stylists": N}. Added Nov 13 2026: the Nov 2-8 Weekly CR never reached the app because
the payroll run only wrote this sheet; the Monday cloud check now builds the Weekly CR from it.
"""
import csv, datetime, json, re, sys
rows = list(csv.reader(open(sys.argv[1], encoding='utf-8-sig')))
team = json.load(open(sys.argv[2])); team = team.get('data', team)
rates = team.get('commission', {}); rr = team.get('retailRate', 10)
wk = next(r[0] for r in rows if r and r[0].startswith('Week:'))
m = re.search(r'([A-Z][a-z]{2}) (\d+) – \w+ ([A-Z][a-z]{2}) (\d+), (\d{4})', wk)
start = datetime.datetime.strptime(f'{m[1]} {m[2]} {m[5]}', '%b %d %Y').date()
label = f'{m[1]} {int(m[2])} – {m[3]} {int(m[4])}'
ran = next((r[0].split(':', 1)[1].strip() for r in rows if r and r[0].startswith('Report run on:')), '')
master = {}; i = 0
while rows[i][:1] != ['Stylist']: i += 1
i += 1
while rows[i] and rows[i][0] != 'GRAND TOTAL':
    master[rows[i][0]] = (float(rows[i][1] or 0), float(rows[i][2] or 0)); i += 1
up = {k.upper(): k for k in master}
st = []; cur = None; sec = None
for r in rows[i + 1:]:
    r = (r + [''] * 7)[:7]; a = r[0].strip()
    if a.upper() in up and not r[1]:
        a = up[a.upper()]; cur = {'name': a, 'slug': a.lower().replace(' ', '-'), 'services': [], 'products': []}; st.append(cur); continue
    if a == 'Services': sec = 'services'; continue
    if a == 'Retail': sec = 'products'; continue
    if not cur or not sec or a in ('Date', 'No products sold', '', 'Service Total', 'Retail Total', 'Combined Total'): continue
    cur[sec].append({'date': a, 'client': r[1], 'item': r[2], 'qty': r[3], 'price': r[4], 'disc': r[5], 'amount': float(r[6] or 0)})
for s in st:
    s['rate'] = rates.get(s['slug'], 45); s['retailRate'] = rr
    s['serviceTotal'], s['retailTotal'] = master[s['name']]
    for k, t in (('services', 'serviceTotal'), ('products', 'retailTotal')):
        if abs(sum(x['amount'] for x in s[k]) - s[t]) > .01: sys.exit(f"{s['name']}: {k} rows don't add up to {s[t]}")
json.dump({'week': start.isoformat(), 'label': label, 'runOn': ran, 'stylists': st}, open(sys.argv[3], 'w'))
print(json.dumps({'week': start.isoformat(), 'stylists': len(st)}))
