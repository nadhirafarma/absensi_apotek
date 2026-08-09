import os
from PIL import Image

im = Image.open(r'assets/mobile-menu/15 icon menu.png').convert('RGB')
w, h = im.size

rows = [
    (232, 287, [(78, 245), (361, 524), (620, 781), (876, 1038), (1125, 1285), (1373, 1537)]),
    (540, 599, [(84, 239), (362, 515), (622, 774), (879, 1030), (1127, 1278), (1379, 1530)]),
    (846, 875, [(361, 518), (617, 774), (879, 1033)]),
]
outdir = r'tools/_captions'
os.makedirs(outdir, exist_ok=True)

def trim(region):
    px = region.convert('L')
    data = px.load()
    xs, ys = [], []
    for y in range(px.size[1]):
        for x in range(px.size[0]):
            if data[x, y] < 200:
                xs.append(x); ys.append(y)
    if not xs:
        return region
    return region.crop((min(xs)-2, min(ys)-2, max(xs)+3, max(ys)+3))

for ri, (y0, y1, cols) in enumerate(rows):
    for ci, (x0, x1) in enumerate(cols):
        cap = trim(im.crop((x0, y0, x1, y1)))
        cap = cap.resize((cap.size[0]*4, cap.size[1]*4), Image.LANCZOS)
        cap = cap.convert('L')
        p = os.path.join(outdir, f'r{ri+1}c{ci+1}.png')
        cap.save(p)
        print(p, cap.size)
