#!/usr/bin/env python3
"""Builds prettyteam.taffetadesign.com/mkt/ (Taffeta Marketing Proofs) from the Claude artifact's files.

Everything private is encrypted with the marketing passcode before it goes on GitHub (the repo is public):
the page itself (captions, plans, emails, texts) and every photo and video. The passcode never goes in the repo.

  MKT_CODE=<passcode> python3 tools/mkt-build.py <artifact index.html> <artifact files dir> <album photos dir> <photos db dir> <edits.json> <cache dir>

Only the passcode is needed (Alexandra has it). The salt is read from mkt/c/meta.json; file names come from the passcode.
The cache dir (outside the repo) just skips re-encrypting unchanged pictures; an empty folder is fine.

Weekly: replace the artifact files and run this again; approvals, edits and team photos live in Google Drive
(apps-script/Marketing.gs), so a rebuild never loses them.
"""
import sys, os, re, json, hmac, hashlib, io, glob
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from PIL import Image, ImageOps

SRC_HTML, SRC_DIR, ALB_DIR, DB_DIR, EDITS, CACHE_DIR = sys.argv[1:7]
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, 'mkt')
CODE = os.environ['MKT_CODE'].strip().lower()
ITER = 310000
META = os.path.join(OUT, 'c', 'meta.json')
SALT = json.load(open(META))['salt'] if os.path.exists(META) else os.urandom(16).hex()
key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=bytes.fromhex(SALT), iterations=ITER).derive(CODE.encode())
aes = AESGCM(key)
namekey = hmac.new(key, b'taffeta-mkt-file-names', hashlib.sha256).digest()

def seal(data):
    iv = os.urandom(12)
    return iv + aes.encrypt(iv, data, None)

def name_of(path):
    return hmac.new(namekey, path.encode(), hashlib.sha256).hexdigest()[:24]

lines = open(SRC_HTML, encoding='utf-8').read().split('\n')
L = lambda a, b: lines[a - 1:b]          # 1-based, inclusive
assert lines[280].startswith('<script>') and lines[289].startswith('<script>') and lines[323].startswith('<script>') and lines[456].startswith('<script>'), 'artifact layout changed'
assert 'id="p-create"' in lines[194] and "const RULES=" in lines[325] and "var BUILT=" in lines[458]

head = L(1, 194) + L(214, 280)            # markup and styles without the Create panel
head = [re.sub(r'<button type="button" role="tab" id="t-create"[^>]*>Create</button>', '', x) for x in head]
html = '\n'.join(head) + '\n' + '\n'.join(L(281, 289)) + '\n<script>\n' + open(os.path.join(REPO, 'tools', 'mkt-edits.js'), encoding='utf-8').read() + '\n</script>\n' \
    + '\n'.join(L(398, 456)) + '\n<script>\n' + open(os.path.join(REPO, 'tools', 'mkt-photos.js'), encoding='utf-8').read() + '\n</script>\n' + '\n'.join(L(560, 563))

# media: every picture and video is fetched encrypted, so the page asks for it by path (data-e) instead of src
MEDIA = re.compile(r'\b(src|poster)="((?:img|shoot|full)/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|mp4))"')
used = set(m.group(2) for m in MEDIA.finditer(html))
html = MEDIA.sub(lambda m: ('data-e' if m.group(1) == 'src' else 'data-ep') + '="' + m.group(2) + '"', html)
for p in list(used):
    if p.startswith('shoot/'): used.add('full/' + p[6:])

files = {}
os.makedirs(CACHE_DIR, exist_ok=True)
CACHE_F = os.path.join(CACHE_DIR, 'mkt-cache.json')   # never in the repo
CACHE = json.load(open(CACHE_F)) if os.path.exists(CACHE_F) else {}
os.makedirs(os.path.join(OUT, 'c'), exist_ok=True)
keep = set()
def put(path, data):
    n = name_of(path); files[path] = n; keep.add(n + '.bin')
    out = os.path.join(OUT, 'c', n + '.bin'); h = hashlib.sha256(data).hexdigest()
    if CACHE.get(n) == h and os.path.exists(out):   # unchanged: keep the same file so git doesn't re-upload it
        return
    open(out, 'wb').write(seal(data)); CACHE[n] = h

missing = []
for p in sorted(used):
    f = os.path.join(SRC_DIR, p)
    if not os.path.exists(f): missing.append(p); continue
    put(p, open(f, 'rb').read())

# album photos the team added on the Claude version: full size plus a small square-ish preview
migrated = []
for f in glob.glob(os.path.join(DB_DIR, '*.json')):
    d = json.load(open(f)); a = d['asset']
    src = glob.glob(os.path.join(ALB_DIR, a + '.*'))
    if not src: missing.append('album ' + a); continue
    raw = open(src[0], 'rb').read()
    put('alb/' + a + '.jpg', raw)
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB'); im.thumbnail((480, 480))
    b = io.BytesIO(); im.save(b, 'JPEG', quality=82); put('alb/t/' + a + '.jpg', b.getvalue())
    migrated.append({'id': a, 'album': d.get('album'), 'w': d.get('w'), 'h': d.get('h'), 'addedAt': d.get('addedAt')})
migrated.sort(key=lambda x: -(x['addedAt'] or 0))

payload = json.dumps({'html': html, 'files': files, 'migrated': migrated, 'seed': json.load(open(EDITS))}, ensure_ascii=False).encode()
open(os.path.join(OUT, 'c', 'page.bin'), 'wb').write(seal(payload)); keep.add('page.bin')
for f in os.listdir(os.path.join(OUT, 'c')):   # drop pictures no longer used
    if f not in keep and f != 'meta.json': os.remove(os.path.join(OUT, 'c', f))
json.dump(CACHE, open(CACHE_F, 'w'))
open(os.path.join(OUT, 'c', 'meta.json'), 'w').write(json.dumps({'salt': SALT, 'iter': ITER}))
print('media', len(files), 'missing', missing[:10], 'page bytes', len(payload))
