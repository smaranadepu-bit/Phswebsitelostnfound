import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_DIR = os.path.join(ROOT, 'html')
CSS_DIR = os.path.join(ROOT, 'static', 'css')

print('Accessibility audit (lightweight checks)')
print('Scanning HTML files in', HTML_DIR)

img_missing_alt = []
inputs_missing_label = []
forms_missing_aria = []

html_files = []
for fn in os.listdir(HTML_DIR):
    if fn.endswith('.html'):
        html_files.append(os.path.join(HTML_DIR, fn))

for path in html_files:
    with open(path, 'r', encoding='utf-8') as f:
        txt = f.read()
    name = os.path.basename(path)
    # check for skip link
    if name == 'layout.html':
        if 'class="skip-link"' not in txt and "class='skip-link'" not in txt:
            print('WARN: layout.html missing skip-link')
    # find img tags without alt
    for m in re.finditer(r'<img\s+[^>]*>', txt, re.IGNORECASE):
        tag = m.group(0)
        if 'alt=' not in tag.lower():
            img_missing_alt.append((name, tag.strip()))
    # find input tags and try to detect labels
    for m in re.finditer(r'<input\s+[^>]*>', txt, re.IGNORECASE):
        tag = m.group(0)
        # skip hidden inputs
        if re.search(r'type\s*=\s*"hidden"', tag, re.IGNORECASE) or re.search(r"type\s*=\s*'hidden'", tag, re.IGNORECASE):
            continue
        # try to find id
        idm = re.search(r'id\s*=\s*"([^"]+)"', tag)
        idv = None
        if idm:
            idv = idm.group(1)
        else:
            idm = re.search(r"id\s*=\s*'([^']+)'", tag)
            if idm:
                idv = idm.group(1)
        has_label = False
        if idv:
            # look for label[for=idv]
            if re.search(r'<label[^>]*for\s*=\s*"%s"' % re.escape(idv), txt, re.IGNORECASE) or re.search(r"<label[^>]*for\s*=\s*'%s'" % re.escape(idv), txt, re.IGNORECASE):
                has_label = True
        # check if input is wrapped by label (simple heuristic)
        if not has_label:
            # look for '<label' before input within 200 chars
            idx = m.start()
            start = max(0, idx-200)
            snippet = txt[start:m.end()]
            if '<label' in snippet[:200].lower():
                has_label = True
        if not has_label:
            inputs_missing_label.append((name, tag.strip()))
    # find forms without aria-label or role
    for m in re.finditer(r'<form\s+[^>]*>', txt, re.IGNORECASE):
        tag = m.group(0)
        if 'aria-label' not in tag.lower() and 'role=' not in tag.lower():
            forms_missing_aria.append((name, tag.strip()))

print('\nReport:')
print('Images missing alt:', len(img_missing_alt))
for a,b in img_missing_alt[:20]:
    print(' -', a, b)
print('Inputs possibly missing labels:', len(inputs_missing_label))
for a,b in inputs_missing_label[:20]:
    print(' -', a, b)
print('Forms without aria-label or role:', len(forms_missing_aria))
for a,b in forms_missing_aria[:20]:
    print(' -', a, b)

print('\nNotes:')
print('- This is a lightweight static check and may produce false positives.')
print('- For deeper automated testing, run Lighthouse/pa11y/axe against a running server.')
print('- Contrast checks are not performed here; consider running a color-contrast tool or Lighthouse for that.')
