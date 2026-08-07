"""Scrapea Union Home (WooCommerce Store API), traduce nombres al español con un
enfoque de 'sustantivo base + modificadores' (más limpio que palabra por palabra),
baja fotos y escribe prisma/union-home.json. Preserva entradas ya existentes
(las traducidas a mano) por slug.

Uso: python3 scripts/scrape-unionhome.py [total] [imgs_por_producto] [cap_por_categoria]
"""
import os, sys, json, re, html, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "public", "productos")
OUT = os.path.join(ROOT, "prisma", "union-home.json")
os.makedirs(IMG_DIR, exist_ok=True)
API = "https://www.unionhome.cn/wp-json/wc/store/v1/products"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
TARGET = int(sys.argv[1]) if len(sys.argv) > 1 else 120
IMGS = int(sys.argv[2]) if len(sys.argv) > 2 else 1
CATCAP = int(sys.argv[3]) if len(sys.argv) > 3 else 12

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

NOISE = re.compile(r"\b(whole?sale|oem|odm|manufacturer|exporter|supplier|factory|hot ?sale|hot ?selling|best ?selling|hot|selling|best|new ?arrival|new|popular|20\d\d|cheap|price|custom(ized)?|china|chinese|export|import|professional|high ?quality|premium|top|design|technology|nordic|modern|multi[- ]?functional)\b", re.I)
BRAND = re.compile(r"\b(STORAGEPLUS|storageplus|pom|POM)\b")

# Sustantivo base (prioridad de arriba hacia abajo). Regex -> base ES.
HEADS = [
 (r"laundry (basket|hamper)", "Cesto de ropa"),
 (r"garment rack", "Perchero de pie"),
 (r"shoe rack", "Zapatero"),
 (r"storage ottoman|ottoman bench|ottoman|pouf|pouffe", "Puff baúl con guardado"),
 (r"storage cart|rolling cart|utility cart|cart", "Carrito organizador"),
 (r"storage box|storage bin|box|bin", "Caja organizadora"),
 (r"wire basket|storage basket|basket", "Cesto"),
 (r"shelving|shelf|shelves|shelve", "Estantería"),
 (r"clothes? rack|coat rack|rack", "Perchero"),
 (r"drawer organizer|organizer|organiser", "Organizador"),
 (r"suit bag|garment bag|storage bag|bag", "Funda organizadora"),
 (r"hanger", "Percha"),
 (r"hook", "Ganchos"),
 (r"holder|stand", "Soporte"),
 (r"mirror", "Espejo"),
 (r"lamp|light", "Lámpara"),
 (r"clock", "Reloj"),
 (r"vase", "Florero"),
 (r"planter|flower ?pot", "Maceta"),
 (r"cushion|pillow", "Almohadón"),
 (r"blanket|throw", "Manta"),
 (r"rug|mat|carpet", "Alfombra"),
 (r"towel", "Toalla"),
 (r"cutting board|chopping board", "Tabla de cortar"),
 (r"bottle", "Botella"),
 (r"mug|cup", "Taza"),
 (r"bowl", "Bowl"),
 (r"tray", "Bandeja"),
 (r"knife|cutlery", "Set de cuchillos"),
 (r"bucket|beverage tub|ice bucket|tub", "Conservadora de bebidas"),
 (r"container|canister|jar", "Contenedor"),
 (r"hamper", "Cesto de ropa"),
 (r"toy|plush", "Juguete"),
 (r"brush", "Cepillo"),
 (r"bag", "Bolso"),
]

MODS = [
 (r"foldable|folding|fold[- ]?up|pop ?up|collapsible", "plegable"),
 (r"stackable|stacking", "apilable"),
 (r"expandable|extendable|extendible", "extensible"),
 (r"rolling|with wheels|wheeled", "con ruedas"),
 (r"hanging|over[- ]?the[- ]?door|wall[- ]?mounted", "colgante"),
 (r"corner", "esquinero"),
 (r"round", "redondo"),
 (r"rectangle|rectangular", "rectangular"),
 (r"square", "cuadrado"),
 (r"bamboo", "de bambú"),
 (r"rattan|wicker", "de ratán"),
 (r"wire", "de alambre"),
 (r"mesh", "de malla"),
 (r"canvas", "de lona"),
 (r"cotton( rope)?", "de algodón"),
 (r"wooden|wood", "de madera"),
 (r"plastic", "de plástico"),
 (r"stainless steel|stainless|metal|iron|steel", "de metal"),
 (r"velvet|fabric|linen|felt", "de tela"),
 (r"ceramic", "de cerámica"),
 (r"glass", "de vidrio"),
 (r"silicone", "de silicona"),
 (r"waterproof|water[- ]?resistant", "impermeable"),
 (r"portable", "portátil"),
 (r"adjustable", "regulable"),
 (r"non[- ]?skid|non[- ]?slip|anti[- ]?slip", "antideslizante"),
 (r"stackable", "apilable"),
 (r"dustproof|dust[- ]?proof", "antipolvo"),
 (r"for kitchen|kitchen", "de cocina"),
 (r"for bathroom|bathroom", "de baño"),
 (r"for garden|garden|outdoor", "de exterior"),
 (r"for pet|pet", "para mascotas"),
 (r"clear|transparent", "transparente"),
 (r"large|big|jumbo|xl", "grande"),
 (r"mini|small", "chico"),
]

def es_name(name_en):
    low = " " + name_en.lower() + " "
    base = None
    for rx, es in HEADS:
        if re.search(r"\b(" + rx + r")\b", low):
            base = es; break
    if not base:
        return None
    parts = [base]
    seen = set()
    for rx, es in MODS:
        if es in seen: continue
        if re.search(r"\b(" + rx + r")\b", low):
            parts.append(es); seen.add(es)
        if len(parts) >= 4: break
    # niveles / bolsillos / compartimentos
    m = re.search(r"(\d+)[ -]?(tier|tiers|layer|layers|shelf|shelves)", low)
    if m: parts.append(f"de {m.group(1)} niveles")
    m = re.search(r"(\d+)[ -]?pocket", low)
    if m: parts.append(f"de {m.group(1)} bolsillos")
    m = re.search(r"(\d+)[ -]?compartment", low)
    if m: parts.append(f"con {m.group(1)} compartimentos")
    m = re.search(r"(\d+)\s?l\b", low)
    if m and int(m.group(1)) <= 200: parts.append(f"{m.group(1)} L")
    s = " ".join(parts)
    s = re.sub(r"\s+", " ", s).strip()
    return s[:1].upper() + s[1:]

def clean_name(name):
    name = html.unescape(name)
    name = re.sub(r"[\"“”″’]", "", name)
    name = BRAND.sub("", name)
    name = NOISE.sub("", name)
    name = re.sub(r"\bfrom\b.*$", "", name, flags=re.I)  # "from China/directly..."
    name = re.sub(r"\s+", " ", name).strip(" -–—,")
    return name

def clean_desc(short, full, es_title):
    raw = re.sub(r"<[^>]+>", "\n", (short or full or ""))
    raw = html.unescape(raw)
    specs = []
    for l in [re.sub(r"\s+", " ", x).strip() for x in raw.split("\n")]:
        if not l: continue
        if re.search(r"\b(MOQ|OEM|ODM|whole?sale|supplier|exporter|inquiry|contact|whatsapp|alibaba)\b", l, re.I): continue
        m = re.match(r"(Material|Color|Colour|Type|Size|Weight|Capacity|Dimensions?|Product Dimensions?)\s*[:：]\s*(.+)", l, re.I)
        if m:
            lab = {"material":"Material","color":"Color","colour":"Color","type":"Tipo","size":"Tamaño",
                   "weight":"Peso","capacity":"Capacidad","dimensions":"Medidas","product dimensions":"Medidas"}[m.group(1).lower()]
            specs.append(f"{lab}: {m.group(2).strip()[:60]}")
        if len(specs) >= 3: break
    head = (" · ".join(specs) + "\n\n") if specs else ""
    return (f"{es_title}. {head}Traído directo de Union Home, agencia de sourcing en Yiwu, China. "
            "El precio incluye producto, flete marítimo e impuestos: no pagás nada más al recibirlo. "
            "Viaja consolidado en barco bajo régimen courier, a tu nombre.")

def map_cat(cats):
    j = " ".join(cats).lower()
    return "HERRAMIENTAS" if re.search(r"\bhardware\b|\btool\b|\btools\b|garden", j) else "HOGAR"

def price_for(pid, cat):
    r = (pid * 2654435761) % 1000 / 1000.0
    price = round(22 + r * (95 if cat == "HOGAR" else 120))
    cost = round(price / 2.3, 2); freight = round(price * 0.14, 2); taxes = round(price * 0.22, 2)
    margin = round(price - cost - freight - taxes, 2)
    ref = round(price * 1.55) if (pid % 3 != 0) else None
    return dict(costUsd=cost, freightUsd=freight, taxesUsd=taxes, marginUsd=margin,
                priceUsd=float(price), referencePriceUsd=(float(ref) if ref else None))

def weight_for(pid, cat):
    r = (pid * 40503) % 1000 / 1000.0
    return round(0.5 + r * (7.5 if cat == "HOGAR" else 4.5), 2)

def dl(url, path):
    try:
        d = get(url)
        if len(d) < 800: return False
        open(path, "wb").write(d); return True
    except Exception: return False

def ext(url):
    m = re.search(r"\.(jpg|jpeg|png|webp)(?:\?|$)", url.lower()); return m.group(1) if m else "jpg"

def main():
    # preservar lo ya existente (traducciones a mano)
    existing = {}
    if os.path.exists(OUT):
        for p in json.load(open(OUT)): existing[p["slug"]] = p
    out = list(existing.values())
    seen = set(existing.keys())
    catn = {}
    page = 1
    while len(out) < TARGET and page <= 60:
        try: batch = json.loads(get(f"{API}?per_page=20&page={page}"))
        except Exception: break
        if not batch: break
        for p in batch:
            if len(out) >= TARGET: break
            slug = "uh-" + re.sub(r"[^a-z0-9]+", "-", p["slug"].lower()).strip("-")
            if slug in seen: continue
            imgs = [i["src"] for i in p.get("images", []) if i.get("src")]
            if not imgs: continue
            catnames = [c["name"] for c in p.get("categories", [])]
            ckey = (catnames[0] if catnames else "misc").lower()
            if catn.get(ckey, 0) >= CATCAP: continue  # diversidad
            name_en = clean_name(p["name"])
            es = es_name(name_en)
            if not es or len(es) < 4: continue
            cat = map_cat(catnames)
            files = 0
            for n, url in enumerate(imgs[:IMGS], start=1):
                if dl(url, os.path.join(IMG_DIR, f"{slug}-{n}.{ext(url)}")): files += 1
            if files == 0: continue
            out.append(dict(slug=slug, title=es, description=clean_desc(p.get("short_description"), p.get("description"), es),
                            category=cat, weightKg=weight_for(p["id"], cat), volumeM3=0.02, images=files,
                            **price_for(p["id"], cat)))
            seen.add(slug); catn[ckey] = catn.get(ckey, 0) + 1
            print(f"  [{len(out):3}/{TARGET}] {cat[:4]} · {es[:46]}")
            time.sleep(0.2)
        page += 1
    json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=2)
    print(f"\nOK {len(out)} productos ({len(out)-len(existing)} nuevos) → {OUT}")

main()
