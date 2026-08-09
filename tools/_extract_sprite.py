import os, subprocess, shutil, tempfile
from PIL import Image

SRC = r'assets/mobile-menu/15 icon menu.png'
OUT = r'tools/_sprite_cells'
OLD = r'tools/_old_icons'
os.makedirs(OUT, exist_ok=True)
os.makedirs(OLD, exist_ok=True)

im = Image.open(SRC).convert('RGB')
# (name guess, box) - box = (left, top, right, bottom) exclusive right/bottom
cells = [
    ('r1c1', (78, 49, 245, 213)),
    ('r1c2', (361, 49, 524, 213)),
    ('r1c3', (620, 49, 781, 213)),
    ('r1c4', (876, 49, 1038, 213)),
    ('r1c5', (1125, 49, 1285, 213)),
    ('r1c6', (1373, 49, 1537, 213)),
    ('r2c1', (84, 361, 239, 519)),
    ('r2c2', (362, 361, 515, 519)),
    ('r2c3', (622, 361, 774, 519)),
    ('r2c4', (879, 361, 1030, 519)),
    ('r2c5', (1127, 361, 1278, 519)),
    ('r2c6', (1379, 361, 1530, 519)),
    ('r3c1', (361, 664, 518, 824)),
    ('r3c2', (617, 664, 774, 824)),
    ('r3c3', (879, 664, 1033, 824)),
]
for name, box in cells:
    im.crop(box).save(os.path.join(OUT, f'{name}.png'))

old_names = ['dashboard', 'data-karyawan', 'data-obat', 'data-supplier',
             'import-data-obat', 'manajemen-pengguna', 'presensi',
             'restok-obat', 'surat-pesanan']
for n in old_names:
    p = subprocess.run(
        ['git', '-C', r'c:/Users/asus/Documents/Website Indo Apotek', 'show', f'ab8537a^:assets/mobile-menu/{n}.png'],
        capture_output=True)
    if p.returncode == 0:
        with open(os.path.join(OLD, f'{n}.png'), 'wb') as f:
            f.write(p.stdout)
        print('old ok:', n, len(p.stdout))
    else:
        print('old FAIL:', n)
print('done')
