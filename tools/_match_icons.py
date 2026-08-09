import os
from PIL import Image

CELL = r'tools/_sprite_cells'
OLD = r'tools/_old_icons'

def sig(path):
    im = Image.open(path).convert('RGB')
    im = im.resize((48, 48), Image.LANCZOS)
    px = list(im.getdata())
    n = len(px)
    mean = [sum(p[i] for p in px)/n for i in range(3)]
    return px, mean

def diff(a, b):
    pa, ma = a
    pb, mb = b
    s = 0.0
    for i in range(48*48):
        for c in range(3):
            s += abs(pa[i][c]-ma[c] - (pb[i][c]-mb[c]))
    return s

cells = sorted(f for f in os.listdir(CELL) if f.endswith('.png'))
olds = sorted(f for f in os.listdir(OLD) if f.endswith('.png'))
cs = {f: sig(os.path.join(CELL, f)) for f in cells}
os_ = {f: sig(os.path.join(OLD, f)) for f in olds}

for c in cells:
    scores = sorted(((diff(cs[c], os_[o]), o) for o in olds))
    top = ' '.join(f'{o}={s/1000:.0f}k' for s, o in scores[:3])
    print(f'{c:8s} -> {top}')
