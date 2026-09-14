import { createThemeSemanticColors, type ThemeMode } from "./themeColor";

/**
 * Apply application semantic roles and Element Plus compatibility scales in a
 * single place. The brand seed remains persisted separately from these values.
 */
export function applyAppTheme(
  root: HTMLElement,
  seed: string,
  mode: ThemeMode
) {
  const colors = createThemeSemanticColors(seed, mode);
  const properties: Record<string, string> = {
    "--app-primary-solid": colors.primarySolid,
    "--app-on-primary": colors.onPrimary,
    "--app-accent-foreground": colors.accentForeground,
    "--app-accent-container": colors.accentContainer,
    "--app-on-accent-container": colors.onAccentContainer,
    "--app-accent-border": colors.accentBorder,
    "--app-hover-surface": colors.hoverSurface,
    "--app-focus-ring": colors.focusRing,
    // Element Plus still owns its component-level colour system. Its primary
    // entry point is the readable accent, while its soft variants end at the
    // active appearance surface rather than a blindly darkened seed.
    "--el-color-primary": colors.elementPrimary,
    "--pure-menu-active-text-color": colors.accentForeground
  };

  colors.elementDark.forEach((value, index) => {
    properties[`--el-color-primary-dark-${index + 1}`] = value;
  });
  colors.elementLight.forEach((value, index) => {
    properties[`--el-color-primary-light-${index + 1}`] = value;
  });

  Object.entries(properties).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  return colors;
}
