/* =============================================================================
   bodymap.js — Phase 1 muscle activation map
   Reusable inline SVG: two stylized silhouettes (anterior + posterior) with
   named muscle regions. muscleMapSVG(ex) returns the inline <svg> for an
   exercise, highlighting the worked muscles (primary = ex.muscle[0], the rest
   assist). Returns "" for cardio entries (muscle: []) so no figure renders.

   Loaded as a classic script between data.js and app.js. No build step.
   ========================================================================== */

/* Full muscle vocabulary (from TAG_DIMENSIONS / reference). */
const MUSCLE_VOCAB = [
  "chest", "lats", "upper-back", "traps", "rear-delts", "side-delts",
  "front-delts", "biceps", "triceps", "forearms", "quads", "hamstrings",
  "glutes", "adductors", "calves", "abs", "obliques", "lower-back",
];

/* A local label helper so bodymap.js stays self-contained (TAG_LABELS lives
   in data.js which is already loaded before us). */
function bmLabel(v) {
  return TAG_LABELS[v] || v.replace(/-/g, " ");
}

/* One shape with the muscle tag. Each region is a single SVG element carrying
   class="bm-region" data-muscle="<tag>" so CSS can re-color it and JS can flip
   the data-active state after rendering. */
function reg(muscle, shape) {
  // inject the class/data attributes onto the leading element tag.
  return shape.replace(/^(\s*<\w+)/, `$1 class="bm-region" data-muscle="${muscle}"`);
}

/* --- front (anterior) regions, figure centered ~ x=65 -------------------- */
const FRONT_OUTLINE = `
  <circle class="bm-outline" cx="65" cy="22" r="11"/>
  <rect class="bm-outline" x="59" y="32" width="12" height="6"/>
  <path class="bm-outline" d="M44,46 L86,46 L82,150 L48,150 Z"/>
  <path class="bm-outline" d="M44,48 L34,50 L30,124 L36,126 L42,72 Z"/>
  <path class="bm-outline" d="M86,48 L96,50 L100,124 L94,126 L88,72 Z"/>
  <path class="bm-outline" d="M50,150 L44,292 L60,292 L64,152 Z"/>
  <path class="bm-outline" d="M82,150 L88,292 L72,292 L68,152 Z"/>`;

const FRONT_REGIONS = [
  reg("traps",        '<polygon points="56,46 74,46 70,56 60,56"/>'),
  reg("front-delts",  '<circle cx="44" cy="52" r="7"/>'),
  reg("front-delts",  '<circle cx="86" cy="52" r="7"/>'),
  reg("side-delts",   '<circle cx="36" cy="50" r="5"/>'),
  reg("side-delts",   '<circle cx="94" cy="50" r="5"/>'),
  reg("chest",        '<polygon points="46,58 84,58 82,76 48,76"/>'),
  reg("biceps",       '<ellipse cx="37" cy="84" rx="6" ry="15"/>'),
  reg("biceps",       '<ellipse cx="93" cy="84" rx="6" ry="15"/>'),
  reg("forearms",     '<ellipse cx="33" cy="112" rx="5" ry="16"/>'),
  reg("forearms",     '<ellipse cx="97" cy="112" rx="5" ry="16"/>'),
  reg("abs",          '<rect x="56" y="80" width="18" height="42" rx="3"/>'),
  reg("obliques",     '<rect x="50" y="82" width="6" height="30" rx="1"/>'),
  reg("obliques",     '<rect x="74" y="82" width="6" height="30" rx="1"/>'),
  reg("quads",        '<ellipse cx="55" cy="195" rx="7" ry="40"/>'),
  reg("quads",        '<ellipse cx="77" cy="195" rx="7" ry="40"/>'),
  reg("adductors",    '<polygon points="60,158 72,158 69,200 63,200"/>'),
  reg("calves",       '<ellipse cx="53" cy="270" rx="6" ry="22"/>'),
  reg("calves",       '<ellipse cx="79" cy="270" rx="6" ry="22"/>'),
].join("");

/* --- back (posterior) regions, figure centered ~ x=195 ------------------- */
const BACK_OUTLINE = `
  <circle class="bm-hair" cx="195" cy="22" r="11"/>
  <rect class="bm-outline" x="189" y="32" width="12" height="6"/>
  <path class="bm-outline" d="M176,46 L214,46 L210,150 L180,150 Z"/>
  <path class="bm-outline" d="M176,48 L166,50 L162,124 L168,126 L174,72 Z"/>
  <path class="bm-outline" d="M214,48 L224,50 L228,124 L222,126 L216,72 Z"/>
  <path class="bm-outline" d="M182,150 L176,292 L192,292 L196,152 Z"/>
  <path class="bm-outline" d="M208,150 L214,292 L198,292 L194,152 Z"/>`;

const BACK_REGIONS = [
  reg("traps",        '<polygon points="186,46 204,46 202,56 188,56"/>'),
  reg("rear-delts",   '<circle cx="176" cy="54" r="7"/>'),
  reg("rear-delts",   '<circle cx="214" cy="54" r="7"/>'),
  reg("side-delts",   '<circle cx="168" cy="52" r="5"/>'),
  reg("side-delts",   '<circle cx="222" cy="52" r="5"/>'),
  reg("upper-back",   '<polygon points="178,58 212,58 208,84 182,84"/>'),
  reg("lats",         '<polygon points="182,84 208,84 204,124 186,124"/>'),
  reg("triceps",      '<ellipse cx="167" cy="88" rx="6" ry="15"/>'),
  reg("triceps",      '<ellipse cx="225" cy="88" rx="6" ry="15"/>'),
  reg("forearms",     '<ellipse cx="165" cy="114" rx="5" ry="16"/>'),
  reg("forearms",     '<ellipse cx="227" cy="114" rx="5" ry="16"/>'),
  reg("lower-back",   '<rect x="184" y="120" width="22" height="22" rx="2"/>'),
  reg("glutes",       '<ellipse cx="186" cy="150" rx="9" ry="12"/>'),
  reg("glutes",       '<ellipse cx="204" cy="150" rx="9" ry="12"/>'),
  reg("hamstrings",   '<ellipse cx="186" cy="195" rx="7" ry="40"/>'),
  reg("hamstrings",   '<ellipse cx="204" cy="195" rx="7" ry="40"/>'),
  reg("calves",       '<ellipse cx="185" cy="270" rx="6" ry="22"/>'),
  reg("calves",       '<ellipse cx="205" cy="270" rx="6" ry="22"/>'),
].join("");

/* The full SVG template. The two figures sit side by side in a 260x300 viewBox.
   Decorative inner graphics are wrapped in aria-hidden; the <svg> carries the
   role="img" + accessible label. */
const BODY_SVG = `<svg class="bodymap" role="img" aria-label="" viewBox="0 0 290 300" xmlns="http://www.w3.org/2000/svg">
  <g aria-hidden="true">
    <g class="bm-view bm-front">${FRONT_OUTLINE}${FRONT_REGIONS}</g>
    <g class="bm-view bm-back" transform="translate(30,0)">${BACK_OUTLINE}${BACK_REGIONS}</g>
  </g>
</svg>`;

/* Returns the inline SVG string for an exercise, with worked muscles
   highlighted. Returns "" when there are no muscles (cardio) — mirroring the
   existing ex.desc branch so nothing renders there. */
function muscleMapSVG(ex) {
  const muscles = (ex.muscle || []).filter((m) => MUSCLE_VOCAB.includes(m));
  if (!muscles.length) return "";

  let svg = BODY_SVG;
  muscles.forEach((m, i) => {
    const state = i === 0 ? "primary" : "assist";
    svg = svg.split(`data-muscle="${m}"`).join(`data-muscle="${m}" data-active="${state}"`);
  });

  const label = "Músculos trabalhados: " +
    muscles.map((m, i) => i === 0 ? `${bmLabel(m)} (primário)` : bmLabel(m)).join(", ");
  return svg.replace('aria-label=""', `aria-label="${label}"`);
}