import zlib, struct

d = open(r'assets/mobile-menu/15 icon menu.png', 'rb').read()
pos = 8
idat = b''
while pos < len(d):
    ln = struct.unpack('>I', d[pos:pos+4])[0]
    typ = d[pos+4:pos+8]
    if typ == b'IHDR':
        w, h, bd, ct = struct.unpack('>IIBB', d[pos+8:pos+18])
    if typ == b'IDAT':
        idat += d[pos+8:pos+8+ln]
    pos += 12 + ln

raw = zlib.decompress(idat)
bpp = {0: 1, 2: 3, 4: 2, 6: 4}[ct] * (bd // 8)
stride = w * bpp
px = bytearray()
prev = bytearray(stride)
p = 0
for y in range(h):
    f = raw[p]; p += 1
    line = bytearray(raw[p:p+stride]); p += stride
    if f == 1:
        for i in range(bpp, stride): line[i] = (line[i] + line[i-bpp]) & 255
    elif f == 2:
        for i in range(stride): line[i] = (line[i] + prev[i]) & 255
    elif f == 3:
        for i in range(stride):
            a = line[i-bpp] if i >= bpp else 0
            line[i] = (line[i] + ((a + prev[i]) // 2)) & 255
    elif f == 4:
        for i in range(stride):
            a = line[i-bpp] if i >= bpp else 0
            b = prev[i]; c = prev[i-bpp] if i >= bpp else 0
            pp = a + b - c
            pa, pb, pc = abs(pp-a), abs(pp-b), abs(pp-c)
            pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
            line[i] = (line[i] + pr) & 255
    px += line
    prev = line

T = 10
def near(c):
    return all(abs(c[i]-254) <= T for i in range(3))

# component labeling (4-connectivity) on non-white pixels
label = [[-1]*w for _ in range(h)]
comp_boxes = {}
def fill(x, y, lab):
    stack = [(x, y)]
    while stack:
        cx, cy = stack.pop()
        if cx < 0 or cy < 0 or cx >= w or cy >= h: continue
        if label[cy][cx] != -1: continue
        off = cy*stride + cx*bpp
        if near(tuple(px[off:off+3])): continue
        label[cy][cx] = lab
        box = comp_boxes[lab]
        box[0] = min(box[0], cx); box[1] = min(box[1], cy)
        box[2] = max(box[2], cx); box[3] = max(box[3], cy)
        stack.append((cx+1, cy)); stack.append((cx-1, cy))
        stack.append((cx, cy+1)); stack.append((cx, cy-1))

lab = 0
for y in range(h):
    for x in range(w):
        off = y*stride + x*bpp
        if label[y][x] == -1 and not near(tuple(px[off:off+3])):
            comp_boxes[lab] = [x, y, x, y]
            fill(x, y, lab)
            lab += 1

print('components:', len(comp_boxes))
for k in sorted(comp_boxes):
    x0, y0, x1, y1 = comp_boxes[k]
    print(k, (x0, y0, x1+1, y1+1), 'size', (x1-x0+1), 'x', (y1-y0+1))
