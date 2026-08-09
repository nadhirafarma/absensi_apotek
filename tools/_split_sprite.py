import os
from PIL import Image

SRC = r'assets/mobile-menu/15 icon menu.png'
OUTDIR = r'assets/mobile-menu'
ARCH = r'assets/mobile-menu/_sprite-source'

# (filename, cell box) — box = (left, top, right, bottom) exclusive
cells = [
    ('data-supplier.png',        (78, 49, 245, 213)),
    ('surat-pesanan.png',        (361, 49, 524, 213)),
    ('import-data-obat.png',     (620, 49, 781, 213)),
    ('dashboard.png',            (876, 49, 1038, 213)),
    ('absensi.png',              (1125, 49, 1285, 213)),
    ('presensi.png',             (1373, 49, 1537, 213)),
    ('restok-obat.png',          (84, 361, 239, 519)),
    ('log-aktivitas.png',        (362, 361, 515, 519)),
    ('manajemen-pengguna.png',   (622, 361, 774, 519)),
    ('monitoring-presensi.png',  (879, 361, 1030, 519)),
    ('data-obat.png',            (1127, 361, 1278, 519)),
    ('data-karyawan.png',        (1379, 361, 1530, 519)),
    ('data-role.png',            (361, 664, 518, 824)),
    ('cari-data-obat.png',       (617, 664, 774, 824)),
    ('akun-profil.png',          (879, 664, 1033, 824)),
]

im = Image.open(SRC).convert('RGB')

def is_bg(px):
    r, g, b = px
    return r >= 243 and g >= 243 and b >= 243 and abs(r-g) < 12 and abs(g-b) < 12

def trim_bbox(region):
    data = region.load()
    w, h = region.size
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if not is_bg(data[x, y]):
                xs.append(x); ys.append(y)
    return (min(xs), min(ys), max(xs)+1, max(ys)+1)

PAD = 6
os.makedirs(ARCH, exist_ok=True)

for name, box in cells:
    region = im.crop(box)
    x0, y0, x1, y1 = trim_bbox(region)
    # add symmetric padding
    x0 = max(0, x0 - PAD); y0 = max(0, y0 - PAD)
    x1 = min(region.size[0], x1 + PAD); y1 = min(region.size[1], y1 + PAD)
    tile = region.crop((x0, y0, x1, y1)).convert('RGBA')

    # chroma-key near-white -> transparent
    px = tile.load()
    for y in range(tile.size[1]):
        for x in range(tile.size[0]):
            r, g, b, a = px[x, y]
            if r >= 243 and g >= 243 and b >= 243 and abs(r-g) < 14 and abs(g-b) < 14:
                px[x, y] = (r, g, b, 0)
    tile.save(os.path.join(OUTDIR, name))
    print('wrote', os.path.join(OUTDIR, name), tile.size)

# archive original sprite
im.save(os.path.join(ARCH, '15 icon menu.png'))
print('archived', os.path.join(ARCH, '15 icon menu.png'))
