import re
s = open('assets/styles.css', encoding='utf-8').read()
for m in re.finditer(r'([^{}@]*sidebar-link[^{}@]*)\{([^}]*)\}', s):
    sel = ' '.join(m.group(1).split())
    body = ' '.join(m.group(2).split())
    if 'display' in body or 'visibility' in body:
        print(f'{sel} {{ {body} }}')
