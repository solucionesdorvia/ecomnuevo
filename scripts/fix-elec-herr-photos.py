"""Asigna fotos REALES y que MATCHEAN a los productos demo de Electrónica y
Herramientas (que no existen en Union Home / Sellers Union). Fuente:
made-in-china.com (búsqueda server-rendered con buena relevancia).
Para cada producto: busca su keyword, filtra las imágenes cuyo alt contiene el
término esperado, baja la primera y sobrescribe public/productos/<slug>-1.jpg.

Uso: python3 scripts/fix-elec-herr-photos.py
"""
import os, re, html, urllib.request, urllib.parse, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "public", "productos")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

# slug -> (keyword de búsqueda, regex de relevancia que debe estar en el alt)
JOBS = {
    # Electrónica
    "auriculares-bt-anc":        ("bluetooth headphones anc",   r"headphone|headset|earphone|earbud"),
    "smartwatch-amoled":         ("amoled smart watch",         r"smart\s*watch|smartwatch"),
    "proyector-portatil-1080p":  ("portable projector 1080p",   r"projector"),
    "teclado-mecanico-75":       ("mechanical keyboard rgb",     r"keyboard"),
    "camara-accion-4k":          ("4k action camera",           r"action\s*camera|sport\s*camera|action\s*cam"),
    "parlante-bt-ipx7":          ("waterproof bluetooth speaker", r"speaker"),
    "tablet-11-128gb":           ("android tablet pc",          r"tablet"),
    "drone-camara-2k":           ("camera drone",               r"drone|uav|quadcopter"),
    # Herramientas
    "atornillador-inalambrico-21v": ("cordless drill driver",   r"drill|driver"),
    "kit-herramientas-168":      ("hand tool set kit",          r"tool\s*set|tool\s*kit|tools\s*set"),
    "sierra-circular-mini":      ("mini circular saw",          r"circular\s*saw|\bsaw\b"),
    "estacion-soldado-digital":  ("soldering station iron",     r"solder"),
    "multimetro-automotor":      ("digital multimeter",         r"multimeter|multi\s*meter"),
    "compresor-portatil-digital":("portable air compressor",    r"air\s*compressor|compressor|inflator|air\s*pump"),
    "organizador-taller-pared":  ("tool pegboard wall organizer", r"pegboard|tool\s*organizer|wall\s*mount|tool\s*storage|garage"),
}

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")

def dl(url, path):
    if url.startswith("//"):
        url = "https:" + url
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://www.made-in-china.com/"})
        d = urllib.request.urlopen(req, timeout=30).read()
        if len(d) < 3000:
            return False
        open(path, "wb").write(d)
        return True
    except Exception as e:
        print("   dl err", e)
        return False

def pairs_from(page):
    # (img_src, alt) en cualquier orden de atributos
    p = re.findall(r'<img[^>]*?(?:data-original|data-src|src)="([^"]*made-in-china[^"]*\.(?:jpg|jpeg|webp))"[^>]*alt="([^"]{5,110})"', page)
    q = re.findall(r'<img[^>]*alt="([^"]{5,110})"[^>]*?(?:data-original|data-src|src)="([^"]*made-in-china[^"]*\.(?:jpg|jpeg|webp))"', page)
    return p + [(b, a) for a, b in q]

def main():
    ok = 0
    for slug, (kw, rel) in JOBS.items():
        url = f"https://www.made-in-china.com/multi-search/{urllib.parse.quote_plus(kw)}/F1/1.html"
        try:
            page = get(url)
        except Exception as e:
            print(f"[skip] {slug}: {e}"); continue
        rx = re.compile(rel, re.I)
        picked = None
        seen = set()
        for src, alt in pairs_from(page):
            alt = html.unescape(alt)
            if src in seen:
                continue
            seen.add(src)
            if re.search(r"co\.,?\s*ltd|company|factory logo", alt, re.I) and not rx.search(alt):
                continue
            if not rx.search(alt):
                continue
            if dl(src, os.path.join(IMG_DIR, f"{slug}-1.jpg")):
                picked = alt[:55]
                break
        if picked:
            ok += 1
            print(f"[ok] {slug}  <-  {picked}")
        else:
            print(f"[MISS] {slug}  (sin match para '{kw}')")
        time.sleep(0.3)
    print(f"\n{ok}/{len(JOBS)} asignados")

main()
