import re

for f in ['assets/styles.css', 'assets/ui-polish.css']:
    s = open(f, encoding='utf-8').read()
    print(f'########## {f}')
    # print any rule mentioning sidebar-link or sidebar-nav with position/width/margin/justify
    for m in re.finditer(r'([^{}@]*sidebar-link[^{}@]*|sidebar-nav[^{}@]*)\{([^}]*)\}', s):
        sel = ' '.join(m.group(1).split())
        body = ' '.join(m.group(2).split())
        if any(k in body for k in ('width', 'margin', 'justify', 'padding', 'position', 'gap', 'flex')):
            print(f'  {sel} {{ {body} }}')
