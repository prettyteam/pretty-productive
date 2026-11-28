"""Build the Retail Inventory Report CSV from three Paired Plus report dumps (see header of each step).
Usage: TZ=America/New_York python3 tools/retail-report.py --stock stock.txt --ytd ytd.txt --d30 d30.txt --out report.csv
Inputs are the row dumps ("cell|cell|...") of report 33 (All Manufacturers, as of today) and report 128
(All Manufacturers, All Stylists) for Jan 1-today and for the last 30 days. Prints a JSON summary with
total checks; upload report.csv to Drive folder 12caB_cJkBiE6_dm8rBqOeolmMOMUX650 as
"Retail Inventory Report – <Month D, YYYY>" (text/csv converts to a Google Sheet). Apps-script Inventory.gs reads it."""
import csv, math, io, json, datetime, argparse, re
ap = argparse.ArgumentParser()
for a in ('stock', 'ytd', 'd30', 'out'): ap.add_argument('--' + a, required=True)
A = ap.parse_args()
today = datetime.date.today()
d30s = today - datetime.timedelta(days=30)
FMT = lambda d: d.strftime('%b ') + str(d.day)
weeks = ((today - datetime.date(today.year, 1, 1)).days + 1) / 7
NONPROD = {'2410', '46850', '2040', '47870', '2030', '4820', '46390'}
BR = {'EHP': 'EHP', 'IGK': 'IGK', 'K18': 'K18', 'T3': 'T3'}
CATN = {'HA': 'Hair Care', 'SX': 'Skincare', 'MP': 'Makeup', 'EX': 'Extension Hair', 'TM': 'Taffeta Merch', 'GC': 'Giftcard'}


def brand(m):
    return BR.get(m, m.title())


def num(s):
    s = s.replace('$', '').replace(',', '').strip()
    if not s:
        return 0.0
    if s.startswith('('):
        return -float(s.strip('()'))
    return float(s)


# ---- stock report
stock = []; man = None; printed_grand = None; bell_val = 0.0; all_val = 0.0
for line in open(A.stock).read().split('\n'):
    p = line.split('|')
    if line.startswith('MANUFACTURER:'):
        man = line.split(':', 1)[1].strip(' |'); continue
    if 'GRAND TOTAL RETAIL' in line:
        printed_grand = num(p[-1]); continue
    if len(p) == 7 and p[0].strip().isdigit():
        sku, ct, gp, desc, oh, cost, val = [x.strip() for x in p]
        desc = desc.rsplit(',', 1)[0].strip()
        r = dict(sku=sku, cat=ct, item=desc, oh=int(num(oh)), cost=num(cost), val=num(val), man=man)
        all_val += r['val']
        if man == 'BELLAMI':
            bell_val += r['val']; continue
        stock.append(r)

# ---- sales reports
def sales(fn):
    out = {}; grand = None; bell = 0.0
    sec = None
    for line in open(fn).read().split('\n'):
        p = line.split('|')
        if line.startswith('GRAND TOTAL'):
            grand = num(line.split('Sales:')[1]); continue
        if len(p) == 1 and line.strip() and not line.startswith(('SALESREPORT', 'Period', 'Title', 'URL', 'Source', '---')):
            sec = line.strip(); continue
        if len(p) == 8 and p[0].strip().isdigit():
            sku = p[0].strip(); q = int(num(p[2])); tot = num(p[7])
            if sec == 'Bellami':
                bell += tot; continue
            o = out.setdefault(sku, dict(q=0, d=0.0, item=p[1].strip(), brand=sec))
            o['q'] += q; o['d'] += tot
    return out, grand, bell

ytd, ytd_grand, ytd_bell = sales(A.ytd)
d30, d30_grand, _ = sales(A.d30)

checks = []
sumv = sum(r['val'] for r in stock) + bell_val
checks.append(('stock value', round(sumv, 2), printed_grand))
checks.append(('ytd sales', round(sum(v['d'] for v in ytd.values()) + ytd_bell, 2), ytd_grand))
checks.append(('30d sales', round(sum(v['d'] for v in d30.values()), 2), d30_grand))

skus = {r['sku'] for r in stock}
dups = [s for s in skus if sum(1 for r in stock if r['sku'] == s) > 1]
sold_missing = [(k, v['item'], v['q']) for k, v in ytd.items() if k not in skus]

rows = []
for r in stock:
    # Alexandra Nov 28 2026: "remove the davines dry texture spray from app we dont carry that"
    if re.search(r'(?i)dry texture', str(r.get('item', ''))) and re.search(r'(?i)davines', str(r.get('man', ''))):
        continue
    if r['sku'] in NONPROD or r['man'] == 'GIFTCARD':
        continue
    y = ytd.get(r['sku'], {}); t = d30.get(r['sku'], {})
    r['ytd'] = y.get('q', 0); r['ytd_d'] = round(y.get('d', 0.0), 2); r['d30'] = t.get('q', 0)
    r['brand'] = brand(r['man'])
    r['pace'] = max(r['ytd'] / weeks, r['d30'] / 4.3)
    oh = r['oh']
    r['wl'] = (max(oh, 0) / r['pace']) if r['pace'] > 0 else None
    if oh < 0: st = 'Count needed'
    elif oh == 0: st = 'Out' if r['ytd'] >= 1 else 'Out (no sales)'
    elif r['wl'] is not None and r['wl'] < 4 and r['ytd'] >= 2: st = 'Low'
    elif r['ytd'] <= 1: st = 'Slow'
    else: st = 'OK'
    r['status'] = st
    rows.append(r)

shelf = [r for r in rows if r['cat'] != 'EX']
ext = [r for r in rows if r['cat'] == 'EX']
pos = [r for r in shelf if r['oh'] > 0]
glance = [
    ('Retail products (shelf, excl. extension hair & non-products)', len(shelf)),
    ('Units on hand (positive counts only)', sum(r['oh'] for r in pos)),
    ('Value at cost (positive stock only)', '$%s' % format(round(sum(r['oh'] * r['cost'] for r in pos), 2), ',.2f')),
    ('Paired Plus printed grand total (incl. negatives & Bellami)', '$%s' % format(printed_grand, ',.2f')),
    ('Items with $0 cost', sum(1 for r in shelf if r['cost'] == 0)),
    ('Items with negative counts', sum(1 for r in shelf if r['oh'] < 0)),
    ('YTD shelf retail units', sum(r['ytd'] for r in shelf)),
    ('YTD shelf retail sales', '$%s' % format(sum(r['ytd_d'] for r in shelf), ',.2f')),
    ('YTD extension hair sales (EHP)', '$%s' % format(sum(v['d'] for k, v in ytd.items() if v['brand'] == 'EHP' and k not in NONPROD), ',.2f')),
    ('Paired Plus YTD sales grand total (all, incl. Bellami & non-products)', '$%s' % format(ytd_grand, ',.2f')),
    ('Last 30 days sales (Paired Plus total)', '$%s' % format(d30_grand, ',.2f')),
]
out_sell = [r for r in shelf if r['status'] == 'Out']
low = [r for r in shelf if r['status'] == 'Low']
reorder = [r for r in shelf if r['ytd'] >= 2 and (r['oh'] <= 0 or (r['wl'] is not None and r['wl'] < 8))]
for r in reorder:
    r['qty'] = max(1, math.ceil(round(8 * r['pace'] - max(r['oh'], 0), 6)))
reorder = [r for r in reorder if 8 * r['pace'] - max(r['oh'], 0) > 0 or r['oh'] <= 0]
glance += [('Out of stock (and selling)', len(out_sell)), ('Low (< 4 weeks left)', len(low)), ('Reorder suggestions', len(reorder))]

neg = sorted([r for r in shelf if r['oh'] < 0], key=lambda r: r['oh'])
oribe_units = sum(r['oh'] for r in shelf if r['brand'] == 'Oribe' and r['oh'] > 0)
oribe_sales = sum(r['ytd'] for r in shelf if r['brand'] == 'Oribe')
olap = [r for r in shelf if r['brand'] == 'Olaplex']
needs = []
for name, mine, pp in checks:
    if pp is None or abs(mine - pp) > 0.01:
        needs.append('Totals check: my %s %.2f vs Paired Plus %.2f.' % (name, mine, pp or 0))
needs.append('Oribe: %d units on the shelf but %d sales YTD again (and Olaplex %d units, %d sales). May be rung up under another item – please confirm.' % (oribe_units, oribe_sales, sum(r['oh'] for r in olap if r['oh'] > 0), sum(r['ytd'] for r in olap)))
needs.append('%d items have negative counts (sold without being received) – see Count needed. Biggest: %s' % (len(neg), ', '.join('%s %d' % (r['item'], r['oh']) for r in neg[:5])))
if sold_missing:
    needs.append('Sold this year but no longer in the stock list: %s.' % ', '.join('%s (%s, %d sold)' % (i, k, q) for k, i, q in sold_missing if k not in NONPROD and i))
if dups:
    needs.append('Duplicate SKUs: %s' % ', '.join(dups))
needs.append('Brand news research is not run on the daily refresh. The newest weekly brand news still applies.')

def f2(x): return '%.2f' % (x if abs(x) >= 0.005 else 0.0)
def wl(r): return '' if r['wl'] is None else '%.1f' % r['wl']

buf = io.StringIO(); w = csv.writer(buf)
B = lambda: w.writerow([])
w.writerow(['Taffeta Salon & Spa – Retail Inventory Report'])
w.writerow(['Stock as of: ' + today.strftime('%A, %B ') + str(today.day) + today.strftime(', %Y')])
w.writerow(['Sales: Jan 1 – %s, %d (YTD); last 30 days = %s – %s, %d' % (FMT(today), today.year, FMT(d30s), FMT(today), today.year)])
w.writerow(['Source: Paired Plus (reports 33 and 128). Bellami excluded.'])
B(); w.writerow(['AT A GLANCE'])
for k, v in glance: w.writerow([k, v])
B(); w.writerow(['NEEDS A LOOK'])
for t in needs: w.writerow([t])
B(); w.writerow(['TOP 15 SELLERS (YTD units)'])
w.writerow(['Brand', 'Product', 'SKU', 'YTD Units', 'YTD Sales $', 'On Hand'])
top = sorted(shelf, key=lambda r: (-r['ytd'], -r['ytd_d']))[:15]
for r in top: w.writerow([r['brand'], r['item'], r['sku'], r['ytd'], f2(r['ytd_d']), r['oh']])
B(); w.writerow(['TOP 5 BY DOLLARS (YTD)'])
w.writerow(['Brand', 'Product', 'SKU', 'YTD Sales $', 'YTD Units', 'On Hand'])
for r in sorted(shelf, key=lambda r: -r['ytd_d'])[:5]: w.writerow([r['brand'], r['item'], r['sku'], f2(r['ytd_d']), r['ytd'], r['oh']])
B(); w.writerow(['MOST STOCK ON HAND'])
w.writerow(['Brand', 'Product', 'SKU', 'On Hand', 'Value at Cost', 'YTD Units', 'Note'])
for r in sorted(pos, key=lambda r: (-r['oh'], -r['oh'] * r['cost']))[:15]:
    w.writerow([r['brand'], r['item'], r['sku'], r['oh'], f2(r['oh'] * r['cost']), r['ytd'], 'Tying up cash' if r['ytd'] <= 1 else ''])
B(); w.writerow(['SUGGESTED REORDER (8 weeks of pace − on hand; suggestion only)'])
w.writerow(['Brand', 'Product', 'SKU', 'On Hand', 'YTD Units', '30-Day Units', 'Weekly Pace', 'Weeks Left', 'Suggested Qty', 'Note'])
for r in sorted(reorder, key=lambda r: (r['brand'], r['item'])):
    w.writerow([r['brand'], r['item'], r['sku'], r['oh'], r['ytd'], r['d30'], '%.2f' % r['pace'], wl(r) or '0', r['qty'], 'Count first' if r['oh'] < 0 else ''])
B(); w.writerow(['OUT OF STOCK & LOW (selling items only)'])
w.writerow(['Brand', 'Product', 'SKU', 'Status', 'On Hand', 'YTD Units', 'Weeks Left'])
for r in sorted(out_sell + low, key=lambda r: (r['status'] != 'Out', r['brand'], r['item'])):
    w.writerow([r['brand'], r['item'], r['sku'], r['status'], r['oh'], r['ytd'], wl(r) or '0'])
slow = sorted([r for r in pos if r['ytd'] <= 1], key=lambda r: -r['oh'] * r['cost'])
B(); w.writerow(['SLOW MOVERS (top 40 by $ tied up; %d items, $%s at cost in all)' % (len(slow), format(sum(r['oh'] * r['cost'] for r in slow), ',.2f'))])
w.writerow(['Brand', 'Product', 'SKU', 'On Hand', 'Value at Cost', 'YTD Units', 'Idea'])
for r in slow[:40]: w.writerow([r['brand'], r['item'], r['sku'], r['oh'], f2(r['oh'] * r['cost']), r['ytd'], 'Stylist push or bundle'])
B(); w.writerow(['COUNT NEEDED (negative on-hand counts)'])
w.writerow(['Brand', 'Product', 'SKU', 'On Hand', 'Note'])
for r in neg: w.writerow([r['brand'], r['item'], r['sku'], r['oh'], 'Count the shelf and fix in Paired Plus (Inventory Adjustments)'])
B(); w.writerow(['EXTENSION HAIR (ordered per client; no reorders)'])
w.writerow(['Brand', 'Product', 'SKU', 'On Hand', 'YTD Units', 'YTD Sales $'])
for r in sorted(ext, key=lambda r: r['item']): w.writerow([r['brand'], r['item'], r['sku'], r['oh'], r['ytd'], f2(r['ytd_d'])])
B(); w.writerow(['BRAND NEWS'])
w.writerow(['Not re-run on the daily refresh. See the newest weekly report for brand news.'])
B(); w.writerow(['FULL STOCK LIST (%d items; Bellami and non-products left out)' % len(rows)])
w.writerow(['Brand', 'Product', 'SKU', 'Category', 'On Hand', 'Cost Each', 'Value at Cost', 'YTD Units', 'YTD Sales $', 'Last 30 Days Units', 'Status'])
for r in sorted(rows, key=lambda r: (r['brand'], r['item'].lower())):
    w.writerow([r['brand'], r['item'], r['sku'], CATN.get(r['cat'], r['cat']), r['oh'], f2(r['cost']), f2(r['oh'] * r['cost']), r['ytd'], f2(r['ytd_d']), r['d30'], r['status']])
open(A.out, 'w').write(buf.getvalue())
print(json.dumps(dict(checks=checks, glance=glance, needs=needs, top3=[(r['item'], r['ytd']) for r in top[:3]], lines=buf.getvalue().count('\n')), indent=1))
