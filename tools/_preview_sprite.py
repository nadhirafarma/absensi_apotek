from PIL import Image

im = Image.open(r'assets/mobile-menu/15 icon menu.png').convert('RGB')
w, h = im.size
print('size', w, h)

CW, CH = 130, 50
px = im.resize((CW, CH), Image.LANCZOS)

# detect content: pixel significantly non-white
for y in range(CH):
    row = ''
    for x in range(CW):
        r, g, b = px.getpixel((x, y))
        dark = max(r, g, b) < 235
        # colored content even if light
        colored = abs(r - g) + abs(g - b) > 40
        row += '#' if (dark or colored) else '.'
    print(row)
