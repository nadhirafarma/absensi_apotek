from PIL import Image
import os

for f in sorted(os.listdir('assets/mobile-menu')):
    if not f.endswith('.png') or f == '15 icon menu.png':
        continue
    im = Image.open(os.path.join('assets/mobile-menu', f)).convert('RGBA')
    px = im.load()
    # count opaque (non-transparent) pixels
    n = 0
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            if px[x, y][3] > 40:
                n += 1
    print(f, im.size, 'opaque_px', n)
