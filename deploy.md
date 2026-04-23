# EREBUS MedBay — Deployment Guide

The prototype is a PWA (Progressive Web App). Once hosted on any HTTPS endpoint, a Chromebook or Android tablet can **install it to the home screen** and run it **offline** — no laptop-in-the-loop, no live network during the exhibit.

Contents of the shippable bundle: everything under `prototype/`. The rest of the repo (CISO memo, build spec, SVG exporter) is not needed on the device.

---

## Path A — Netlify Drop (fastest, ~2 minutes)

1. Open https://app.netlify.com/drop
2. Drag-and-drop the entire `prototype/` folder onto the page.
3. Netlify returns a URL like `https://random-name-12345.netlify.app`.
4. On the Chromebook / Android tablet:
   - Open Chrome, visit the URL.
   - Tap the browser menu → **Install app** / **Add to Home screen**.
   - Launches fullscreen from the home icon; works offline after first load.

**Free tier** is fine for this workload. Optional: claim the site (free Netlify account) to get a custom subdomain like `erebus-medbay.netlify.app` and to redeploy by drag-drop over the same site.

---

## Path B — GitHub Pages

If you already keep this repo on GitHub:

1. Push `prototype/` to a branch (or keep it at its current path).
2. Repo **Settings → Pages** → source = that branch, folder = `/prototype`.
3. Wait ~1 minute; visit `https://<user>.github.io/<repo>/`.
4. Install on devices the same way as Path A.

Free, versioned, and lets you `git push` to update.

---

## Path C — Cloudflare Pages / Vercel

Same shape as Netlify. Both have a drag-drop or CLI flow, both free for this size. Pick whichever you already have an account on.

```bash
# Vercel CLI example
npx vercel --cwd prototype
```

---

## Path D — Local-only (no cloud)

If exhibit WiFi is unreliable and you don't want any cloud dependency:

1. Install the PWA **once** on each Chromebook/tablet from any of Paths A–C, at home on a stable network.
2. On exhibit day, devices run offline from their installed copy — the service worker serves everything from cache.
3. If you need to push a content update during the show, bring the devices back onto WiFi briefly; the SW refreshes with the new `CACHE_VERSION`.

---

## Path E — Serve from the laptop over local WiFi (fallback)

For a demo without installing anything:

```bash
cd prototype && python3 -m http.server 5173 --bind 0.0.0.0
```

Then on the Chromebook / tablet: visit `http://<laptop-ip>:5173`. Works on any laptop-and-device-on-same-network setup, but the PWA install prompt won't show (no HTTPS), and the device can't go offline.

---

## Publishing a content update

The service worker caches everything. To force clients to pick up new copy:

1. Edit `prototype/content.js` (or anything else under `prototype/`).
2. Bump `CACHE_VERSION` in `prototype/sw.js` — e.g. `"erebus-medbay-v2"`.
3. Redeploy (drag to Netlify Drop again, or `git push`).
4. Devices get the new version the next time they're online and the page is loaded.

---

## Pre-show checklist

- [ ] Chromebook / tablet visits the deployed URL on WiFi at least once.
- [ ] "Install app" menu option appears in Chrome → install it.
- [ ] Launch the installed app, complete one full station → confirm it works.
- [ ] Put the device in airplane mode → launch again → confirm offline behavior.
- [ ] Charge to full the night before. Exhibit day is 9+ hours of screen time.
