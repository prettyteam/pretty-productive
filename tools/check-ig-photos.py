#!/usr/bin/env python3
"""Check every image in the Instagram auto-post plan for size and sharpness.

Zapier posts whatever plan.json points at, so a small photo stretched up to
1080 wide goes out blurry. Run this before adding or changing posts:

    python3 tools/check-ig-photos.py                 # upcoming posts only
    python3 tools/check-ig-photos.py --all           # include already-posted
    python3 tools/check-ig-photos.py --local         # read files from this repo
                                                     # instead of the live site

Checks
  size   feed images must be exactly 1080x1350, stories 1080x1920
         (Instagram rejects feed images taller than 4:5).
  blur   grayscale, shrink to 50% and back up (LANCZOS), mean absolute
         difference. A real 1080-wide photo keeps fine detail and scores
         well above 0.5; an upscaled screenshot / video still scores under.
         Plain words tiles (mostly one flat background colour) are skipped,
         since they have no fine detail to lose.

Exits 1 if anything fails. Needs Pillow and numpy.
"""
import argparse, io, json, os, sys, urllib.request
from datetime import datetime, timezone

import numpy as np
from PIL import Image

PLAN_URL = "https://prettyteam.taffetadesign.com/s-2570127300d0a38f/autopost/plan.json"
SITE = "https://prettyteam.taffetadesign.com/"
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZES = {"feed": (1080, 1350), "story": (1080, 1920)}
BLUR_MIN = 0.5      # below this a photo is upscaled / soft
FLAT_SHARE = 0.90   # share of pixels near the main colour => words tile


def fetch(url, local):
    if local and url.startswith(SITE):
        with open(os.path.join(REPO, url[len(SITE):].split("?")[0]), "rb") as f:
            return f.read()
    sep = "&" if "?" in url else "?"
    req = urllib.request.Request(f"{url}{sep}t={int(datetime.now().timestamp())}",
                                 headers={"User-Agent": "check-ig-photos"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def blur_score(im):
    g = im.convert("L")
    w, h = g.size
    back = g.resize((w // 2, h // 2), Image.LANCZOS).resize((w, h), Image.LANCZOS)
    return float(np.abs(np.asarray(g, float) - np.asarray(back, float)).mean())


def is_words_tile(im):
    a = np.asarray(im.convert("RGB").resize((270, 480)), int)
    q = (a // 8).reshape(-1, 3)
    vals, counts = np.unique(q, axis=0, return_counts=True)
    main = vals[counts.argmax()] * 8 + 4
    near = (np.abs(a.reshape(-1, 3) - main).max(axis=1) <= 14).mean()
    return near >= FLAT_SHARE


def items(plan):
    for s in plan.get("stories", []):
        yield "story", s["id"], s["account"], s["at"], s["url"]
    for f in plan.get("feed", []):
        if not f.get("ok", True):
            continue
        for u in f["urls"]:
            yield "feed", os.path.basename(u).rsplit(".", 1)[0], f["account"], f["at"], u


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="include posts already gone out")
    ap.add_argument("--local", action="store_true", help="read images from this repo")
    ap.add_argument("--plan", default=PLAN_URL)
    a = ap.parse_args()

    plan = json.loads(fetch(a.plan, a.local))
    now = datetime.now(timezone.utc)
    bad = 0
    for kind, iid, acct, at, url in items(plan):
        when = datetime.fromisoformat(at)
        if not a.all and when < now:
            continue
        try:
            im = Image.open(io.BytesIO(fetch(url, a.local)))
            im.load()
        except Exception as e:
            print(f"FAIL  {iid:18s} {at[:16]} {acct:20s} cannot load: {e}")
            bad += 1
            continue
        problems = []
        if im.size != SIZES[kind]:
            problems.append(f"size {im.size[0]}x{im.size[1]}, needs {SIZES[kind][0]}x{SIZES[kind][1]}")
        words = is_words_tile(im)
        score = blur_score(im)
        if not words and score < BLUR_MIN:
            problems.append(f"soft photo (blur {score:.2f} < {BLUR_MIN})")
        tag = "FAIL" if problems else "ok  "
        bad += bool(problems)
        note = "; ".join(problems) or ("words tile" if words else f"blur {score:.2f}")
        print(f"{tag}  {iid:18s} {at[:16]} {acct:20s} {note}")
    print(f"\n{bad} problem image(s)" if bad else "\nall images OK")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
