from PIL import Image

im = Image.open(r'assets/mobile-menu/15 icon menu.png').convert('RGB')
w, h = im.size
data = list(im.getdata())

def is_bg(px):
    r, g, b = px
    return r >= 243 and g >= 243 and b >= 243 and abs(r-g) < 12 and abs(g-b) < 12

# per-row non-bg count
row_non = [0]*h
col_non = [0]*w
for y in range(h):
    base = y*w
    for x in range(w):
        if not is_bg(data[base+x]):
            row_non[y] += 1
            col_non[x] += 1

TH = 12  # a row/col is "content" if at least this many non-bg pixels
def bands_from(content_flags):
    out = []
    start = None
    prev = None
    for i, c in enumerate(content_flags):
        if c:
            if start is None:
                start = prev = i
            else:
                prev = i
        else:
            if start is not None:
                out.append((start, prev))
                start = None
    if start is not None:
        out.append((start, prev))
    return out

rbands = bands_from([c >= TH for c in row_non])
cbands = bands_from([c >= TH for c in col_non])
print('row content bands:', rbands)
print('col content bands:', cbands)

# for each row band, find its col bands (icons in that row)
for (y0, y1) in rbands:
    sub = [0]*w
    for y in range(y0, y1+1):
        base = y*w
        for x in range(w):
            if not is_bg(data[base+x]):
                sub[x] += 1
    boxes = bands_from([c >= TH for c in sub])
    print(f'row y{y0}-{y1}: cols {boxes}')
