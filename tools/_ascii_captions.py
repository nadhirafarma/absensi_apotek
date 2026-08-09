import os
from PIL import Image

d = r'tools/_captions'
for f in sorted(os.listdir(d)):
    im = Image.open(os.path.join(d, f)).convert('L')
    w, h = im.size
    im = im.resize((w//4, h//4), Image.NEAREST)  # back to ~source scale
    px = im.load()
    print(f'== {f} ({im.size})')
    for y in range(im.size[1]):
        row = ''
        for x in range(im.size[0]):
            row += '#' if px[x, y] < 200 else '.'
        print(row)
    print()
