// EREBUS MedBay — authoritative scenario content.
// This file is the single source of truth for every popup, button label, and
// teaching-card text that will appear in the ShapesXR build. Author the prototype
// first, iterate copy here, then transcribe into ShapesXR frames.

export const SPLASH = {
  brand: "EREBUS",
  subtitle: "MEDBAY",
  tagline: "Cyber-Clinical Response Operations",
  status: "Stand by — awaiting operator",
  footer: "Imagine RIT 2026 · CYB 1720",
};

export const INTRO = {
  title: "EREBUS MedBay — Incoming",
  lines: [
    "Welcome, Cyber-Clinical Response Operator.",
    "Multiple patients are in critical condition.",
    "We are detecting anomalies across networked medical devices.",
    "Attackers have breached the hospital wing of this station.",
    "You are authorized to diagnose, isolate, and stabilize.",
    "Lives depend on your decisions.",
  ],
  cta: "Enter MedBay",
};

export const CLOSEOUT = {
  title: "All Patients Stabilized",
  lines: [
    "You have defended the MedBay against three classes of real medical-device attack:",
    "• Rogue access points injecting false vitals",
    "• Hardcoded credentials on legacy monitors",
    "• Firmware backdoors beaconing to the outside",
    "Real hospitals layer these defenses — segmentation, authentication, monitoring, patching, incident response — because no single control is enough.",
    "Thank you for serving as our Cyber-Clinical Response Operator.",
  ],
  cta: "Replay MedBay",
};

export const STATIONS = [
  // ─────────────────────────────────────────────────────────────────────────
  // STATION 1 — TRIAGE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "s1",
    title: "Triage Bay — Lt. Alvarez",
    patient: {
      name: "Lt. Alvarez",
      role: "Survivor, Veridium salvage",
      status: "Unconscious, stable",
      background:
        "Recovered 20 APR 2126 from escape pod aboard a Veridium-flagged mining vessel. Brain scan: deep sleep with intact memory. Expected full recovery.",
    },
    device: {
      name: "Pulse & Blood Pressure Monitor",
      blurb:
        "Generic bedside vital-signs monitor — HR, NIBP, SpO₂. Wi-Fi/LAN to central station.",
    },
    alert: {
      displayed: "HR 180 BPM • BP 70/40 • ⚠ CRASHING",
      severity: "critical",
    },
    steps: [
      {
        id: "s1_0_alert",
        heading: "Device Alert",
        body: "Lt. Alvarez vitals spiked without warning. Patient appears to be breathing well and resting comfortably. Sedation team standing by. Investigate before administering anything.",
        choices: [{ label: "View Raw Signal", next: "s1_1_raw" }],
      },
      {
        id: "s1_1_raw",
        heading: "Displayed vs. Raw Probe",
        body: "Side-by-side comparison of the network-reported signal and the direct-from-probe reading.",
        panel: {
          type: "compare",
          left: { title: "Displayed (network)", lines: ["HR 180 BPM", "BP 70/40", "SpO₂ 88%"] },
          right: { title: "Raw Probe", lines: ["HR 60 BPM", "BP 118/78", "SpO₂ 98%"] },
          mismatch: true,
        },
        choices: [{ label: "Device Diagnostics", next: "s1_2_diag" }],
      },
      {
        id: "s1_2_diag",
        heading: "Device Diagnostics",
        body: "Network association reveals the problem.",
        panel: {
          type: "diag",
          rows: [
            ["Associated AP", "rogue_signal_88"],
            ["Expected AP", "MED-SECURE-VLAN20"],
            ["Signal source", "UNKNOWN — no 802.1X auth"],
            ["Encryption", "None (open)"],
          ],
          verdict: "Device is talking to a rogue access point. Telemetry is being rewritten in flight.",
        },
        choices: [
          { label: "Isolate device from network (Spaceplane Mode)", next: "s1_3_win", correct: true },
          { label: "Ignore — trust the display", next: "s1_3_fail" },
        ],
      },
      {
        id: "s1_3_win",
        heading: "Device Isolated — Vitals Matching",
        body: "Alvarez's monitor is now on a hardwired link. Displayed vitals match the raw probe. Alert cleared. Nurse voice-over: 'Good call, Operator. We'll keep him on the wired monitor.'",
        state: "stabilized",
        choices: [{ label: "Teaching Card", next: "s1_4_teach" }],
      },
      {
        id: "s1_3_fail",
        heading: "Adverse Event",
        body: "The sedation team administered sedatives based on the false vitals. Patient respiratory arrest. Rapid-response paged. RESET to try again.",
        state: "failed",
        choices: [{ label: "Retry", next: "s1_0_alert" }],
      },
      {
        id: "s1_4_teach",
        heading: "Teaching Card — What You Just Defended",
        body: "You spotted an evil-twin access point. In real hospitals, defense is layered:",
        takeaways: [
          "802.1X authentication on a dedicated medical-device VLAN",
          "Non-broadcast SSID; WPA2/3 with AES-CCMP",
          "Passive asset monitoring (Claroty xDome, Medigate, Ordr) catches rogue APs",
          "Clinical cross-check: a nurse eyeballing the patient catches impossible vitals",
        ],
        realWorld: "CISA advisories repeatedly flag rogue access points as a primary vector against hospital Wi-Fi.",
        state: "complete",
        choices: [{ label: "Return to Mission Control", next: "MISSION" }],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STATION 2 — TRAUMA
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "s2",
    title: "Trauma Bay — Dr. Mara Chen",
    patient: {
      name: "Dr. Mara Chen",
      role: "Xenobotanist, Station Hydroponics",
      status: "Post-op, sedated",
      background:
        "Admitted 22 APR 2126 after an emergency splenectomy following a 'decompression accident' in hydroponics. Stable post-op. Station security flagged the incident: 'inconclusive — further review pending.'",
    },
    device: {
      name: "GE DASH 3000",
      blurb:
        "Bedside multiparameter monitor — HR, BP, SpO₂, ECG, temp. Telemetry to central station via GE Unity Network.",
    },
    alert: {
      displayed: "ECG → FLATLINE (central) • probe → normal sinus",
      severity: "critical",
    },
    steps: [
      {
        id: "s2_0_alert",
        heading: "Central Station Alert",
        body: "Central station shows Dr. Chen flatlining. But before you call a code, the bedside probe tells a different story.",
        choices: [{ label: "Compare Central vs. Bedside", next: "s2_1_compare" }],
      },
      {
        id: "s2_1_compare",
        heading: "Waveform Comparison",
        body: "Two ECG feeds from the same device, diverging.",
        panel: {
          type: "compare",
          left: { title: "Central Station View", lines: ["ECG: FLATLINE", "HR: 0 BPM", "ALARM: ASYSTOLE"] },
          right: { title: "Bedside Probe (direct)", lines: ["ECG: NORMAL SINUS", "HR: 72 BPM", "No alarm condition"] },
          mismatch: true,
        },
        choices: [{ label: "Trace Source", next: "s2_2_trace" }],
      },
      {
        id: "s2_2_trace",
        heading: "SMB Session Log",
        body: "Someone is talking to the device using well-known credentials.",
        panel: {
          type: "log",
          lines: [
            "00:42:11  SMB login attempt from 10.12.4.77 — cred hash matches MDhex signature",
            "00:42:12  SMB login attempt from 10.12.4.77 — SUCCESS",
            "00:42:14  File write: /etc/telemetry/ecg_override.cfg",
            "00:42:15  Central station telemetry altered",
          ],
          verdict:
            "CVE-2020-6963 (MDhex, CISA ICSMA-20-023-01). Hardcoded credentials cannot be changed by the hospital — they live in firmware. Attacker pivoted from a compromised admin workstation on the same flat VLAN.",
        },
        choices: [
          { label: "Quarantine to MED-DEVICE-VLAN-20", next: "s2_3_win", correct: true, tag: "segmentation" },
          { label: "Block SMB port on the device", next: "s2_3_partial", tag: "partial" },
          { label: "Push emergency GE firmware patch", next: "s2_3_slow", tag: "slow" },
        ],
      },
      {
        id: "s2_3_win",
        heading: "VLAN Quarantine Applied",
        body: "Firewall rules moved the DASH to the medical-device VLAN. Workstation 10.12.4.77 can no longer reach it. Central station telemetry re-validates against the bedside probe. Asystole alarm clears. Dr. Chen is stable.",
        state: "stabilized",
        choices: [{ label: "Teaching Card", next: "s2_4_teach" }],
      },
      {
        id: "s2_3_partial",
        heading: "Partial Mitigation",
        body: "SMB blocked, but the attacker still has other hardcoded paths into the device. The 'unfix' on hardcoded credentials is not the port — it's the network boundary. Try segmentation instead.",
        state: "partial",
        choices: [
          { label: "Escalate to VLAN quarantine", next: "s2_3_win", correct: true },
        ],
      },
      {
        id: "s2_3_slow",
        heading: "Patch Requires Change Window",
        body: "GE patch requires a biomed change-control window. Typical timeline: 4 hours. Dr. Chen does not have 4 hours. Segment first — patch on schedule.",
        state: "partial",
        choices: [
          { label: "Segment first", next: "s2_3_win", correct: true },
        ],
      },
      {
        id: "s2_4_teach",
        heading: "Teaching Card — What You Just Defended",
        body: "You defended against MDhex (CVE-2020-6963) — hardcoded credentials on GE CARESCAPE/DASH, disclosed by CISA in January 2020.",
        takeaways: [
          "Segment medical devices to their own VLAN — always",
          "Patch on cadence, but accept that patching hardcoded-cred flaws requires firmware replacement",
          "Enrich passive monitoring with MDS2 forms per asset",
          "Playbook: 'Suspected telemetry interception' — isolate, revalidate, clinical handoff",
          "Procurement lever: FDA Section 524B (PATCH Act, 2023) requires SBOMs + postmarket patch plans",
        ],
        realWorld:
          "CVE-2020-6963 / CISA ICSMA-20-023-01 remains a canonical lesson in hospital cyber: patching alone can't fix hardcoded creds. Segmentation is the control that mattered.",
        state: "complete",
        choices: [{ label: "Return to Mission Control", next: "MISSION" }],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STATION 3 — ICU
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "s3",
    title: "ICU — Engineer Kofi Osei",
    patient: {
      name: "Engineer Kofi Osei",
      role: "Power-Systems, Engineering Deck",
      status: "Conscious, dyspneic — suspected CO poisoning",
      background:
        "Admitted 22 APR 2126 after level-3 hazard alarm on Deck 6. Patient reports seeing 'numbers on a screen that shouldn't have been there' right before the leak. Attending MD has flagged testimony for station security.",
    },
    device: {
      name: "Masimo Radical-7",
      blurb:
        "Pulse co-oximeter — SpO₂, SpHb, SpCO, SpMet. Wi-Fi/Ethernet to Masimo Iris Gateway and Patient SafetyNet.",
    },
    alert: {
      displayed: "SpO₂ 98% (green) • patient cyanotic, gasping",
      severity: "critical",
    },
    steps: [
      {
        id: "s3_0_alert",
        heading: "Clinical Picture Mismatch",
        body: "The monitor says Osei is fine. Your eyes say otherwise. He's cyanotic, gasping, and reporting headache consistent with CO exposure. Trust the display, or investigate?",
        choices: [{ label: "Check Firmware History", next: "s3_1_firmware" }],
      },
      {
        id: "s3_1_firmware",
        heading: "Firmware Panel",
        body: "An update installed overnight, unscheduled.",
        panel: {
          type: "diag",
          rows: [
            ["Current firmware", "v7.12.3 — installed 22 APR 2126 01:04 UTC"],
            ["Last known good", "v7.12.1"],
            ["Update channel", "UNSIGNED — vendor signature absent"],
            ["Authorized by", "— (no change-control record)"],
          ],
          verdict: "Unsigned firmware installed without change-control approval. This should never happen on a production medical device.",
        },
        choices: [{ label: "Network Activity", next: "s3_2_network" }],
      },
      {
        id: "s3_2_network",
        heading: "Passive Monitor Flag",
        body: "The station's passive detection (Claroty-equivalent) caught an outbound connection to a destination no Radical-7 has ever contacted before.",
        panel: {
          type: "log",
          lines: [
            "01:05:22  TCP session opened: 10.8.2.51 → 202.114.4.119:515",
            "01:05:22  Destination geolocation: external (non-hospital)",
            "01:05:22  Baseline: NEVER SEEN — new external destination for this device class",
            "01:05:23–06:00:00  Streaming binary payloads (suspected PHI) every 30s",
          ],
          verdict:
            "Pattern matches the real Contec CMS8000 disclosure (CISA ICSMA-25-030-01, Jan 2025; CVE-2025-0626 / CVE-2025-0683). A different vendor, same class of backdoor. The defense is the same.",
        },
        choices: [
          { label: "Block egress + revert firmware", next: "s3_3_win", correct: true, tag: "full" },
          { label: "Disable wireless only", next: "s3_3_partial", tag: "partial" },
          { label: "Trust the display — deprioritize", next: "s3_3_fail", tag: "fail" },
        ],
      },
      {
        id: "s3_3_win",
        heading: "Egress Blocked • Firmware Reverted",
        body: "Firewall rule published: medical-device VLAN can only reach EMR + Iris Gateway, never the open internet. Firmware rolled back to v7.12.1. True reading appears: SpCO 34% — severe CO poisoning. Hyperbaric protocol triggered. Osei stabilizes in minutes.",
        state: "stabilized",
        choices: [{ label: "Teaching Card", next: "s3_4_teach" }],
      },
      {
        id: "s3_3_partial",
        heading: "Wireless Off — Reading Still Wrong",
        body: "Radio silence prevents further exfiltration, but the altered firmware is still displaying a false SpCO. Clinical team is flying blind. You need to revert the firmware.",
        state: "partial",
        choices: [{ label: "Revert firmware and block egress", next: "s3_3_win", correct: true }],
      },
      {
        id: "s3_3_fail",
        heading: "Adverse Event",
        body: "The adversary wanted you to trust the display. Without hyperbaric treatment, Osei deteriorates. RESET to try again.",
        state: "failed",
        choices: [{ label: "Retry", next: "s3_0_alert" }],
      },
      {
        id: "s3_4_teach",
        heading: "Teaching Card — What You Just Defended",
        body: "You countered a firmware-backdoor-with-outbound-beacon attack. The pattern was first publicly disclosed against Contec CMS8000 monitors — a different vendor, same defensive playbook.",
        takeaways: [
          "Code-signed firmware + secure boot — reject unsigned images",
          "Egress filtering on the medical-device VLAN — no open internet",
          "TLS 1.2+ with certificate pinning between device and gateway",
          "Passive monitoring catches the first-ever external beacon",
          "SBOM review under FDA Section 524B is the procurement-side control",
        ],
        realWorld:
          "CISA ICSMA-25-030-01 (Jan 2025): Contec CMS8000 beaconed to a hardcoded external IP on startup and streamed PHI out of the hospital regardless of network policy. This scenario reuses the pattern; it does not imply the flaw exists in Masimo.",
        state: "complete",
        choices: [{ label: "Return to Mission Control", next: "MISSION" }],
      },
    ],
  },
];
