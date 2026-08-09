import re

css = open('assets/styles.css', encoding='utf-8').read()

old_map = {
    'dashboard': 'dashboard.png',
    'absensi': 'presensi.png',
    'presensi': 'presensi.png',
    'presensi-karyawan': 'presensi.png',
    'monitoring-presensi': 'presensi.png',
    'cari-data-obat': 'data-obat.png',
    'data-obat': 'data-obat.png',
    'data-karyawan': 'data-karyawan.png',
    'data-supplier': 'data-supplier.png',
    'surat-pesanan': 'surat-pesanan.png',
    'restok-obat': 'restok-obat.png',
    'import-data-obat': 'import-data-obat.png',
    'akun-profil': 'dashboard.png',
    'log-aktivitas': 'dashboard.png',
    'manajemen-pengguna': 'manajemen-pengguna.png',
    'data-role': 'manajemen-pengguna.png',
}
new_map = {
    'dashboard': 'dashboard.png',
    'absensi': 'absensi.png',
    'presensi': 'presensi.png',
    'presensi-karyawan': 'presensi.png',
    'monitoring-presensi': 'monitoring-presensi.png',
    'cari-data-obat': 'cari-data-obat.png',
    'data-obat': 'data-obat.png',
    'data-karyawan': 'data-karyawan.png',
    'data-supplier': 'data-supplier.png',
    'surat-pesanan': 'surat-pesanan.png',
    'restok-obat': 'restok-obat.png',
    'import-data-obat': 'import-data-obat.png',
    'akun-profil': 'akun-profil.png',
    'log-aktivitas': 'log-aktivitas.png',
    'manajemen-pengguna': 'manajemen-pengguna.png',
    'data-role': 'data-role.png',
}

count = 0
for key, old_img in old_map.items():
    old = f'.app-sidebar .sidebar-link[data-view-target="{key}"]::before {{ background-image: url("mobile-menu/{old_img}"); }}'
    new = f'.app-sidebar .sidebar-link[data-view-target="{key}"]::before {{ background-image: url("mobile-menu/{new_map[key]}"); }}'
    if old in css:
        css = css.replace(old, new)
        count += 1
    else:
        print('MISS:', key)

open('assets/styles.css', 'w', encoding='utf-8').write(css)
print('replaced', count, 'of', len(new_map))
