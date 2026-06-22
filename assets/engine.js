/* =============================================================================
   engine.js — The selection engine.

   Turns (today's date + phase + frequency) into a concrete workout:
     1. The date decides which session today is (the weekly schedule, with a
        rolling rotation for Upper/Lower splits).
     2. The date also SEEDS a deterministic PRNG, so the same day always yields
        the same exercises — but each day reshuffles the pool. "Consistency by
        seed": open it tomorrow and you get a fresh, coherent session.
   ========================================================================== */

/* --- Deterministic PRNG (xmur3 seed → mulberry32 stream) ----------------- */
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(seedStr) {
  return mulberry32(xmur3(seedStr)());
}

/* --- Calendar helpers (timezone-stable: count whole calendar days) -------- */
const EPOCH_DN = 19723; /* 2024-01-01, a Monday — the rotation origin */

function dayNumber(date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}
function weekdayMon0(dn) {
  /* 1970-01-01 (dn 0) was a Thursday → offset by 3 so Monday = 0 */
  return (((dn + 3) % 7) + 7) % 7;
}
function formatDateKey(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

/* Which item of a rolling rotation falls on this day. Counts the number of
   rotation-days elapsed since the Monday epoch, so a 4-template rotation rolls
   forward smoothly across a 3-day-a-week schedule regardless of the calendar. */
function rotationIndexFor(dn, rotateWeekdays, poolLen) {
  const daysSince = dn - EPOCH_DN;
  const weeksSince = Math.floor(daysSince / 7);
  const wd = weekdayMon0(dn);
  const earlierThisWeek = rotateWeekdays.filter((d) => d < wd).length;
  const before = weeksSince * rotateWeekdays.length + earlierThisWeek;
  return ((before % poolLen) + poolLen) % poolLen;
}

/* --- Phase / level helpers ----------------------------------------------- */
function getPhase(id) {
  return PHASES.find((p) => p.id === id) || PHASES[0];
}
function availableFrequencies(phase) {
  return Object.keys(phase.frequencies).map(Number).sort((a, b) => a - b);
}
function levelAllowed(ex, levelCap) {
  return LEVEL_ORDER.indexOf(ex.level) <= LEVEL_ORDER.indexOf(levelCap);
}

/* Phase 3+ tweak to the Upper/Lower templates: +1 set on the first two compound
   slots, and bias the very first slot toward a higher-skill free-weight pick. */
const UL_IDS = ["UA", "LA", "UB", "LB"];
function applyIntermediateTransform(template) {
  const slots = template.slots.map((s, i) => {
    const copy = { ...s };
    if (i < 2 && copy.sets != null) copy.sets = copy.sets + 1;
    if (i === 0) copy.preferSkill = "high";
    return copy;
  });
  return { ...template, slots, transformed: true };
}

/* --- Resolve which session today is -------------------------------------- */
function resolveSession(phase, frequency, date) {
  const schedule = phase.frequencies[frequency] || phase.frequencies[phase.defaultFrequency];
  const dn = dayNumber(date);
  const entry = schedule[weekdayMon0(dn)];

  if (entry == null) return { type: "rest", templateId: null, template: null };

  let templateId;
  if (typeof entry === "object" && entry.rotate) {
    const rotateWeekdays = schedule
      .map((e, i) => (e && typeof e === "object" && e.rotate ? i : -1))
      .filter((i) => i >= 0);
    templateId = entry.rotate[rotationIndexFor(dn, rotateWeekdays, entry.rotate.length)];
  } else {
    templateId = entry;
  }

  let template = TEMPLATES[templateId];
  if (phase.intermediate && UL_IDS.includes(templateId)) {
    template = applyIntermediateTransform(template);
  }
  return { type: template.kind, templateId, template };
}

/* --- Slot matching + weighting ------------------------------------------- */
function matchesSlot(ex, slot, levelCap) {
  if (!levelAllowed(ex, levelCap)) return false;
  for (const dim of Object.keys(slot.tags)) {
    const want = slot.tags[dim];
    if (dim === "muscle" && slot.primary) {
      if (!want.includes(ex.muscle[0])) return false; /* must be the PRIMARY muscle */
    } else {
      const have = ex[dim] || [];
      if (!want.some((v) => have.includes(v))) return false;
    }
  }
  return true;
}

function weightFor(ex, slot, phase) {
  let w = 1;
  /* Phase 1 prefers the guided, hard-to-do-wrong options. */
  if (phase.levelCap === "foundation") {
    if (ex.skill.includes("low")) w *= 3;
    if (ex.equip.includes("machine") || ex.equip.includes("bodyweight")) w *= 1.5;
  }
  /* Intermediate: bias the opening compound toward a free-weight, higher-skill lift. */
  if (slot.preferSkill === "high") {
    if (ex.skill.includes("high")) w *= 4;
    else if (ex.skill.includes("moderate")) w *= 1.5;
  }
  /* Slot-level keyword bias (incline / goblet / hip-thrust / assisted / …). */
  if (slot.prefer && ex.keywords && ex.keywords.some((k) => slot.prefer.includes(k))) {
    w *= 5;
  }
  return w;
}

function weightedPick(list, weights, rng) {
  let sum = 0;
  for (const w of weights) sum += w;
  let r = rng() * sum;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r < 0) return list[i];
  }
  return list[list.length - 1];
}

/* Render a slot's dose against the chosen exercise (adds "/side" for unilateral). */
function formatDose(slot, ex) {
  const { sets, reps } = slot;
  const perSide = ex.load === "unilateral" && reps && /\d/.test(reps) && !reps.includes("min");
  if (sets != null && reps != null) return `${sets} × ${reps}${perSide ? " /side" : ""}`;
  if (sets != null) return `${sets} sets`;
  if (reps != null) return reps;
  return "";
}

/* --- The main entry point ------------------------------------------------ */
function buildWorkout(phase, frequency, date) {
  const session = resolveSession(phase, frequency, date);
  const result = { date, phase, frequency, session, items: [], seed: null };
  if (session.type === "rest") return result;

  const seedStr = `${formatDateKey(date)}|${phase.id}|${frequency}|${session.templateId}`;
  result.seed = seedStr;
  const rng = makeRng(seedStr);
  const used = new Set();

  for (const slot of session.template.slots) {
    const candidates = EXERCISES.filter((ex) => matchesSlot(ex, slot, phase.levelCap));
    let pool = candidates.filter((ex) => !used.has(ex.id));
    if (pool.length === 0) pool = candidates; /* allow a repeat rather than an empty slot */

    let exercise = null;
    if (pool.length) {
      const weights = pool.map((ex) => weightFor(ex, slot, phase));
      exercise = weightedPick(pool, weights, rng);
      used.add(exercise.id);
    }
    result.items.push({ slot, exercise, dose: exercise ? formatDose(slot, exercise) : null });
  }
  return result;
}
