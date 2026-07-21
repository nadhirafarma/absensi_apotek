import os

old = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v2"></path><path d="M12 21v2"></path><path d="M4.22 4.22l1.42 1.42"></path><path d="M18.36 18.36l1.42 1.42"></path><path d="M1 12h2"></path><path d="M21 12h2"></path><path d="M4.22 19.78l1.42-1.42"></path><path d="M18.36 5.64l1.42-1.42"></path></svg>'

new = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'

files = [
    'akun-profil/index.html',
    'index.html',
    'data-obat/index.html',
    'data-supplier/index.html',
    'import-data-obat/index.html',
    'data-karyawan/index.html',
    'data-role/index.html',
    'dashboard/index.html',
    'presensi-karyawan/index.html',
    'presensi/index.html',
    'cari-data-obat/index.html',
    'log-aktivitas/index.html',
    'monitoring-presensi/index.html',
    'manajemen-pengguna/index.html',
    'surat-pesanan/index.html',
    'restok-obat/index.html',
]

count = 0
for f in files:
    if not os.path.exists(f):
        print(f'SKIP (not found): {f}')
        continue
    content = open(f, 'r', encoding='utf-8').read()
    if old in content:
        content = content.replace(old, new)
        open(f, 'w', encoding='utf-8').write(content)
        count += 1
        print(f'OK: {f}')
    else:
        print(f'SKIP (no match): {f}')

print(f'\n{count} files replaced.')