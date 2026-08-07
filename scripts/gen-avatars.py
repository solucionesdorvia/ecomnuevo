import os, re, subprocess, unicodedata, io, urllib.request
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "fabricas")
os.makedirs(OUT, exist_ok=True)
S = 400
NAVY=(12,33,54); NAVY2=(18,59,92); CELESTE=(143,205,235); ORANGE=(255,90,31); WHITE=(255,255,255)
FBOLD="/System/Library/Fonts/Avenir Next.ttc"
IDX=0
for i in (1,0):
    try: ImageFont.truetype(FBOLD,40,index=i); IDX=i; break
    except Exception: pass
def F(sz): return ImageFont.truetype(FBOLD, sz, index=IDX)
UA={"User-Agent":"Mozilla/5.0"}

def slug(name):
    s=unicodedata.normalize("NFD",name).encode("ascii","ignore").decode().lower().replace("&"," ")
    return re.sub(r"[^a-z0-9]+","-",s).strip("-")
def initials(name):
    w=[x for x in re.sub(r"[^A-Za-zÀ-ÿ ]"," ",name).split() if x]
    return ((w[0][0] if w else "")+(w[1][0] if len(w)>1 else "")).upper()

def monogram(name):
    img=Image.new("RGB",(S,S),NAVY); d=ImageDraw.Draw(img)
    for y in range(S):  # gradient
        t=y/S; c=tuple(int(a+(b-a)*t) for a,b in zip(NAVY,NAVY2)); d.line([(0,y),(S,y)],fill=c)
    d.ellipse([S-150,-80,S+80,150],fill=(143,205,235)) if False else None
    ini=initials(name); f=F(190); tw=d.textlength(ini,font=f)
    # sombra suave
    d.text(((S-tw)/2, S/2-140), ini, font=f, fill=WHITE, anchor="la")
    # punto naranja de marca
    d.ellipse([S-92,S-92,S-52,S-52],fill=ORANGE)
    img.save(os.path.join(OUT,f"{slug(name)}-avatar.png"))

def logo_avatar(name, url):
    try:
        raw=urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=25).read()
        logo=Image.open(io.BytesIO(raw)).convert("RGBA")
    except Exception as e:
        print("logo fail, uso monograma:", e); monogram(name); return
    bg=Image.new("RGB",(S,S),WHITE)
    pad=54; box=S-2*pad
    lw,lh=logo.size; scale=min(box/lw, box/lh); nw,nh=int(lw*scale),int(lh*scale)
    logo=logo.resize((nw,nh))
    bg.paste(logo,((S-nw)//2,(S-nh)//2),logo)
    ImageDraw.Draw(bg).ellipse([S-92,S-92,S-52,S-52],fill=ORANGE)
    bg.save(os.path.join(OUT,f"{slug(name)}-avatar.png"))

LOGO={"Union Home":"https://www.unionhome.cn/wp-content/uploads/2025/08/logo-2025082206515155.webp"}

rows=subprocess.run(["psql","postgresql://postgres:superplataforma@localhost:54340/superplataforma",
  "-tA","-F","|","-c","SELECT name FROM \"Supplier\""],capture_output=True,text=True).stdout.strip().split("\n")
for name in rows:
    name=name.strip()
    if name in LOGO: logo_avatar(name, LOGO[name])
    else: monogram(name)
    print("avatar:", slug(name))
print(f"OK {len(rows)} avatars")
