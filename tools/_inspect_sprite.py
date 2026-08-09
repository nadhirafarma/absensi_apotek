import zlib, struct

d = open(r'assets/mobile-menu/15 icon menu.png', 'rb').read()
assert d[:8] == b'\x89PNG\r\n\x1a\n'
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
            b = prev[i]
            c = prev[i-bpp] if i >= bpp else 0
            pp = a + b - c
            pa, pb, pc = abs(pp-a), abs(pp-b), abs(pp-c)
            pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
            line[i] = (line[i] + pr) & 255
    px += line
    prev = line

print('size', w, h, 'bitdepth', bd, 'colortype', ct)

T = 8  # tolerance
def near(c1, c2):
    return all(abs(c1[i]-c2[i]) <= T for i in range(bpp))

corner = tuple(px[i] for i in range(bpp))

def row_blank(y):
    row = px[y*stride:(y+1)*stride]
    for x in range(w):
        c = tuple(row[x*bpp:(x+1)*bpp])
        if not near(c, corner):
            return False
    return True

def col_blank(x):
    off = x*bpp
    for y in range(h):
        c = tuple(px[y*stride+off:y*stride+off+bpp])
        if not near(c, corner):
            return False
    return True

blank_rows = [y for y in range(h) if row_blank(y)]
blank_cols = [x for x in range(w) if col_blank(x)]

def bands(blank):
    out = []
    start = prev = None
    for i in blank:
        if start is None:
            start = prev = i
        elif i != prev + 1:
            out.append((start, prev))
            start = prev = i
        else:
            prev = i
    if start is not None:
        out.append((start, prev))
    return out

print('corner color:', corner)
print('blank row bands:', bands(blank_rows)[:80])
print('blank col bands:', bands(blank_cols)[:80])
