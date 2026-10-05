#!/usr/bin/env python3
"""Build each stylist's weekly commission report PDF.
Usage: python3 tools/make-cr.py input.json outdir
input.json: {"week":"2026-09-28","label":"Sep 28 – Oct 4","runOn":"Oct 5, 2026",
  "stylists":[{"slug","name","services":[{"date","client","item","qty","price","disc","amount","comm"}],
               "rate":45,"products":[same shape], "serviceTotal","retailTotal","commTotal"}]}
Writes outdir/<week>/<slug>.pdf and outdir/meta.json for publish.mjs --cr. Client names are shortened to First + last initial.
"""
import json, os, sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
BROWN=colors.HexColor('#423327'); IVORY=colors.HexColor('#F2F1EC'); GOLD=colors.HexColor('#B4925B')
def short(n):
    n=(n or '').strip()
    if ',' in n:
        last,first=[x.strip() for x in n.split(',',1)]
    else:
        parts=n.split(); first=parts[0] if parts else ''; last=parts[-1] if len(parts)>1 else ''
    return (first+(' '+last[0]+'.' if last else '')).strip()
def m(x): return '${:,.2f}'.format(float(x or 0))
def build(st, week, label, runOn, path):
    rate=float(st.get("rate") or 0); rrate=float(st.get("retailRate") if st.get("retailRate") is not None else rate)
    for r in st.get("services",[]): r["comm"]=round(float(r.get("amount") or 0)*rate/100,2)
    for r in st.get("products",[]): r["comm"]=round(float(r.get("amount") or 0)*rrate/100,2)
    st["commTotal"]=round(sum(r["comm"] for r in st.get("services",[]))+sum(r["comm"] for r in st.get("products",[])),2)
    H=ParagraphStyle('h',fontName='Times-Bold',fontSize=22,textColor=BROWN,leading=26)
    S=ParagraphStyle('s',fontName='Helvetica',fontSize=10,textColor=colors.HexColor('#6b5d50'),leading=14)
    L=ParagraphStyle('l',fontName='Helvetica-Bold',fontSize=9,textColor=GOLD,leading=12)
    N=ParagraphStyle('n',fontName='Helvetica',fontSize=9,textColor=BROWN,leading=12)
    doc=SimpleDocTemplate(path,pagesize=letter,leftMargin=.7*inch,rightMargin=.7*inch,topMargin=.7*inch,bottomMargin=.7*inch,title='Weekly commission report – '+st['name'],author='Taffeta Salon & Spa')
    el=[Paragraph('TAFFETA SALON &amp; SPA',L),Spacer(1,4),Paragraph('Weekly commission report',H),Spacer(1,4),
        Paragraph('%s &nbsp;·&nbsp; %s<br/>Prepared %s'%(st['name'],label,runOn),S),Spacer(1,14)]
    tot=[['Services',m(st['serviceTotal'])],['Retail',m(st['retailTotal'])],['Combined sales',m(float(st['serviceTotal'] or 0)+float(st['retailTotal'] or 0))],['Your commission rate','%g%%'%rate],['Commission earned (take-home)',m(st['commTotal'])]]
    t=Table(tot,colWidths=[3.2*inch,1.6*inch],hAlign='LEFT')
    t.setStyle(TableStyle([('FONT',(0,0),(-1,-1),'Helvetica',11),('FONT',(0,4),(-1,4),'Helvetica-Bold',12),('TEXTCOLOR',(0,0),(-1,-1),BROWN),('ALIGN',(1,0),(1,-1),'RIGHT'),
        ('BACKGROUND',(0,0),(-1,-1),IVORY),('LINEBELOW',(0,0),(-1,-2),.4,colors.HexColor('#d9d2c4')),('LINEABOVE',(0,4),(-1,4),.8,GOLD),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10)]))
    el+=[t,Spacer(1,16)]
    def table(title, rows, total_label, total):
        el.append(Paragraph(title.upper(),L)); el.append(Spacer(1,4))
        if not rows:
            el.append(Paragraph('Nothing this week.',N)); el.append(Spacer(1,12)); return
        data=[['Date','Guest','Service / product','Amount','Commission']]
        for r in rows: data.append([r.get('date',''),short(r.get('client')),Paragraph(r.get('item',''),N),m(r.get('amount')),m(r.get('comm'))])
        data.append(['','',total_label,m(total),m(sum(float(r.get('comm') or 0) for r in rows))])
        tb=Table(data,colWidths=[.8*inch,1.3*inch,2.6*inch,.9*inch,1.0*inch],repeatRows=1)
        tb.setStyle(TableStyle([('FONT',(0,0),(-1,0),'Helvetica-Bold',8.5),('TEXTCOLOR',(0,0),(-1,0),colors.white),('BACKGROUND',(0,0),(-1,0),BROWN),
            ('FONT',(0,1),(-1,-1),'Helvetica',9),('TEXTCOLOR',(0,1),(-1,-1),BROWN),('ALIGN',(3,0),(-1,-1),'RIGHT'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
            ('ROWBACKGROUNDS',(0,1),(-1,-2),[colors.white,IVORY]),('FONT',(0,-1),(-1,-1),'Helvetica-Bold',9.5),('LINEABOVE',(0,-1),(-1,-1),.8,GOLD),
            ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
        el.append(tb); el.append(Spacer(1,14))
    table('Services',st.get('services',[]),'Service total',st['serviceTotal'])
    table('Retail',st.get('products',[]),'Retail total',st['retailTotal'])
    el.append(Paragraph('Questions about a line? Ask Alexandra before payday. Guest names are shortened for privacy. This report is only for you.',S))
    doc.build(el)
def main():
    inp,out=sys.argv[1],sys.argv[2]
    d=json.load(open(inp)); wk=d['week']; os.makedirs(os.path.join(out,wk),exist_ok=True); people={}
    for st in d['stylists']:
        build(st,wk,d['label'],d['runOn'],os.path.join(out,wk,st['slug']+'.pdf'))
        people[st['slug']]={'service':st['serviceTotal'],'retail':st['retailTotal'],'comm':st['commTotal'],'rate':st.get('rate')}
    json.dump({'weeks':[{'week':wk,'label':d['label'],'people':people}]},open(os.path.join(out,'meta.json'),'w'))
    print('built',len(people),'reports')
main()
