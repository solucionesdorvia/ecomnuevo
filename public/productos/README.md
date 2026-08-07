# Fotos de producto — Traelo

Poné acá las **fotos reales** de cada producto. El sitio las toma solas: no hace
falta tocar código.

## Cómo cargarlas

1. Nombrá cada archivo con el **slug del producto** + un número + la extensión:
   - `auriculares-bt-anc-1.jpg` → foto principal (la de la grilla)
   - `auriculares-bt-anc-2.jpg`, `auriculares-bt-anc-3.jpg` → galería (opcional, hasta 8)
2. Formatos aceptados: **jpg, jpeg, png, webp**.
3. Recomendado: relación **4:5 vertical** (ej. 1000×1250 px), fondo limpio y parejo
   entre productos, peso < 400 KB.
4. Copiá los archivos en esta carpeta (`public/productos/`).
5. Corré `npm run seed` (o pedímelo a mí) para que las tome.

> Mientras un producto no tenga foto, se muestra un placeholder gris neutro.
> También podés cargar una foto por URL desde el panel de admin, producto por producto.

## Nombres de archivo por producto

### Electrónica
- `auriculares-bt-anc` — Auriculares inalámbricos con cancelación de ruido
- `camara-accion-4k` — Cámara de acción 4K sumergible
- `drone-camara-2k` — Drone plegable con cámara 2K
- `parlante-bt-ipx7` — Parlante Bluetooth IPX7 30W
- `proyector-portatil-1080p` — Proyector portátil 1080p con Android TV
- `smartwatch-amoled` — Smartwatch AMOLED 1,8" con GPS
- `tablet-11-128gb` — Tablet 11" 128 GB con funda teclado
- `teclado-mecanico-75` — Teclado mecánico 75% hot-swap RGB

### Hogar
- `aspiradora-robot-lidar` — Aspiradora robot con mapeo láser
- `cafetera-espresso-20bar` — Cafetera espresso 20 bares con vaporizador
- `freidora-aire-6l` — Freidora de aire 6 L digital
- `juego-sabanas-lino` — Juego de sábanas de lino lavado — queen
- `lampara-piso-arco` — Lámpara de pie de arco nórdica
- `manta-tejida-algodon` — Manta tejida de algodón orgánico
- `purificador-aire-hepa` — Purificador de aire HEPA H13
- `vajilla-gres-12` — Vajilla de gres artesanal — 12 piezas

### Indumentaria
- `anteojos-sol-polarizados` — Anteojos de sol polarizados UV400
- `buzo-frisa-oversize` — Buzo de frisa premium oversize
- `campera-puffer-reciclada` — Campera puffer de poliéster reciclado
- `jean-recto-rigido` — Jean recto de denim rígido 14 oz
- `mochila-urbana-antirrobo` — Mochila urbana antirrobo 20 L
- `remera-merino` — Remera de lana merino ultrafina
- `zapatillas-running-carbon` — Zapatillas de running con placa de carbono

### Herramientas
- `atornillador-inalambrico-21v` — Atornillador inalámbrico 21V con 2 baterías
- `compresor-portatil-digital` — Compresor de aire portátil digital
- `estacion-soldado-digital` — Estación de soldado digital 60W
- `kit-herramientas-168` — Kit de herramientas 168 piezas con maletín
- `multimetro-automotor` — Multímetro digital automotor True RMS
- `organizador-taller-pared` — Panel organizador de taller 120×60
- `sierra-circular-mini` — Mini sierra circular 700W con guía láser
