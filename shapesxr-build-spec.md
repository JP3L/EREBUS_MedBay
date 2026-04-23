# EREBUS MedBay — ShapesXR Build Spec

This is the translation layer between the [prototype](prototype/index.html) (which is the authoritative content + flow) and the ShapesXR scene you'll author with the Oculus headset + web editor.

**How to use this doc:** for each station, build a ShapesXR scene matching the frame list below. Drop in the popup UI panels exported from Figma. Wire the triggers as described. Reference the prototype when you need to see exactly what a step should look/read like.

---

## 0. Scene architecture

Four scenes in one ShapesXR project:

| Scene | Purpose | Source-of-truth in prototype |
|---|---|---|
| `00_Intro_MedBay` | Welcome voice-over + wide shot of three stations pulsing red | `/#/intro` |
| `01_Station_Triage` | Lt. Alvarez + generic pulse/BP monitor | `/#/s1/...` |
| `02_Station_Trauma` | Dr. Mara Chen + GE DASH 3000 | `/#/s2/...` |
| `03_Station_ICU` | Engineer Osei + Masimo Radical-7 | `/#/s3/...` |
| `04_Closeout` | "All Patients Stabilized" teaching cards recap | `/#/closeout` |

**Rationale:** each scene stays under the ~100 unique objects / 300k polys soft limit. Transitions between scenes via the "Go to Scene" trigger on the "Return to Mission Control" buttons.

**Shared MedBay shell:** model the physical CYB 1720 room layout. Place **three beds** on tables matching Tables 1, 3, 5 (the projector wall is the back wall). Each bed has a mannequin, a device prop, and an invisible "trigger zone" that, when a player walks into it, teleports them into the per-station scene.

---

## 1. Color / state language (consistent across all scenes)

| State | Hex | ShapesXR material | When to use |
|---|---|---|---|
| Alert (critical) | `#ff3355` | "Red-Pulse" | Unresolved alert; pulsing animation on 1.6s loop |
| Investigating | `#ffcc00` | "Amber-Steady" | Player has opened the device but not decided |
| Stabilized | `#00ff99` | "Green-Glow" | Correct action taken; device/mannequin/alert turns green |
| UI primary | `#36e0ff` | "Cyan-UI" | All interactive UI (buttons, highlights) |
| Failed | `#ff3355` + dim glow | "Red-Fail" | Wrong choice; short overlay before retry |

**Pulse animation:** 2-frame loop in ShapesXR. Frame A = red at opacity 1.0; Frame B = red at opacity 0.4 + scale 1.05. After Delay 800ms each. Apply to the device mesh and an invisible halo ring under the bed.

---

## 2. How to build the popup panels — native ShapesXR, not Figma or PNGs

**Decision: build panels natively in ShapesXR. Skip Figma. Skip PNG export.**

Reason: you want to be able to tweak copy up until (and during) showtime. Figma frames and PNG imports both bake text into pixels from ShapesXR's perspective — you cannot edit a Figma-imported panel's text from inside ShapesXR. Native ShapesXR **text primitives** are first-class editable objects, so the on-site docent can change copy in the web editor or in VR without re-exporting anything.

**Recipe per panel** (20 panels total — 6 for Station 1, 7 each for Stations 2 and 3):

1. **Background rectangle** — sized 1024×768 (good VR readable scale), color `#10203856` (matches `--panel` in style.css). Add a 1px border in `#1e4166` (`--panel-edge`).
2. **Corner marks** — a small text primitive top-left reading `EREBUS // MEDBAY` in cyan (`#36e0ff`), and another top-right reading the step ID (`s1_0_alert` etc.) in dim gray. These stay constant across all panels — duplicate and reuse.
3. **Heading** — text primitive, 26pt, `#36e0ff` (cyan), text value = the step's `heading` from `content.js`.
4. **Body** — text primitive, 18pt, `#d7e3f0`, text value = the step's `body`.
5. **Inline data panel** (compare / diag / log — see below) — rectangle with darker fill + nested text primitives.
6. **Verdict strip** (if the step has one) — rectangle with `#ffcc00` left border, text primitive with the verdict.
7. **Choice buttons** — rounded rectangle per choice, cyan border, text label on top. Each button is its own ShapesXR interactive object so you can wire the `On Click → Go to Frame` trigger.
8. **Banner** (if step has `state: stabilized | failed | partial | complete`) — a colored strip at the top of the panel in green/red/amber.

**For compare / diag / log sub-panels:**
- `compare` (2 steps use it): two side-by-side rectangles, red-bordered on the "wrong" side, green on the "right" side. Each holds a title text + one text primitive per line.
- `diag` (2 steps): single rectangle with pairs of `key` / `value` text primitives in a two-column layout.
- `log` (2 steps): black rectangle, one text primitive per log line, monospace font.

**Build the first panel, then clone it** — ShapesXR's duplicate-and-edit cycle is much faster than Figma round-trips for this volume. First panel ~20 minutes; subsequent panels ~5-8 minutes each since you're just swapping text.

**`prototype/content.js` is your paste source.** For each panel, open the matching step in content.js, copy the `heading`, `body`, `panel` data, and `choices` labels into the corresponding ShapesXR text primitives. One source of truth, no drift.

### When you might still want Figma or PNGs

- **If you want pixel-perfect typographic polish** that native ShapesXR can't match (custom fonts, tight kerning, gradient effects) — Figma wins, but you lose in-ShapesXR editability.
- **If you want a "backup deck"** the docent can pull up on an iPad if a headset dies — run `./export-panels.sh` once to produce flat PNGs of every panel. Don't use them in VR; use them as a pocket reference.

The `prototype/panel.html` renderer and `./export-panels.sh` script still exist for that backup-deck case — just not as the primary VR authoring path.

---

## 3. Station 1 frame list (Triage — Pulse/BP monitor)

Each row = one ShapesXR frame. Build frames in this order inside the `01_Station_Triage` scene. Reference prototype route `/#/s1/<stepId>` for the exact copy.

| # | Frame name | Visible objects | On-enter effect | Interaction | Next frame |
|---|---|---|---|---|---|
| 1 | `S1_0_Alert_Pulsing` | Device model (red pulse), patient mannequin, vital display showing `HR 180 / BP 70/40`, native panel `s1_0_alert` | Audio: alarm beep loop | Click `View Raw Signal` button on panel | `S1_1_Raw_Compare` |
| 2 | `S1_1_Raw_Compare` | Replace panel with `s1_1_raw`. Keep device red. | Mismatch highlight flashes amber 2× | Click `Device Diagnostics` | `S1_2_Diagnostics` |
| 3 | `S1_2_Diagnostics` | Panel `s1_2_diag` showing rogue AP row | Verdict text fades in | Two buttons: `Isolate (Spaceplane Mode)` / `Ignore` | `S1_3_Win` or `S1_3_Fail` |
| 4a | `S1_3_Win_Stabilized` | Device → green material. Mannequin halo → green. Panel `s1_3_win`. | Success chime; nurse voice-over clip | Click `Teaching Card` | `S1_4_Teach` |
| 4b | `S1_3_Fail` | Red overlay, panel `s1_3_fail` | Fail chime | Click `Retry` | `S1_0_Alert_Pulsing` |
| 5 | `S1_4_Teach` | Full-screen teaching card, device green in background | Chime; Mission Control icon pulses green | Click `Return to Mission Control` | **Go to Scene** `00_Intro_MedBay` with s1 flag set |

**Trigger type for most buttons:** `On Click → Go to Frame`. For the final return-to-mission, use `On Click → Go to Scene` and set a scene-persistent variable `s1_done = true` if ShapesXR supports it (if not, handle in the shell scene — see §6).

---

## 4. Station 2 frame list (Trauma — GE DASH 3000)

| # | Frame name | Visible objects | Interaction | Next frame |
|---|---|---|---|---|
| 1 | `S2_0_Central_Alert` | GE DASH 3000 model (red pulse), mannequin, central-station monitor overhead showing flatline, panel `s2_0_alert` | `Compare Central vs. Bedside` | `S2_1_Compare` |
| 2 | `S2_1_Compare` | Compare panel `s2_1_compare`. Central flatline vs. bedside sinus rhythm waveforms as looping textures | `Trace Source` | `S2_2_Trace` |
| 3 | `S2_2_Trace` | Panel `s2_2_trace` (SMB log) + verdict | **3 buttons:** Quarantine VLAN / Kill SMB port / Emergency patch | `S2_3_Win` / `S2_3_Partial` / `S2_3_Slow` |
| 4a | `S2_3_Win_Stabilized` | Network diagram animates DASH to VLAN-20; green glow | `Teaching Card` | `S2_4_Teach` |
| 4b | `S2_3_Partial` | Amber overlay, "pivot warning" | `Escalate to VLAN quarantine` | `S2_3_Win_Stabilized` |
| 4c | `S2_3_Slow` | Amber overlay, "change window too long" | `Segment first` | `S2_3_Win_Stabilized` |
| 5 | `S2_4_Teach` | Teaching card (MDhex / CVE-2020-6963 / ICSMA-20-023-01) | `Return to Mission Control` | scene transition |

---

## 5. Station 3 frame list (ICU — Masimo Radical-7)

| # | Frame name | Visible objects | Interaction | Next frame |
|---|---|---|---|---|
| 1 | `S3_0_Mismatch` | Radical-7 model showing `SpO₂ 98%` green, but **patient mannequin material = cyanotic** (blue tint on face/lips) and gasping animation. Panel `s3_0_alert`. | `Check Firmware History` | `S3_1_Firmware` |
| 2 | `S3_1_Firmware` | Panel `s3_1_firmware` (unsigned update) | `Network Activity` | `S3_2_Network` |
| 3 | `S3_2_Network` | Panel `s3_2_network` (outbound beacon to 202.114.4.119:515). World-map overlay draws a line from device → external IP. | **3 buttons:** Block egress + revert / Disable wireless / Trust display | `S3_3_Win` / `S3_3_Partial` / `S3_3_Fail` |
| 4a | `S3_3_Win_Stabilized` | Firewall rule pulses; firmware version rolls back. **True SpCO 34%** displays; hyperbaric protocol icon. Mannequin cyanosis clears → normal skin tone. | `Teaching Card` | `S3_4_Teach` |
| 4b | `S3_3_Partial` | Wireless icon goes off but reading still false; amber overlay | `Revert firmware and block egress` | `S3_3_Win_Stabilized` |
| 4c | `S3_3_Fail` | Red overlay, "Time of Death" text, 3-second hold | `Retry` | `S3_0_Mismatch` |
| 5 | `S3_4_Teach` | Teaching card naming Contec CMS8000 / CISA ICSMA-25-030-01 with explicit disclaimer | `Return to Mission Control` | scene transition |

---

## 6. Cross-scene progress + Mission Control

ShapesXR multiplayer spaces persist objects but have limited "variable" support between scenes. Two ways to handle the 0/3 → 3/3 progression on the shared MedBay shell:

**Option A — Object visibility (simplest, recommended):** in the shell scene, each station bed has two "status ring" objects — `ring_s1_red` and `ring_s1_green`, stacked. The red ring is visible by default. A frame in the shell scene called `SHELL_Progress` has triggers "On Scene Enter after completing sX → hide red ring, show green ring." This is brittle; expect to wire it twice and test.

**Option B — Skip mid-session persistence:** treat each session as independent — the player just cycles through the 3 scenes without a "progress" HUD. Docent resets between players. Simpler, lower build cost, and arguably better UX for a 5-minute exhibit slot.

**Recommendation:** go with **Option B** for Imagine RIT. The HUD progress is a nice-to-have; getting three stations to actually work end-to-end is the must-have. Keep the prototype/projector display as the "public" progress view; headset experience is linear.

---

## 7. Assets to import

All of these are either in the ShapesXR "medicine" library, Sketchfab CC-BY downloads, or quick Figma renders. Budget ~2 hours of asset gathering.

| Asset | Source | Notes |
|---|---|---|
| Sci-fi hospital bed | Sketchfab "sci-fi medical bed" (filter CC-BY) | 3 instances; paint with cyan accents |
| Mannequin / human figure | ShapesXR built-in `person` primitive is OK | Apply cyanotic skin texture for S3 |
| Generic bedside monitor | Low-poly Sketchfab or Figma-render a flat panel | Station 1 |
| GE DASH 3000 | Build a stylized block (GE branding optional — avoid trademark risk) | Station 2; label it "BedMon-3K" in-scene if we want to dodge trademark |
| Masimo Radical-7 | Stylized handheld | Station 3 |
| Overhead central-station monitor (ceiling-mounted) | Extruded cube + texture | Station 2 |
| Waveform textures (ECG normal / flatline) | Figma frames exported as PNG, looped | Station 2 |
| World-map overlay PNG for outbound beacon line | Figma | Station 3 |
| EREBUS logo wall decal | Figma export | All scenes |
| Cyberpunk corridor tile (floor/wall) | Sketchfab | Shared shell |

---

## 8. Audio

Four audio clips, each ~2-5 seconds. Free-license sources: freesound.org, Pixabay. Import via ShapesXR's audio trigger (On Frame Enter).

| Clip | Usage | Source hint |
|---|---|---|
| `alarm_loop.wav` | On any `_Alert_Pulsing` frame | freesound "medical alarm" |
| `success_chime.wav` | On any `_Win_Stabilized` frame | freesound "ui success" |
| `fail_thud.wav` | On any `_Fail` frame | freesound "error deep" |
| `nurse_vo_s1.wav`, `...s2.wav`, `...s3.wav` | Teaching card intros | Record with a team member in GarageBand; 5-10s each |

Keep volume low — three stations running simultaneously will get chaotic.

---

## 9. Build order (this week)

Day 1
- [ ] Export all 16 Figma UI panels from the prototype styling
- [ ] Gather assets (§7)

Day 2
- [ ] Build `01_Station_Triage` scene end-to-end as the reference pattern
- [ ] Playtest with 1 team member in VR; time the flow; fix copy

Day 3
- [ ] Clone pattern for `02_Station_Trauma` and `03_Station_ICU`
- [ ] Build `00_Intro_MedBay` shell + scene-transition wiring

Day 4
- [ ] Playtest with 3 non-team testers; iterate on confusion points
- [ ] Print signage, handouts (200x CISO-memo-driven one-pager), sticker badges
- [ ] Pack headsets, chargers, wipes

Day 5 (2026-04-24 Friday setup)
- [ ] Measure CYB 1720 tables; adjust ShapesXR shell positions to match
- [ ] Full dress rehearsal with the CISO loan gear (if received)

Day 6 (2026-04-25 showtime)
- [ ] Doors 10am

---

## 10. Verification checklist (pre-show)

- [ ] Every frame reachable by only mouse/controller clicks (no keyboard shortcuts required)
- [ ] All 16 Figma panels imported with readable text in VR (check at arm's length; min 18pt equivalent)
- [ ] Audio clips play on correct frames, clipped to appropriate length
- [ ] Color transitions red→green visible and immediate on correct action
- [ ] Fail branches always offer a Retry → Alert reset loop
- [ ] Scene transitions ≤ 2 seconds between stations
- [ ] Two headsets in the same multi-user room don't collide (different stations, different frame states)
- [ ] Non-VR fallback: projector loop shows prototype at `http://[laptop]:5173` with auto-cycling through mission control view

---

## 11. Reference links

- Prototype (single source of truth): `prototype/index.html`
- Scenario content (copy this verbatim into ShapesXR text objects): `prototype/content.js`
- CISO-facing threat models: `CISO-memo.md`
- ShapesXR docs: https://learn.shapesxr.com
- Figma plugin: https://learn.shapesxr.com/import/figma-integration
