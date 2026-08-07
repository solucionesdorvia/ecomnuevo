"""Scrapea Sellers Union Online (sellersuniononline.com), una plataforma B2B de
Ningbo/Yiwu. Las páginas de categoría están server-rendered en /front/products?cate_id=,
con tarjetas <div class="products-list"> <li> <a title="NOMBRE"> + <img commodity2>.
Traduce nombres al español (sustantivo base + modificadores), baja la imagen original,
deduplica y escribe prisma/sellers-union.json. Preserva entradas ya existentes por slug.

Uso: python3 scripts/scrape-sellersunion.py [cap_por_categoria]
"""
import os, sys, re, json, html, time, urllib.request, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "public", "productos")
OUT = os.path.join(ROOT, "prisma", "sellers-union.json")
os.makedirs(IMG_DIR, exist_ok=True)
BASE = "https://www.sellersuniononline.com"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
CAP = int(sys.argv[1]) if len(sys.argv) > 1 else 8

# (cate_id, nuestra categoría)
CATS = [
    ("100028790", "HOGAR"),        # Cookware
    ("10000943", "HOGAR"),         # Kitchen Tools & Gadgets
    ("100029620", "HOGAR"),        # Water Bottles
    ("10000947", "HOGAR"),         # Drinkware
    ("10000110", "HOGAR"),         # Kitchen & Tabletop
    ("10000015", "INDUMENTARIA"),  # Eyewear & Accessories
    ("10001039", "INDUMENTARIA"),  # Watch & Accessories
    ("10000014", "INDUMENTARIA"),  # Belt & Accessories
]

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": BASE + "/front/directory"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "ignore")

# ── Traducción sustantivo base + modificadores ──────────────────────────────
NOISE = re.compile(r"\b(new arrival|new product|new style|hot sale|hot selling|hot items|hot products|top products|top selling|top sale|top quality|best quality|best sale|best selling|good sale|good selling|good quality|good price|low price|factory price|factory direct sale|china wholesale|china supplier|china products|china factory|online wholesale|wholesale|popular products|yiwu market|for sale|for gifts|for home|for summer outdoor|multicolor|multi[- ]?purpose)\b", re.I)

HEADS = [
    (r"frying pan|fry pan", "Sartén"),
    (r"soup pot|stock pot|cooking pot|cookware pot", "Olla"),
    (r"steaming rack|steamer rack|steam rack", "Rejilla para vaporera"),
    (r"pot cover rack|lid rack|pot lid", "Organizador de tapas"),
    (r"vegetable grater|cheese grater|grater", "Rallador"),
    (r"egg whisk|egg beater|whisk", "Batidor manual"),
    (r"vegetable chopper|manual chopper|chopper", "Picador de verduras"),
    (r"tea strainer|strainer ball|infuser", "Colador de té"),
    (r"coffee filter|paper filter", "Filtros de café"),
    (r"cleaning brush|scrub brush|brush", "Cepillo de limpieza"),
    (r"oil bottle|condiment bottle|oil dispenser", "Aceitera"),
    (r"water bottle|drinking bottle|sports bottle", "Botella deportiva"),
    (r"vacuum flask|thermos|thermal bottle", "Termo"),
    (r"cup|mug", "Taza"),
    (r"knife", "Cuchillo de cocina"),
    (r"cutting board|chopping board", "Tabla de cortar"),
    (r"sunglasses", "Anteojos de sol"),
    (r"glasses case|sunglasses box|glasses box", "Estuche para anteojos"),
    (r"smart watch|smartwatch", "Smartwatch"),
    (r"kids watch|children.*watch|watch.*(kids|children|boys|girls)", "Reloj infantil"),
    (r"watch strap|watch band", "Malla para reloj"),
    (r"digital watch|sports watch|watch", "Reloj"),
    (r"buckle belt|waist belt|leather belt|belt", "Cinturón"),
    (r"rack", "Organizador"),
    (r"bottle", "Botella"),
    (r"box|case", "Estuche"),
]

MODS = [
    (r"non[- ]?stick", "antiadherente"),
    (r"stainless steel|stainless", "de acero inoxidable"),
    (r"cast iron|iron", "de hierro"),
    (r"leather", "de cuero"),
    (r"glass", "de vidrio"),
    (r"plastic", "de plástico"),
    (r"bamboo", "de bambú"),
    (r"wooden|wood", "de madera"),
    (r"silicone", "de silicona"),
    (r"digital", "digital"),
    (r"waterproof|water[- ]?resistant", "sumergible"),
    (r"large capacity|large[- ]?capacity", "de gran capacidad"),
    (r"portable", "portátil"),
    (r"foldable|folding", "plegable"),
    (r"adjustable", "regulable"),
    (r"handheld", "de mano"),
    (r"with wooden handle", "con mango de madera"),
    (r"with handle", "con mango"),
    (r"with straw", "con sorbete"),
    (r"with zipper", "con cierre"),
    (r"retro style|retro", "retro"),
    (r"fashion|fashionable", "fashion"),
    (r"cartoon|cute|bear|strawberry|cute bear", "diseño infantil"),
    (r"\bmen\b|\bmens\b|for men", "de hombre"),
    (r"\bwomen\b|\bwomens\b|for women|lady", "de mujer"),
    (r"outdoor|sports|sport", "deportivo"),
    (r"round", "redondo"),
    (r"black", "negro"),
    (r"blue", "azul"),
    (r"pink", "rosa"),
]

def es_name(name_en):
    low = " " + name_en.lower() + " "
    base = None
    for rx, es in HEADS:
        if re.search(r"(" + rx + r")", low):
            base = es
            break
    if not base:
        return None
    parts = [base]
    seen = set()
    for rx, es in MODS:
        if es in seen:
            continue
        if re.search(r"(" + rx + r")", low):
            parts.append(es)
            seen.add(es)
        if len(parts) >= 4:
            break
    # capacidad en litros / ml / piezas
    m = re.search(r"(\d+)\s?(l|ml)\b", low)
    if m:
        parts.append(f"{m.group(1)} {m.group(2).upper()}")
    m = re.search(r"(\d+)\s?pcs\b", low)
    if m:
        parts.append(f"x{m.group(1)}")
    s = re.sub(r"\s+", " ", " ".join(parts)).strip()
    return s[:1].upper() + s[1:]

def slugify(s):
    s = s.lower().replace("ñ", "n")
    s = re.sub(r"[áàä]", "a", s); s = re.sub(r"[éèë]", "e", s); s = re.sub(r"[íìï]", "i", s)
    s = re.sub(r"[óòö]", "o", s); s = re.sub(r"[úùü]", "u", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

def price_for(seed, cat):
    r = (seed * 2654435761) % 1000 / 1000.0
    price = round(18 + r * (75 if cat == "HOGAR" else 60))
    cost = round(price / 2.4, 2); freight = round(price * 0.13, 2); taxes = round(price * 0.22, 2)
    margin = round(price - cost - freight - taxes, 2)
    ref = round(price * 1.6) if (seed % 3 != 0) else None
    return dict(costUsd=cost, freightUsd=freight, taxesUsd=taxes, marginUsd=margin,
                priceUsd=float(price), referencePriceUsd=(float(ref) if ref else None))

def weight_for(seed, cat):
    r = (seed * 40503) % 1000 / 1000.0
    return round((0.4 + r * 3.2) if cat == "HOGAR" else (0.1 + r * 0.6), 2)

def desc(es_title):
    return (f"{es_title}. Traído directo de Sellers Union Online, agencia de comercio "
            "exterior en Ningbo, China. El precio incluye producto, flete marítimo e "
            "impuestos: no pagás nada más al recibirlo. Viaja consolidado en barco bajo "
            "régimen courier, a tu nombre.")

# extraer productos de una página de categoría (server-rendered)
def parse_products(page_html):
    # aislar el bloque de listado
    m = re.search(r'products-list(.*?)(products-page|</section>|footer)', page_html, re.S)
    block = m.group(1) if m else page_html
    items = []
    for li in re.split(r'<li', block)[1:]:
        t = re.search(r'title="([^"]{8,120})"', li)
        img = re.search(r'/upload/commodity2/[0-9]+/[0-9_]+\.jpg', li)
        if not t or not img:
            continue
        name = html.unescape(t.group(1)).strip()
        if re.search(r'supplier|view |category|member', name, re.I):
            continue
        items.append((name, img.group(0)))
    return items

def dl(url, path):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": BASE})
        d = urllib.request.urlopen(req, timeout=30).read()
        if len(d) < 1200:
            return False
        open(path, "wb").write(d); return True
    except Exception:
        return False

def main():
    existing = {}
    if os.path.exists(OUT):
        for p in json.load(open(OUT)):
            existing[p["slug"]] = p
    out = list(existing.values())
    seen_slug = set(existing.keys())
    seen_img = set()
    seed = 700

    for cid, cat in CATS:
        try:
            page = get(f"{BASE}/front/products?cate_id={cid}")
        except Exception as e:
            print(f"  [skip {cid}] {e}"); continue
        prods = parse_products(page)
        n = 0
        for name_en, img_path in prods:
            if n >= CAP:
                break
            if img_path in seen_img:
                continue
            es = es_name(NOISE.sub("", name_en))
            if not es or len(es) < 5:
                continue
            slug = "su-" + slugify(es)[:48]
            # dedupe de slug con sufijo
            base_slug = slug; k = 2
            while slug in seen_slug:
                slug = f"{base_slug}-{k}"; k += 1
            seed += 1
            if not dl(BASE + img_path, os.path.join(IMG_DIR, f"{slug}-1.jpg")):
                continue
            seen_slug.add(slug); seen_img.add(img_path)
            out.append(dict(slug=slug, title=es, description=desc(es), category=cat,
                            weightKg=weight_for(seed, cat), volumeM3=0.015, images=1,
                            **price_for(seed, cat)))
            n += 1
            print(f"  [{len(out):3}] {cat[:4]} · {es[:48]}")
            time.sleep(0.15)

    # deduplicar títulos exactos con sufijo de variante
    SIZES = ["", " (chico)", " (mediano)", " (grande)", " (XL)", " (premium)", " (compacto)", " (reforzado)"]
    groups = collections.defaultdict(list)
    for p in out:
        groups[p["title"]].append(p)
    for title, its in groups.items():
        if len(its) > 1:
            for i, p in enumerate(its):
                p["title"] = title + (SIZES[i] if i < len(SIZES) else f" (modelo {i+1})")

    json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=2)
    print(f"\nOK {len(out)} productos ({len(out)-len(existing)} nuevos) → {OUT}")

main()
