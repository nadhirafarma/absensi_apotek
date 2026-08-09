from PIL import Image
import os

def show(path, label, w=44, h=22):
    im = Image.open(path).convert('RGB')
    print(f'== {label} ({im.size[0]}x{im.size[1]})')
    px = im.resize((w, h), Image.LANCZOS)
    for y in range(h):
        row = ''
        for x in range(w):
            r, g, b = px.getpixel((x, y))
            dark = max(r, g, b) < 235
            colored = abs(r-g) + abs(g-b) > 40
            row += '#' if (dark or colored) else '.'
        print(row)

CELL = r'tools/_sprite_cells'
OLD = r'tools/_old_icons'
for f in sorted(os.listdir(CELL)):
    show(os.path.join(CELL, f), f)
print()
for f in sorted(os.listdir(OLD)):
    show(os.path.join(OLD, f), f)
