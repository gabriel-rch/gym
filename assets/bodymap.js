/* =============================================================================
   bodymap.js — Phase 1 muscle activation map
   Reusable inline SVG: two stylized silhouettes (anterior + posterior) with
   named muscle regions. muscleMapSVG(ex) returns the inline <svg> for an
   exercise, highlighting the worked muscles (primary = ex.muscle[0], the rest
   assist). Returns "" for cardio entries (muscle: []) so no figure renders.

   Loaded as a classic script between data.js and app.js. No build step.

   The silhouettes and muscle regions are built from smooth cubic-bezier <path>
   shapes so the figure reads as a human body rather than a stack of boxes.
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
  <path class="bm-outline" d="M65,9 C71.5,9 77,15 77,22 C77,29.5 71.5,35 65,35 C58.5,35 53,29.5 53,22 C53,15 58.5,9 65,9 Z"/>
  <path class="bm-outline" d="M59,35 C61,34 69,34 71,35 L72,47 C68,45 62,45 58,47 Z"/>
  <path class="bm-outline" d="M45,48 C55,46 75,46 85,48 C86,66 87,84 86,104 C85,116 82,124 81,136 C82,142 84,146 80,150 L50,150 C46,146 48,142 49,136 C48,124 45,116 44,104 C43,84 44,66 45,48 Z"/>
  <path class="bm-outline" d="M85,49 C92,50 96,55 97,61 C99,72 98,82 99,93 C100,104 100,114 99,124 C97,128 94,130 92,128 L90,123 C92,103 90,82 87,73 C86,66 85,58 85,49 Z"/>
  <path class="bm-outline" d="M45,49 C38,50 34,55 33,61 C31,72 32,82 31,93 C30,104 30,114 31,124 C33,128 36,130 38,128 L40,123 C38,103 40,82 43,73 C44,66 45,58 45,49 Z"/>
  <path class="bm-outline" d="M50,150 C48,164 48,184 48,202 C47,232 46,272 45,293 L61,293 C61,272 62,232 63,202 C63,184 64,166 64,154 Z"/>
  <path class="bm-outline" d="M80,150 C82,164 82,184 82,202 C83,232 84,272 85,293 L69,293 C69,272 68,232 67,202 C67,184 66,166 66,154 Z"/>`;

const FRONT_REGIONS = [
  reg("traps",        '<path d="M56,47 C62,45 68,45 74,47 C72,54 69,57 65,58 C61,57 58,54 56,47 Z"/>'),
  reg("front-delts",  '<path d="M44,46 C38,48 37,54 39,60 C42,61 46,60 47,56 C48,50 47,47 44,46 Z"/>'),
  reg("front-delts",  '<path d="M86,46 C92,48 93,54 91,60 C88,61 84,60 83,56 C82,50 83,47 86,46 Z"/>'),
  reg("side-delts",   '<path d="M36,45 C32,47 32,53 34,55 C37,56 40,54 40,50 C40,47 38,45 36,45 Z"/>'),
  reg("side-delts",   '<path d="M94,45 C98,47 98,53 96,55 C93,56 90,54 90,50 C90,47 92,45 94,45 Z"/>'),
  reg("chest",        '<path d="M48,58 C56,57 62,59 64,60 C64,70 61,76 57,78 C52,77 48,72 47,66 C47,61 47,59 48,58 Z"/>'),
  reg("chest",        '<path d="M82,58 C74,57 68,59 66,60 C66,70 69,76 73,78 C78,77 82,72 83,66 C83,61 83,59 82,58 Z"/>'),
  reg("biceps",       '<path d="M37,70 C42,72 43,82 42,92 C41,98 36,98 34,92 C32,82 34,72 37,70 Z"/>'),
  reg("biceps",       '<path d="M93,70 C88,72 87,82 88,92 C89,98 94,98 96,92 C98,82 96,72 93,70 Z"/>'),
  reg("forearms",     '<path d="M33,96 C38,98 38,110 36,122 C34,128 30,128 30,122 C29,110 29,100 32,96 Z"/>'),
  reg("forearms",     '<path d="M97,96 C92,98 92,110 94,122 C96,128 100,128 100,122 C101,110 101,100 98,96 Z"/>'),
  reg("abs",          '<path d="M58,81 C64,80 70,80 74,81 C75,86 75,120 74,122 C70,123 62,123 58,122 C57,120 57,86 58,81 Z"/>'),
  reg("obliques",     '<path d="M50,82 C53,83 55,86 55,92 C56,104 55,114 54,113 C51,112 50,106 49,95 C49,89 49,84 50,82 Z"/>'),
  reg("obliques",     '<path d="M80,82 C77,83 75,86 75,92 C74,104 75,114 76,113 C79,112 80,106 81,95 C81,89 81,84 80,82 Z"/>'),
  reg("quads",        '<path d="M52,156 C58,157 61,162 62,172 C64,200 61,230 58,252 C55,256 52,252 51,244 C47,200 49,170 49,162 C49,158 50,156 52,156 Z"/>'),
  reg("quads",        '<path d="M78,156 C72,157 69,162 68,172 C66,200 69,230 72,252 C75,256 78,252 79,244 C83,200 81,170 81,162 C81,158 80,156 78,156 Z"/>'),
  reg("adductors",    '<path d="M61,156 C64,156 66,156 69,156 C69,180 66,210 65,210 C64,210 61,180 61,168 Z"/>'),
  reg("calves",       '<path d="M50,250 C55,252 57,260 56,272 C58,288 54,293 51,291 C48,288 46,268 47,258 C48,252 49,250 50,250 Z"/>'),
  reg("calves",       '<path d="M80,250 C75,252 73,260 74,272 C72,288 76,293 79,291 C82,288 84,268 83,258 C82,252 81,250 80,250 Z"/>'),
].join("");

/* --- back (posterior) regions, figure centered ~ x=195 ------------------- */
const BACK_OUTLINE = `
  <path class="bm-hair" d="M195,9 C201.5,9 207,15 207,22 C207,29.5 201.5,35 195,35 C188.5,35 183,29.5 183,22 C183,15 188.5,9 195,9 Z"/>
  <path class="bm-outline" d="M189,35 C191,34 199,34 201,35 L202,47 C198,45 192,45 188,47 Z"/>
  <path class="bm-outline" d="M175,48 C185,46 205,46 215,48 C216,66 217,84 216,104 C215,116 212,124 211,136 C212,142 214,146 210,150 L180,150 C176,146 178,142 179,136 C178,124 175,116 174,104 C173,84 174,66 175,48 Z"/>
  <path class="bm-outline" d="M215,49 C222,50 226,55 227,61 C229,72 228,82 229,93 C230,104 230,114 229,124 C227,128 224,130 222,128 L220,123 C222,103 220,82 217,73 C216,66 215,58 215,49 Z"/>
  <path class="bm-outline" d="M175,49 C168,50 164,55 163,61 C161,72 162,82 161,93 C160,104 160,114 161,124 C163,128 166,130 168,128 L170,123 C168,103 170,82 173,73 C174,66 175,58 175,49 Z"/>
  <path class="bm-outline" d="M180,150 C178,164 178,184 178,202 C177,232 176,272 175,293 L191,293 C191,272 192,232 193,202 C193,184 194,166 194,154 Z"/>
  <path class="bm-outline" d="M210,150 C212,164 212,184 212,202 C213,232 214,272 215,293 L199,293 C199,272 198,232 197,202 C197,184 196,166 196,154 Z"/>`;

const BACK_REGIONS = [
  reg("traps",        '<path d="M186,47 C192,45 198,45 204,47 C202,54 199,57 195,58 C191,57 188,54 186,47 Z"/>'),
  reg("rear-delts",   '<path d="M176,48 C170,50 169,56 171,62 C174,63 178,62 179,58 C180,52 179,49 176,48 Z"/>'),
  reg("rear-delts",   '<path d="M214,48 C220,50 221,56 219,62 C216,63 212,62 211,58 C210,52 211,49 214,48 Z"/>'),
  reg("side-delts",   '<path d="M166,45 C162,47 162,53 164,55 C167,56 170,54 170,50 C170,47 168,45 166,45 Z"/>'),
  reg("side-delts",   '<path d="M224,45 C228,47 228,53 226,55 C223,56 220,54 220,50 C220,47 222,45 224,45 Z"/>'),
  reg("upper-back",   '<path d="M179,58 C191,56 199,56 211,58 C209,70 207,84 205,86 C198,86 192,86 185,86 C182,84 180,70 179,58 Z"/>'),
  reg("lats",         '<path d="M181,86 C188,84 194,84 196,86 C195,104 190,126 188,128 C186,126 183,110 181,92 Z"/>'),
  reg("lats",         '<path d="M209,86 C202,84 196,84 194,86 C195,104 200,126 202,128 C204,126 207,110 209,92 Z"/>'),
  reg("triceps",      '<path d="M167,74 C172,76 173,86 172,96 C171,102 166,102 164,96 C162,86 164,76 167,74 Z"/>'),
  reg("triceps",      '<path d="M223,74 C218,76 217,86 218,96 C219,102 224,102 226,96 C228,86 226,76 223,74 Z"/>'),
  reg("forearms",     '<path d="M163,96 C168,98 168,110 166,122 C164,128 160,128 160,122 C159,110 159,100 162,96 Z"/>'),
  reg("forearms",     '<path d="M227,96 C222,98 222,110 224,122 C226,128 230,128 230,122 C231,110 231,100 228,96 Z"/>'),
  reg("lower-back",   '<path d="M186,120 C195,119 204,120 206,121 C207,130 207,140 206,142 C200,143 190,143 184,142 C183,140 183,126 186,120 Z"/>'),
  reg("glutes",       '<path d="M186,138 C193,140 195,150 192,160 C189,164 184,164 182,160 C179,150 181,140 186,138 Z"/>'),
  reg("glutes",       '<path d="M204,138 C197,140 195,150 198,160 C201,164 206,164 208,160 C211,150 209,140 204,138 Z"/>'),
  reg("hamstrings",   '<path d="M183,156 C189,157 192,162 193,172 C195,200 192,230 189,252 C186,256 183,252 182,244 C178,200 180,170 180,162 C180,158 181,156 183,156 Z"/>'),
  reg("hamstrings",   '<path d="M207,156 C201,157 198,162 197,172 C195,200 198,230 201,252 C204,256 207,252 208,244 C212,200 210,170 210,162 C210,158 209,156 207,156 Z"/>'),
  reg("calves",       '<path d="M182,250 C189,252 191,262 190,274 C191,290 186,293 183,291 C180,288 179,270 180,258 C181,252 181,250 182,250 Z"/>'),
  reg("calves",       '<path d="M208,250 C201,252 199,262 200,274 C199,290 204,293 207,291 C210,288 211,270 210,258 C209,252 209,250 208,250 Z"/>'),
].join("");

/* The full SVG template. The two figures sit side by side in a 290x300 viewBox.
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