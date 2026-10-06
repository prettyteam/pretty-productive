#!/usr/bin/env python3
"""Turn Paired Plus "Stylist Work Schedule" text into data.schedule JSON.
Usage: parse-schedule.py out.json 2026-10-05=week1.txt 2026-10-12=week2.txt
Each file: one row per stylist, tab separated: name, then 7 cells Mon..Sun
("09:00A 08:00P" or "-" / "---- Off ----" for off). Names map to app slugs."""
import json, re, sys, datetime
def slug(n): return re.sub(r'[^a-z0-9]+','-',n.lower()).strip('-')
def t(s):
    m=re.match(r'(\d\d):(\d\d)([AP])$',s); h,mi,ap=int(m[1]),m[2],m[3]
    return f"{h}{'' if mi=='00' else ':'+mi} {ap}M"
def cell(c):
    c=c.strip()
    if not c or 'Off' in c or c=='-': return None
    a,b=c.split(); return f"{t(a)} – {t(b)}"
people={}
for arg in sys.argv[2:]:
    start,f=arg.split('=')
    for line in open(f):
        r=line.rstrip('\n').split('\t')
        if len(r)<8: continue
        people.setdefault(slug(r[0]),[]).append({"start":start,"days":[cell(x) for x in r[1:8]]})
json.dump({"updated":datetime.date.today().isoformat(),"people":people},open(sys.argv[1],'w'),indent=1)
