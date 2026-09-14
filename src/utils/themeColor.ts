/**
 * Colour primitives and semantic-token generation for application themes.
 * Theme colours are brand seeds; contrast-sensitive UI roles are calculated
 * independently for each appearance mode.
 */

export type ThemeMode = "light" | "dark";

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface ThemeSemanticColors {
  primarySolid: string;
  onPrimary: string;
  accentForeground: string;
  accentContainer: string;
  onAccentContainer: string;
  accentBorder: string;
  hoverSurface: string;
  focusRing: string;
  elementPrimary: string;
  elementLight: string[];
  elementDark: string[];
}

const WHITE = "#ffffff";
const BLACK = "#000000";
const LIGHT_SURFACE = WHITE;
const DARK_SURFACE = "#141414";

function clamp(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

/** Convert a #rgb or #rrggbb colour to RGB. */
export function hexToRgb(color: string): RgbColor {
  const value = color.trim().replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map(item => item + item)
          .join("")
      : value;

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    throw new Error(`Invalid hex colour: ${color}`);
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

export function rgbToHex({ r, g, b }: RgbColor) {
  return `#${[r, g, b]
    .map(value => clamp(value).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Mix `foreground` over `background` with an opaque alpha in [0, 1]. */
export function mixColors(
  foreground: string,
  background: string,
  alpha: number
) {
  const foregroundRgb = hexToRgb(foreground);
  const backgroundRgb = hexToRgb(background);
  const weight = Math.min(1, Math.max(0, alpha));

  return rgbToHex({
    r: foregroundRgb.r * weight + backgroundRgb.r * (1 - weight),
    g: foregroundRgb.g * weight + backgroundRgb.g * (1 - weight),
    b: foregroundRgb.b * weight + backgroundRgb.b * (1 - weight)
  });
}

function linearChannel(channel: number) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance. */
export function relativeLuminance(color: string) {
  const { r, g, b } = hexToRgb(color);
  return (
    0.2126 * linearChannel(r) +
    0.7152 * linearChannel(g) +
    0.0722 * linearChannel(b)
  );
}

/** WCAG contrast ratio, from 1 through 21. */
export function contrastRatio(first: string, second: string) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

/** Select the more readable black/white foreground for a background. */
export function readableForeground(background: string) {
  return contrastRatio(WHITE, background) >= contrastRatio(BLACK, background)
    ? WHITE
    : BLACK;
}

/**
 * Move a colour towards white or black until it meets the requested contrast
 * against a surface.  The least visual adjustment that works is retained.
 */
export function ensureContrast(color: string, surface: string, minimum = 4.5) {
  if (contrastRatio(color, surface) >= minimum) return color;

  const targets = [WHITE, BLACK];
  let candidate = color;
  let adjustment = Infinity;

  targets.forEach(target => {
    if (contrastRatio(target, surface) < minimum) return;

    let lower = 0;
    let upper = 1;
    for (let index = 0; index < 24; index += 1) {
      const middle = (lower + upper) / 2;
      const mixed = mixColors(target, color, middle);
      if (contrastRatio(mixed, surface) >= minimum) upper = middle;
      else lower = middle;
    }

    if (upper < adjustment) {
      adjustment = upper;
      candidate = mixColors(target, color, upper);
    }
  });

  return candidate;
}

function createElementScales(accent: string, surface: string, mode: ThemeMode) {
  const light = Array.from({ length: 9 }, (_, index) => {
    const level = index + 1;
    // light-1 stays close to the accent; light-9 resolves into the current
    // surface, so soft Element Plus variants never turn into near-black fills.
    const surfaceWeight = mode === "dark" ? level / 10 : level / 10;
    return mixColors(surface, accent, surfaceWeight);
  });
  const dark = [mixColors(BLACK, accent, 0.15), mixColors(BLACK, accent, 0.3)];
  return { light, dark };
}

/** Build contrast-safe application roles from a brand seed and appearance mode. */
export function createThemeSemanticColors(
  seed: string,
  mode: ThemeMode
): ThemeSemanticColors {
  const surface = mode === "dark" ? DARK_SURFACE : LIGHT_SURFACE;
  const accentForeground = ensureContrast(seed, surface, 4.5);
  // The brand seed is the starting point; solid buttons keep white text and
  // make only the minimum tonal adjustment needed for that foreground.
  const onPrimary = WHITE;
  const readableSolid = ensureContrast(seed, onPrimary, 4.5);
  const primarySolid =
    mode === "dark" ? ensureContrast(readableSolid, surface, 3) : readableSolid;
  const accentContainer =
    mode === "dark"
      ? mixColors(accentForeground, surface, 0.24)
      : mixColors(accentForeground, surface, 0.14);
  const onAccentContainer = ensureContrast(
    accentForeground,
    accentContainer,
    4.5
  );
  const accentBorder = ensureContrast(
    mode === "dark"
      ? mixColors(accentForeground, surface, 0.62)
      : mixColors(accentForeground, surface, 0.48),
    surface,
    3
  );
  const hoverSurface =
    mode === "dark"
      ? mixColors(WHITE, surface, 0.08)
      : mixColors(BLACK, surface, 0.04);
  const focusRing = ensureContrast(accentForeground, surface, 3);
  const scales = createElementScales(accentForeground, surface, mode);

  return {
    primarySolid,
    onPrimary,
    accentForeground,
    accentContainer,
    onAccentContainer,
    accentBorder,
    hoverSurface,
    focusRing,
    elementPrimary: accentForeground,
    elementLight: scales.light,
    elementDark: scales.dark
  };
}
