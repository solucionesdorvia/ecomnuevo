import os, subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "productos")
os.makedirs(OUT, exist_ok=True)

W, H = 1000, 1250
NAVY=(12,33,54); CELESTE_BADGE=(214,238,249); ORANGE=(255,90,31); MUTED=(94,113,131)
FBOLD="/System/Library/Fonts/Avenir Next.ttc"
IDX=0
for i in (1,0):
    try: ImageFont.truetype(FBOLD,40,index=i); IDX=i; break
    except Exception: pass
def F(sz): return ImageFont.truetype(FBOLD, sz, index=IDX)
def rr(d,b,r,**k): d.rounded_rectangle(b,radius=r,**k)

def bg(img):
    d=ImageDraw.Draw(img)
    for y in range(H):
        t=y/H
        c=tuple(int(a+(b-a)*t) for a,b in zip((224,239,250),(255,255,255)))
        d.line([(0,y),(W,y)],fill=c)
    return d

def g_ele(d,cx,cy,s):
    c=NAVY; w=int(s*0.13)
    d.arc([cx-s,cy-s,cx+s,cy+s],200,340,fill=c,width=w)
    cw=int(s*0.34); ch=int(s*0.55)
    rr(d,[cx-s+int(s*0.02),cy-int(ch*0.1),cx-s+cw,cy-int(ch*0.1)+ch],cw//2,fill=c)
    rr(d,[cx+s-cw,cy-int(ch*0.1),cx+s-int(s*0.02),cy-int(ch*0.1)+ch],cw//2,fill=c)
def g_hog(d,cx,cy,s):
    c=NAVY; w=int(s*0.12)
    d.line([(cx-s,cy-int(s*0.05)),(cx,cy-s)],fill=c,width=w,joint="curve")
    d.line([(cx,cy-s),(cx+s,cy-int(s*0.05))],fill=c,width=w,joint="curve")
    bw=int(s*0.78)
    d.line([(cx-bw//2,cy-int(s*0.05)),(cx-bw//2,int(cy+s*0.7))],fill=c,width=w)
    d.line([(cx+bw//2,cy-int(s*0.05)),(cx+bw//2,int(cy+s*0.7))],fill=c,width=w)
    d.line([(cx-bw//2,int(cy+s*0.7)),(cx+bw//2,int(cy+s*0.7))],fill=c,width=w)
    dw=int(s*0.26)
    rr(d,[cx-dw//2,int(cy+s*0.7-s*0.5),cx+dw//2,int(cy+s*0.7)],dw//3,outline=c,width=w)
def g_ind(d,cx,cy,s):
    c=NAVY
    p=[(cx-int(s*0.45),cy-int(s*0.55)),(cx-int(s*0.9),cy-int(s*0.2)),(cx-int(s*0.62),cy+int(s*0.15)),
       (cx-int(s*0.4),cy-int(s*0.02)),(cx-int(s*0.4),cy+int(s*0.85)),(cx+int(s*0.4),cy+int(s*0.85)),
       (cx+int(s*0.4),cy-int(s*0.02)),(cx+int(s*0.62),cy+int(s*0.15)),(cx+int(s*0.9),cy-int(s*0.2)),
       (cx+int(s*0.45),cy-int(s*0.55)),(cx+int(s*0.24),cy-int(s*0.4)),(cx,cy-int(s*0.28)),(cx-int(s*0.24),cy-int(s*0.4))]
    d.polygon(p,fill=c)
def g_her(d,cx,cy,s):
    c=NAVY; w=int(s*0.13)
    d.regular_polygon((cx,cy,int(s*0.82)),n_sides=6,rotation=90,outline=c,width=w)
    d.ellipse([cx-int(s*0.34),cy-int(s*0.34),cx+int(s*0.34),cy+int(s*0.34)],outline=c,width=w)
GL={"ELECTRONICA":(g_ele,"Electrónica"),"HOGAR":(g_hog,"Hogar"),
    "INDUMENTARIA":(g_ind,"Indumentaria"),"HERRAMIENTAS":(g_her,"Herramientas")}

def make(slug,cat):
    img=Image.new("RGB",(W,H),(255,255,255)); d=bg(img)
    wm=F(42); d.text((60,56),"traelo",font=wm,fill=NAVY)
    wmw=d.textlength("traelo",font=wm); d.ellipse([60+wmw+7,56+32,60+wmw+7+14,56+46],fill=ORANGE)
    bs=460; bx=(W-bs)//2; by=(H-bs)//2-40
    rr(d,[bx,by,bx+bs,by+bs],70,fill=CELESTE_BADGE)
    glyph,label=GL[cat]; glyph(d,W//2,by+bs//2,int(bs*0.28))
    lf=F(34); lw=d.textlength(label,font=lf); d.text(((W-lw)//2,by+bs+40),label,font=lf,fill=MUTED)
    img.save(os.path.join(OUT,f"{slug}-1.jpg"),quality=90)

rows=subprocess.run(["psql","postgresql://postgres:superplataforma@localhost:54340/superplataforma",
  "-tA","-F","|","-c","SELECT slug,category FROM \"Product\""],capture_output=True,text=True).stdout.strip().split("\n")
for r in rows:
    slug,cat=r.split("|"); make(slug,cat)
print(f"OK {len(rows)} imágenes en {OUT}")
