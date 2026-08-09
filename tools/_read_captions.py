from PIL import Image

im = Image.open(r'assets/mobile-menu/15 icon menu.png').convert('RGB')
w, h = im.size

# icon column bands per row (from grid scan)
rows = [
    [(78, 245), (361, 524), (620, 781), (876, 1038), (1125, 1285), (1373, 1537)],  # row1 icons
    [(84, 239), (362, 515), (622, 774), (879, 1030), (1127, 1278), (1379, 1530)],  # row2
    [(361, 518), (617, 774), (879, 1033)],                                          # row3
]
cap_y = [
    (225, 292),   # row1 caption spans two bands 232-259 & 264-287
    (533, 606),   # row2 caption bands 540-567 & 573-599
    (840, 875),   # row3 caption 846-867 & 869-871
]

def show(region, label):
    im2 = region.resize((region.size[0]*2, region.size[1]*2), Image.NEAREST)
    print(f'-- {label}')
    for y in range(im2.size[1]):
        row = ''
        for x in range(im2.size[0]):
            r, g, b = im2.getpixel((x, y))
            dark = max(r, g, b) < 235
            colored = abs(r-g) + abs(g-b) > 40
            row += '#' if (dark or colored) else '.'
        print(row)

for ri, bands in enumerate(rows):
    y0, y1 = cap_y[ri]
    for ci, (x0, x1) in enumerate(bands):
        show(im.crop((x0, y0, x1, y1)), f'r{ri+1}c{ci+1} caption')
