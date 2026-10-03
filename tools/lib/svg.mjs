/**
 * Shared machinery for the project's animated SVG diagrams.
 *
 * Each diagram is one looping CSS timeline. Every element needs @keyframes
 * expressed as percentages of that loop, and every element also needs a
 * `prefers-reduced-motion` state — because turning the animation off is not
 * enough: without a still frame, all of a diagram's phases render stacked on
 * top of each other.
 *
 * Doing that arithmetic by hand rots the first time anyone changes a duration,
 * so it lives here and the generators only describe content.
 */

/** Palette, sampled from the course's own context-window diagram. */
export const C = {
  bg: '#121212',
  text: '#d3d3d3',
  muted: '#a3a3a3',
  faint: '#6f6f6f',
  frame: '#d3d3d3',
  white: '#ffffff',
  panel: '#191919',
  panelAlt: '#1b1b1b',
  track: '#242424',
  blue: '#56a2e8',
  blueFill: '#152a3a',
  blueHatch: '#1d3f5c',
  green: '#3a9a4b',
  greenFill: '#152c1a',
  greenHatch: '#1f4a2a',
  orange: '#b86101',
  orangeFill: '#2e1b06',
  orangeHatch: '#4d2f08',
  red: '#ff8383',
  redFill: '#361f1f',
  redHatch: '#5a2c2c',
};

export const STROKE = { blue: C.blue, green: C.green, orange: C.orange, red: C.red };

export const FONT =
  "'Segoe UI',system-ui,-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif";

/**
 * 70 seconds, which is 35 played at half speed.
 *
 * 35s fits a demo narration script, but it is not enough time to *read* a
 * diagram: each beat was gone before the eye had finished the line under it.
 * Doubling the cycle leaves the pacing and the proportions untouched — every
 * frame still arrives at the same point in the story — and gives a viewer about
 * twice as long on each one.
 */
export const CYCLE = 70;

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Diagonal hatch fills matching the course diagram, one per colour. */
export function hatchPatterns(kinds = ['blue', 'green', 'orange', 'red']) {
  return kinds
    .map(
      (k) =>
        `<pattern id="hatch-${k}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
        `<rect width="7" height="7" fill="${C[`${k}Fill`]}"/>` +
        `<line x1="0" y1="0" x2="0" y2="7" stroke="${C[`${k}Hatch`]}" stroke-width="3.2"/>` +
        `</pattern>`,
    )
    .join('');
}

/**
 * A timeline authored in "design seconds" and played back over `cycle`.
 *
 * Keyframe percentages are computed against `design`, while the animation's
 * duration is `cycle`, so changing the playback length stretches everything
 * evenly rather than leaving dead air at the end.
 *
 * @param {object} options
 * @param {number} options.design length the timeline is authored against
 * @param {number} options.ends when everything fades, for the loop
 * @param {number} [options.cycle] playback duration
 */
export function timeline({ design, ends, cycle = CYCLE }) {
  const css = [];
  const still = [];
  let uid = 0;

  const pct = (t) => `${((t / design) * 100).toFixed(3)}%`;
  const anim = (name) => `.${name}{animation:${name} ${cycle}s linear infinite both;}`;

  /** Fade in at `tIn`, hold until `tOut`. */
  function fade(tIn, tOut = ends, { rise = 0, hold = 1, cut = false } = {}) {
    const name = `f${uid++}`;
    // `cut` swaps instantly instead of crossfading, for things like a running
    // counter where a 0.5s fade leaves two values on screen at once.
    const inEnd = cut ? tIn + 0.001 : tIn + 0.5;
    const outEnd = Math.min(tOut + (cut ? 0.001 : 0.5), design);
    const from = rise ? `opacity:0;transform:translateY(${rise}px)` : 'opacity:0';
    const to = rise ? `opacity:${hold};transform:translateY(0)` : `opacity:${hold}`;
    css.push(
      `@keyframes ${name}{0%,${pct(tIn)}{${from}}` +
        `${pct(inEnd)},${pct(tOut)}{${to}}` +
        `${pct(outEnd)},100%{opacity:0}}`,
    );
    css.push(anim(name));
    still.push(`.${name}{opacity:${tOut >= ends - 0.05 ? hold : 0} !important}`);
    return name;
  }

  /** Fade in, then dim to `to` at `tDim` and stay there. */
  function fadeDim(tIn, tDim, to, { stillOpacity = 1 } = {}) {
    const name = `d${uid++}`;
    css.push(
      `@keyframes ${name}{0%,${pct(tIn)}{opacity:0}` +
        `${pct(tIn + 0.5)},${pct(tDim)}{opacity:1}` +
        `${pct(tDim + 1.1)},${pct(ends)}{opacity:${to}}` +
        `${pct(ends + 0.5)},100%{opacity:0}}`,
    );
    css.push(anim(name));
    still.push(`.${name}{opacity:${stillOpacity} !important}`);
    return name;
  }

  /**
   * A bar or gauge that grows through [time, fraction] stops.
   *
   * The final level is held explicitly to the end. Without that hold, CSS
   * interpolates from the last stop straight to the reset keyframe and the bar
   * visibly drains back to empty over the rest of the loop.
   */
  function gauge(len, stops, tStart) {
    const name = `g${uid++}`;
    const frames = [`0%,${pct(tStart)}{stroke-dashoffset:${len.toFixed(2)}}`];
    for (const [t, frac] of stops) {
      frames.push(`${pct(t)}{stroke-dashoffset:${(len * (1 - frac)).toFixed(2)}}`);
    }
    const held = len * (1 - stops.at(-1)[1]);
    frames.push(`${pct(ends)}{stroke-dashoffset:${held.toFixed(2)}}`);
    frames.push(`${pct(ends + 0.5)},100%{stroke-dashoffset:${len.toFixed(2)}}`);
    css.push(`@keyframes ${name}{${frames.join('')}}`);
    css.push(
      `.${name}{stroke-dasharray:${len.toFixed(2)};stroke-dashoffset:${len.toFixed(2)};` +
        `animation:${name} ${cycle}s linear infinite both;}`,
    );
    still.push(`.${name}{stroke-dashoffset:${held.toFixed(2)} !important}`);
    return name;
  }

  /**
   * Draw a path on by animating its dash offset.
   *
   * Opacity is pinned to 1 on every stop before the last. Declaring it only on
   * the closing keyframe is not the same thing: CSS then interpolates it from
   * the element's base opacity at 0% all the way down, so the path spends the
   * whole cycle fading out and arrives at its "finished" moment nearly
   * invisible.
   */
  function draw(len, tIn, tOut = ends, { dur = 1.4 } = {}) {
    const name = `w${uid++}`;
    css.push(
      `@keyframes ${name}{0%,${pct(tIn)}{stroke-dashoffset:${len};opacity:1}` +
        `${pct(tIn + dur)},${pct(tOut)}{stroke-dashoffset:0;opacity:1}` +
        `${pct(tOut + 0.5)},100%{stroke-dashoffset:${len};opacity:0}}`,
    );
    css.push(
      `.${name}{stroke-dasharray:${len};stroke-dashoffset:${len};` +
        `animation:${name} ${cycle}s linear infinite both;}`,
    );
    still.push(
      `.${name}{stroke-dashoffset:0 !important;opacity:${tOut >= ends - 0.05 ? 1 : 0} !important}`,
    );
    return name;
  }

  /** A pulse that runs only between two times. */
  function pulse(tIn, tOut, { from = 1, to = 2.6, beat = 1.2 } = {}) {
    const name = `p${uid++}`;
    const frames = [`0%,${pct(tIn)}{stroke-width:${from};opacity:0}`];
    let t = tIn;
    let i = 0;
    // Every stop is clamped to tOut and the loop stops before a beat would
    // overrun it, or the closing frame goes backwards and the keyframes end up
    // out of order.
    while (t + beat / 2 < tOut) {
      frames.push(`${pct(t + beat / 2)}{stroke-width:${to};opacity:0.95}`);
      frames.push(`${pct(Math.min(t + beat, tOut))}{stroke-width:${from};opacity:0.35}`);
      t += beat;
      if (++i > 12) break;
    }
    frames.push(`${pct(Math.min(tOut + 0.4, design))},100%{opacity:0;stroke-width:${from}}`);
    css.push(`@keyframes ${name}{${frames.join('')}}`);
    css.push(anim(name));
    still.push(`.${name}{opacity:0 !important}`);
    return name;
  }

  return {
    css,
    still,
    pct,
    fade,
    fadeDim,
    gauge,
    draw,
    pulse,
    get count() {
      return uid;
    },
  };
}

/**
 * Greedy word wrap to `max` characters a line.
 *
 * SVG has no text flow, so every line is its own `<text>` and the break points
 * have to be decided here. `max` is a character budget, not pixels: pick it
 * from the font size and the box width (see `CHAR_RATIO`).
 *
 * A single word longer than `max` is split rather than left to overflow its
 * box. `references/evidence.md` is one word to a naive wrapper, and it ran off
 * the end of its card on the published diagram until this existed. The split
 * prefers a path or hyphen boundary so the break reads as deliberate.
 */
export function wrap(s, max) {
  const lines = [];
  let line = '';
  const push = () => {
    if (line) lines.push(line);
    line = '';
  };
  for (const word of String(s).split(/\s+/).filter(Boolean)) {
    for (const piece of splitLongWord(word, max)) {
      if (!line) line = piece;
      else if (line.length + 1 + piece.length <= max) line += ` ${piece}`;
      else {
        push();
        line = piece;
      }
    }
  }
  push();
  return lines;
}

/** Break one over-long word, preferring a path separator, then a hyphen. */
function splitLongWord(word, max) {
  if (word.length <= max) return [word];
  const out = [];
  let rest = word;
  while (rest.length > max) {
    // Keep the separator on the end of the first part, so the break reads as
    // "references/" + "evidence.md" rather than losing the slash. A path
    // separator wins over a hyphen: "docs/" + "demo-script.md" beats
    // "docs/demo-" + "script.md".
    const slash = rest.lastIndexOf('/', max);
    const boundary = slash > 0 ? slash : rest.lastIndexOf('-', max);
    const cut = boundary > 0 ? boundary + 1 : max;
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest) out.push(rest);
  return out;
}

/**
 * How wide a character is, as a fraction of the font size, for the project's
 * sans-serif.
 *
 * Measured with `getComputedTextLength` in the browser, not estimated: a
 * guessed 0.52 predicted 110px for a string that renders at 130px, which is how
 * `references/evidence.md` came to hang out of its card on the published
 * diagram. Semibold text and lowercase paths sit near 0.62; regular body text
 * nearer 0.55.
 */
export const CHAR_RATIO = { bold: 0.62, regular: 0.55 };

/** Characters that fit `width` pixels at `size`, for use as a wrap budget. */
export function charBudget(width, size, ratio = CHAR_RATIO.bold) {
  return Math.max(4, Math.floor(width / (size * ratio)));
}

/**
 * The largest font size at which every line fits `width` pixels, capped at
 * `size`.
 *
 * The character budget passed to `wrap` is an estimate, so it is possible to
 * get a line that is one or two characters too wide for its box. This is the
 * backstop that makes an overflow impossible rather than unlikely.
 */
export function fitSize(lines, width, size, { min = 6.5, ratio = CHAR_RATIO.bold } = {}) {
  const longest = lines.reduce((n, l) => Math.max(n, l.length), 0);
  if (!longest) return size;
  return Math.max(min, Math.min(size, width / (longest * ratio)));
}

/** A `<text>` element with the project's defaults. */
export function text(
  x,
  y,
  s,
  { size = 12, fill = C.text, anchor = 'start', weight = 400, cls = '', op = 1, ls = 0 } = {},
) {
  return (
    `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"` +
    `${weight !== 400 ? ` font-weight="${weight}"` : ''}${op !== 1 ? ` opacity="${op}"` : ''}` +
    `${ls ? ` letter-spacing="${ls}"` : ''}${cls ? ` class="${cls}"` : ''}>${esc(s)}</text>`
  );
}

/**
 * Wrap a diagram up as a complete, self-contained SVG.
 *
 * Nothing is fetched over the network and no script runs, because GitHub serves
 * these through a sanitiser and anything clever silently stops working.
 */
export function assemble({ width, height, title, desc, defs = '', css, still, body }) {
  // A diagram with no timeline needs no reduced-motion block. Emitting one
  // anyway left `animation:none !important` in a card that has nothing to
  // animate — dead CSS, and enough to make "is this static?" unanswerable by
  // reading the file.
  const animated = css.length > 0 || still.length > 0;
  const reduced = animated
    ? `@media (prefers-reduced-motion:reduce){*{animation:none !important}` + still.join('') + `}`
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"` +
    ` width="${width}" height="${height}" role="img" aria-labelledby="title desc">` +
    `<title id="title">${esc(title)}</title>` +
    `<desc id="desc">${esc(desc)}</desc>` +
    `<defs>${defs}</defs>` +
    `<style>text{font-family:${FONT}}` +
    css.join('') +
    reduced +
    `</style>` +
    `<rect width="${width}" height="${height}" fill="${C.bg}"/>` +
    body.join('') +
    `</svg>\n`
  );
}
