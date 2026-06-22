/* =============================================================================
   routines.js — The Routines (Feature D) + the weekly schedules.

   A routine never names an exercise. It names a TAG SLOT (a set of tags) plus a
   DOSE (sets × reps). The engine fills each slot from the pool, honouring the
   phase's level cap. Slots are matched like so:
     - across tag dimensions  → AND  ("horizontal-push" AND "chest")
     - within one dimension   → OR   ("anti-rotation" OR "anti-extension")
     - `primary: true`        → the slot's muscle must be the exercise's PRIMARY
                                 (first) muscle — used for isolation accessories.
   ========================================================================== */

/* slot(label, dose, tags, opts) — small constructor to keep templates readable.
   dose: [sets, reps]; either may be null. reps may be a range "10–12", a label
   like "as able" or a duration "25–35 min". */
function slot(label, [sets, reps], tags, opts = {}) {
  return { label, sets, reps, tags, prefer: opts.prefer || null, primary: !!opts.primary, note: opts.note || null };
}

/* --- The templates ------------------------------------------------------- */
const TEMPLATES = {
  /* Phase 1 — full-body (machine-heavy, learn the patterns) */
  FB: {
    id: "FB", name: "Full Body", kind: "lift",
    slots: [
      slot("Squat — knee-dominant", [3, "10–12"], { pattern: ["squat"] }),
      slot("Horizontal Push — chest", [3, "10–12"], { pattern: ["horizontal-push"], muscle: ["chest"] }),
      slot("Vertical Pull", [3, "10–12"], { pattern: ["vertical-pull"] }),
      slot("Hinge", [2, "12–15"], { pattern: ["hinge"] }),
      slot("Horizontal Pull", [2, "10–12"], { pattern: ["horizontal-pull"] }),
      slot("Vertical Push", [2, "10–12"], { pattern: ["vertical-push"] }),
      slot("Core — anti-extension", [3, null], { pattern: ["core-anti-extension"] }),
    ],
  },

  /* Cardio + Skill day (Phase 1–2) */
  CARDIO: {
    id: "CARDIO", name: "Cardio + Skill", kind: "cardio",
    note: "Finish with 10 min of easy mobility.",
    slots: [
      slot("Conditioning", [null, "25–35 min"], { pattern: ["conditioning"], equip: ["machine"] }),
      slot("Push-up practice", [3, null], { pattern: ["horizontal-push"], equip: ["bodyweight"] }, { prefer: ["push-up"] }),
      slot("Vertical Pull — lat work", [3, null], { pattern: ["vertical-pull"] }),
    ],
  },

  /* Active-recovery day */
  RECOVERY: {
    id: "RECOVERY", name: "Active Recovery", kind: "recovery",
    note: "Genuinely easy — this exists to keep you moving, not to train.",
    slots: [
      slot("Easy walk", [null, "40–60 min"], { pattern: ["conditioning"], equip: ["bodyweight"] }),
    ],
  },

  /* Phase 2+ — Upper / Lower split */
  UA: {
    id: "UA", name: "Upper A", kind: "lift",
    slots: [
      slot("Horizontal Push — chest", [3, "8–12"], { pattern: ["horizontal-push"], muscle: ["chest"] }),
      slot("Vertical Pull", [3, "8–12"], { pattern: ["vertical-pull"] }),
      slot("Vertical Push", [3, "10–12"], { pattern: ["vertical-push"] }),
      slot("Horizontal Pull", [3, "10–12"], { pattern: ["horizontal-pull"] }),
      slot("Triceps", [2, "12–15"], { muscle: ["triceps"] }, { primary: true }),
      slot("Biceps", [2, "12–15"], { muscle: ["biceps"] }, { primary: true }),
    ],
  },
  LA: {
    id: "LA", name: "Lower A", kind: "lift",
    slots: [
      slot("Squat — knee-dominant", [3, "10–12"], { pattern: ["squat"] }),
      slot("Hinge — hamstrings", [3, "10–12"], { pattern: ["hinge"], muscle: ["hamstrings"] }),
      slot("Quads — isolation", [2, "12–15"], { pattern: ["isolation"], muscle: ["quads"] }),
      slot("Calves", [3, "12–15"], { muscle: ["calves"] }, { primary: true }),
      slot("Core — anti-extension", [3, null], { pattern: ["core-anti-extension"] }),
    ],
  },
  UB: {
    id: "UB", name: "Upper B", kind: "lift",
    slots: [
      slot("Horizontal Push — incline", [3, "8–12"], { pattern: ["horizontal-push"] }, { prefer: ["incline"] }),
      slot("Vertical Pull", [3, "8–10"], { pattern: ["vertical-pull"] }),
      slot("Side Delts", [3, "12–15"], { muscle: ["side-delts"] }, { primary: true }),
      slot("Horizontal Pull", [3, "10–12"], { pattern: ["horizontal-pull"] }),
      slot("Rear Delts", [2, "12–15"], { muscle: ["rear-delts"] }, { primary: true }),
      slot("Push-up practice", [2, null], { pattern: ["horizontal-push"], equip: ["bodyweight"] }, { prefer: ["push-up"] }),
    ],
  },
  LB: {
    id: "LB", name: "Lower B", kind: "lift",
    slots: [
      slot("Squat — goblet bias", [3, "8–10"], { pattern: ["squat"] }, { prefer: ["goblet"] }),
      slot("Hinge — glutes", [3, "10–12"], { pattern: ["hinge"], muscle: ["glutes"] }, { prefer: ["hip-thrust"] }),
      slot("Hamstrings — isolation", [2, "12–15"], { pattern: ["isolation"], muscle: ["hamstrings"] }),
      slot("Calves", [3, "12–15"], { muscle: ["calves"] }, { primary: true }),
      slot("Core — anti-rotation", [3, null], { pattern: ["core-anti-rotation", "core-anti-extension"] }),
    ],
  },

  /* Phase 3+ — Push / Pull / Legs */
  PUSH: {
    id: "PUSH", name: "Push", kind: "lift",
    slots: [
      slot("Horizontal Push — chest", [4, "8–12"], { pattern: ["horizontal-push"], muscle: ["chest"] }),
      slot("Vertical Push", [3, "8–12"], { pattern: ["vertical-push"] }),
      slot("Horizontal Push — incline", [3, "10–12"], { pattern: ["horizontal-push"] }, { prefer: ["incline"] }),
      slot("Side Delts", [3, "12–15"], { muscle: ["side-delts"] }, { primary: true }),
      slot("Triceps", [2, "12–15"], { muscle: ["triceps"] }, { primary: true }),
      slot("Triceps", [2, "12–15"], { muscle: ["triceps"] }, { primary: true }),
    ],
  },
  PULL: {
    id: "PULL", name: "Pull", kind: "lift",
    slots: [
      slot("Vertical Pull", [4, "8–12"], { pattern: ["vertical-pull"] }),
      slot("Horizontal Pull", [3, "8–12"], { pattern: ["horizontal-pull"] }),
      slot("Vertical Pull — assisted / negative", [3, "as able"], { pattern: ["vertical-pull"] }, { prefer: ["assisted", "negative"] }),
      slot("Rear Delts", [3, "12–15"], { muscle: ["rear-delts"] }, { primary: true }),
      slot("Biceps", [2, "12–15"], { muscle: ["biceps"] }, { primary: true }),
      slot("Biceps", [2, "12–15"], { muscle: ["biceps"] }, { primary: true }),
    ],
  },
  LEGS: {
    id: "LEGS", name: "Legs", kind: "lift",
    slots: [
      slot("Squat — knee-dominant", [4, "8–12"], { pattern: ["squat"] }),
      slot("Hinge — hamstrings", [3, "10–12"], { pattern: ["hinge"], muscle: ["hamstrings"] }),
      slot("Hinge — glutes", [3, "10–12"], { pattern: ["hinge"], muscle: ["glutes"] }, { prefer: ["hip-thrust"] }),
      slot("Quads — isolation", [2, "12–15"], { pattern: ["isolation"], muscle: ["quads"] }),
      slot("Hamstrings — isolation", [2, "12–15"], { pattern: ["isolation"], muscle: ["hamstrings"] }),
      slot("Calves", [3, "12–15"], { muscle: ["calves"] }, { primary: true }),
      slot("Core", [3, null], { pattern: ["core-anti-extension", "core-anti-rotation", "core-flexion"] }),
    ],
  },
};

/* Convenience: weekday schedules use Mon=0 … Sun=6. Entries:
     null                    → rest
     "FB" / "UA" / …         → fixed template id
     { rotate: [...] }       → fill from a rolling rotation (counts training days) */
const REST = null;

/* --- The phases ---------------------------------------------------------- */
const PHASES = [
  {
    id: "foundation", n: 1, name: "Foundation", weeks: "Weeks 1–4",
    levelCap: "foundation", rir: "2–3 reps in reserve", intermediate: false,
    blurb: "Learn the patterns, build a base. Machine-heavy, full-body, moderate effort while movements are new.",
    defaultFrequency: 3,
    frequencies: {
      3: ["FB", REST, "FB", REST, "FB", REST, REST],
      5: ["FB", "CARDIO", "FB", "CARDIO", "FB", REST, REST],
      7: ["FB", "CARDIO", "FB", "CARDIO", "FB", "RECOVERY", "RECOVERY"],
    },
  },
  {
    id: "developing", n: 2, name: "Developing", weeks: "Weeks 5–9",
    levelCap: "developing", rir: "1–2 reps in reserve", intermediate: false,
    blurb: "More volume; free-weight patterns introduced. The body splits into Upper / Lower so each gets trained harder.",
    defaultFrequency: 3,
    frequencies: {
      3: [{ rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, REST],
      5: ["UA", "LA", "CARDIO", "UB", "LB", REST, REST],
      7: ["UA", "LA", "UB", "LB", "CARDIO", "RECOVERY", "RECOVERY"],
    },
  },
  {
    id: "intermediate", n: 3, name: "Intermediate", weeks: "Weeks 10–16",
    levelCap: "intermediate", rir: "1–2 reps in reserve", intermediate: true,
    blurb: "More total sets, heavier free-weight compounds, harder variations unlocked. First slot biases toward a free-weight option.",
    defaultFrequency: 3,
    frequencies: {
      3: [{ rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, REST],
      5: ["PUSH", "PULL", "LEGS", "UB", "LB", REST, REST],
      6: ["PUSH", "PULL", "LEGS", "PUSH", "PULL", "LEGS", REST],
    },
  },
  {
    id: "ongoing", n: 4, name: "Intermediate · Ongoing", weeks: "Weeks 17+",
    levelCap: "intermediate", rir: "1–2 reps in reserve", intermediate: true,
    blurb: "The structure stops changing; the loads and exercise difficulty keep climbing. A sustainable intermediate template.",
    defaultFrequency: 4,
    frequencies: {
      3: [{ rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, REST],
      4: ["UA", "LA", REST, "UB", "LB", REST, REST],
      5: ["PUSH", "PULL", "LEGS", "UB", "LB", REST, REST],
      6: ["PUSH", "PULL", "LEGS", "PUSH", "PULL", "LEGS", REST],
    },
  },
];
