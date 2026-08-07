import os, subprocess, unicodedata, re, math
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "fabricas")
os.makedirs(OUT, exist_ok=True)

CW, CH = 1600, 500
NAVY=(12,33,54); NAVY2=(18,59,92); CELESTE=(143,205,235); ORANGE=(255,90,31); WHITE=(255,255,255)
FBOLD="/System/Library/Fonts/Avenir Next.ttc"
IDX=0
for i in (1,0):
    try: ImageFont.truetype(FBOLD,40,index=i); IDX=i; break
    except Exception: pass
def F(sz): return ImageFont.truetype(FBOLD, sz, index=IDX)

def slug(name):
    s=unicodedata.normalize("NFD",name).encode("ascii","ignore").decode().lower()
    s=s.replace("&"," ")
    s=re.sub(r"[^a-z0-9]+","-",s).strip("-")
    return s

def initials(name):
    w=[x for x in re.sub(r"[^A-Za-zÀ-ÿ ]"," ",name).split() if x]
    return ((w[0][0] if w else "")+(w[1][0] if len(w)>1 else "")).upper()

# tinte por país (dentro de la familia Traelo)
TINT={"China":(20,70,96),"Estados Unidos":(24,52,110),"España":(28,58,92),
      "Italia":(26,64,80),"India":(30,60,70)}

def cover(name, country):
    top=NAVY; bot=TINT.get(country,NAVY2)
    img=Image.new("RGB",(CW,CH),NAVY); d=ImageDraw.Draw(img)
    # diagonal-ish gradient
    for y in range(CH):
        t=y/CH
        c=tuple(int(a+(b-a)*t) for a,b in zip(top,bot))
        d.line([(0,y),(CW,y)],fill=c)
    # celeste glow (soft ellipse)
    glow=Image.new("RGBA",(CW,CH),(0,0,0,0)); gd=ImageDraw.Draw(glow)
    gd.ellipse([CW-780,-260,CW+180,520],fill=(143,205,235,60))
    img=Image.alpha_composite(img.convert("RGBA"),glow).convert("RGB"); d=ImageDraw.Draw(img)
    # huge translucent monogram
    mono=initials(name); mf=F(360)
    layer=Image.new("RGBA",(CW,CH),(0,0,0,0)); ld=ImageDraw.Draw(layer)
    mw=ld.textlength(mono,font=mf); ld.text((CW-mw-90, CH/2-215), mono, font=mf, fill=(255,255,255,26))
    img=Image.alpha_composite(img.convert("RGBA"),layer).convert("RGB"); d=ImageDraw.Draw(img)
    # traelo mark
    wm=F(40); d.text((70,60),"traelo",font=wm,fill=WHITE)
    wmw=d.textlength("traelo",font=wm); d.ellipse([70+wmw+7,60+30,70+wmw+7+14,60+44],fill=ORANGE)
    # verificado chip
    cf=F(26); lab="PROVEEDOR VERIFICADO"; lw=d.textlength(lab,font=cf)
    d.rounded_rectangle([70,CH-120,70+lw+40,CH-120+44],radius=22,fill=(255,255,255,30))
    d.text((70+20,CH-110),lab,font=cf,fill=CELESTE)
    # país
    pf=F(30); d.text((70+lw+70,CH-108),country,font=pf,fill=(210,224,240))
    img.save(os.path.join(OUT,f"{slug(name)}-cover.jpg"),quality=88)

rows=subprocess.run(["psql","postgresql://postgres:superplataforma@localhost:54340/superplataforma",
  "-tA","-F","|","-c","SELECT name,country FROM \"Supplier\""],capture_output=True,text=True).stdout.strip().split("\n")
for r in rows:
    name,country=r.split("|"); cover(name,country)
print(f"OK {len(rows)} portadas en {OUT}")
