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
    id: "FB", name: "Corpo Todo", kind: "lift",
    slots: [
      slot("Agachamento — dominância de joelho", [3, "10–12"], { pattern: ["squat"] }),
      slot("Empurrar horizontal — peito", [3, "10–12"], { pattern: ["horizontal-push"], muscle: ["chest"] }),
      slot("Puxada vertical", [3, "10–12"], { pattern: ["vertical-pull"] }),
      slot("Hinge", [2, "12–15"], { pattern: ["hinge"] }),
      slot("Puxar horizontal", [2, "10–12"], { pattern: ["horizontal-pull"] }),
      slot("Empurrar vertical", [2, "10–12"], { pattern: ["vertical-push"] }),
      slot("Core — anti-extensão", [3, null], { pattern: ["core-anti-extension"] }),
    ],
  },

  /* Cardio + Skill day (Phase 1–2) */
  CARDIO: {
    id: "CARDIO", name: "Cardio + Técnica", kind: "cardio",
    note: "Termine com 10 min de mobilidade leve.",
    slots: [
      slot("Condicionamento", [null, "25–35 min"], { pattern: ["conditioning"], equip: ["machine"] }),
      slot("Prática de flexão", [3, null], { pattern: ["horizontal-push"], equip: ["bodyweight"] }, { prefer: ["push-up"] }),
      slot("Puxada vertical — trabalho de dorsal", [3, null], { pattern: ["vertical-pull"] }),
    ],
  },

  /* Active-recovery day */
  RECOVERY: {
    id: "RECOVERY", name: "Recuperação Ativa", kind: "recovery",
    note: "Genuinamente leve — isto existe para te manter em movimento, não para treinar.",
    slots: [
      slot("Caminhada leve", [null, "40–60 min"], { pattern: ["conditioning"], equip: ["bodyweight"] }),
    ],
  },

  /* Phase 2+ — Upper / Lower split */
  UA: {
    id: "UA", name: "Superior A", kind: "lift",
    slots: [
      slot("Empurrar horizontal — peito", [3, "8–12"], { pattern: ["horizontal-push"], muscle: ["chest"] }),
      slot("Puxada vertical", [3, "8–12"], { pattern: ["vertical-pull"] }),
      slot("Empurrar vertical", [3, "10–12"], { pattern: ["vertical-push"] }),
      slot("Puxar horizontal", [3, "10–12"], { pattern: ["horizontal-pull"] }),
      slot("Tríceps", [2, "12–15"], { muscle: ["triceps"] }, { primary: true }),
      slot("Bíceps", [2, "12–15"], { muscle: ["biceps"] }, { primary: true }),
    ],
  },
  LA: {
    id: "LA", name: "Inferior A", kind: "lift",
    slots: [
      slot("Agachamento — dominância de joelho", [3, "10–12"], { pattern: ["squat"] }),
      slot("Hinge — isquiotibiais", [3, "10–12"], { pattern: ["hinge"], muscle: ["hamstrings"] }),
      slot("Quadríceps — isolamento", [2, "12–15"], { pattern: ["isolation"], muscle: ["quads"] }),
      slot("Panturrilhas", [3, "12–15"], { muscle: ["calves"] }, { primary: true }),
      slot("Core — anti-extensão", [3, null], { pattern: ["core-anti-extension"] }),
    ],
  },
  UB: {
    id: "UB", name: "Superior B", kind: "lift",
    slots: [
      slot("Empurrar horizontal — inclinado", [3, "8–12"], { pattern: ["horizontal-push"] }, { prefer: ["incline"] }),
      slot("Puxada vertical", [3, "8–10"], { pattern: ["vertical-pull"] }),
      slot("Deltoide lateral", [3, "12–15"], { muscle: ["side-delts"] }, { primary: true }),
      slot("Puxar horizontal", [3, "10–12"], { pattern: ["horizontal-pull"] }),
      slot("Deltoide posterior", [2, "12–15"], { muscle: ["rear-delts"] }, { primary: true }),
      slot("Prática de flexão", [2, null], { pattern: ["horizontal-push"], equip: ["bodyweight"] }, { prefer: ["push-up"] }),
    ],
  },
  LB: {
    id: "LB", name: "Inferior B", kind: "lift",
    slots: [
      slot("Agachamento — viés goblet", [3, "8–10"], { pattern: ["squat"] }, { prefer: ["goblet"] }),
      slot("Hinge — glúteos", [3, "10–12"], { pattern: ["hinge"], muscle: ["glutes"] }, { prefer: ["hip-thrust"] }),
      slot("Isquiotibiais — isolamento", [2, "12–15"], { pattern: ["isolation"], muscle: ["hamstrings"] }),
      slot("Panturrilhas", [3, "12–15"], { muscle: ["calves"] }, { primary: true }),
      slot("Core — anti-rotação", [3, null], { pattern: ["core-anti-rotation", "core-anti-extension"] }),
    ],
  },

  /* Phase 3+ — Push / Pull / Legs */
  PUSH: {
    id: "PUSH", name: "Empurrar", kind: "lift",
    slots: [
      slot("Empurrar horizontal — peito", [4, "8–12"], { pattern: ["horizontal-push"], muscle: ["chest"] }),
      slot("Empurrar vertical", [3, "8–12"], { pattern: ["vertical-push"] }),
      slot("Empurrar horizontal — inclinado", [3, "10–12"], { pattern: ["horizontal-push"] }, { prefer: ["incline"] }),
      slot("Deltoide lateral", [3, "12–15"], { muscle: ["side-delts"] }, { primary: true }),
      slot("Tríceps", [2, "12–15"], { muscle: ["triceps"] }, { primary: true }),
      slot("Tríceps", [2, "12–15"], { muscle: ["triceps"] }, { primary: true }),
    ],
  },
  PULL: {
    id: "PULL", name: "Puxar", kind: "lift",
    slots: [
      slot("Puxada vertical", [4, "8–12"], { pattern: ["vertical-pull"] }),
      slot("Puxar horizontal", [3, "8–12"], { pattern: ["horizontal-pull"] }),
      slot("Puxada vertical — assistida / negativa", [3, "quanto conseguir"], { pattern: ["vertical-pull"] }, { prefer: ["assisted", "negative"] }),
      slot("Deltoide posterior", [3, "12–15"], { muscle: ["rear-delts"] }, { primary: true }),
      slot("Bíceps", [2, "12–15"], { muscle: ["biceps"] }, { primary: true }),
      slot("Bíceps", [2, "12–15"], { muscle: ["biceps"] }, { primary: true }),
    ],
  },
  LEGS: {
    id: "LEGS", name: "Pernas", kind: "lift",
    slots: [
      slot("Agachamento — dominância de joelho", [4, "8–12"], { pattern: ["squat"] }),
      slot("Hinge — isquiotibiais", [3, "10–12"], { pattern: ["hinge"], muscle: ["hamstrings"] }),
      slot("Hinge — glúteos", [3, "10–12"], { pattern: ["hinge"], muscle: ["glutes"] }, { prefer: ["hip-thrust"] }),
      slot("Quadríceps — isolamento", [2, "12–15"], { pattern: ["isolation"], muscle: ["quads"] }),
      slot("Isquiotibiais — isolamento", [2, "12–15"], { pattern: ["isolation"], muscle: ["hamstrings"] }),
      slot("Panturrilhas", [3, "12–15"], { muscle: ["calves"] }, { primary: true }),
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
    id: "foundation", n: 1, name: "Fundação", weeks: "Semanas 1–4",
    levelCap: "foundation", rir: "2–3 repetições de reserva", intermediate: false,
    blurb: "Aprenda os padrões, construa uma base. Foco em máquinas, corpo todo, esforço moderado enquanto os movimentos são novos.",
    defaultFrequency: 3,
    frequencies: {
      3: ["FB", REST, "FB", REST, "FB", REST, REST],
      5: ["FB", "CARDIO", "FB", "CARDIO", "FB", REST, REST],
      7: ["FB", "CARDIO", "FB", "CARDIO", "FB", "RECOVERY", "RECOVERY"],
    },
  },
  {
    id: "developing", n: 2, name: "Desenvolvimento", weeks: "Semanas 5–9",
    levelCap: "developing", rir: "1–2 repetições de reserva", intermediate: false,
    blurb: "Mais volume; padrões com pesos livres são introduzidos. O corpo é dividido em Superior / Inferior para cada um ser treinado com mais intensidade.",
    defaultFrequency: 3,
    frequencies: {
      3: [{ rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, REST],
      5: ["UA", "LA", "CARDIO", "UB", "LB", REST, REST],
      7: ["UA", "LA", "UB", "LB", "CARDIO", "RECOVERY", "RECOVERY"],
    },
  },
  {
    id: "intermediate", n: 3, name: "Intermediário", weeks: "Semanas 10–16",
    levelCap: "intermediate", rir: "1–2 repetições de reserva", intermediate: true,
    blurb: "Mais séries totais, compostos com pesos livres mais pesados, variações mais difíceis liberadas. O primeiro bloco favorece uma opção com peso livre.",
    defaultFrequency: 3,
    frequencies: {
      3: [{ rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, REST],
      5: ["PUSH", "PULL", "LEGS", "UB", "LB", REST, REST],
      6: ["PUSH", "PULL", "LEGS", "PUSH", "PULL", "LEGS", REST],
    },
  },
  {
    id: "ongoing", n: 4, name: "Intermediário · Contínuo", weeks: "Semanas 17+",
    levelCap: "intermediate", rir: "1–2 repetições de reserva", intermediate: true,
    blurb: "A estrutura para de mudar; as cargas e a dificuldade dos exercícios continuam subindo. Um modelo intermediário sustentável.",
    defaultFrequency: 4,
    frequencies: {
      3: [{ rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, { rotate: ["UA", "LA", "UB", "LB"] }, REST, REST],
      4: ["UA", "LA", REST, "UB", "LB", REST, REST],
      5: ["PUSH", "PULL", "LEGS", "UB", "LB", REST, REST],
      6: ["PUSH", "PULL", "LEGS", "PUSH", "PULL", "LEGS", REST],
    },
  },
];
