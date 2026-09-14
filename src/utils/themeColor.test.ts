import assert from "node:assert/strict";
import test from "node:test";
import {
  contrastRatio,
  createThemeSemanticColors,
  type ThemeMode
} from "./themeColor.ts";

const themeSeeds = [
  "#034EA2",
  "#0284C7",
  "#0F766E",
  "#15803D",
  "#1E3A5F",
  "#57534E"
];

const surfaceByMode: Record<ThemeMode, string> = {
  light: "#ffffff",
  dark: "#141414"
};

function assertAtLeast(actual: number, expected: number, message: string) {
  // RGB values are rounded when a generated colour is serialised to hex.
  assert.ok(actual >= expected - 0.01, `${message}: ${actual.toFixed(2)}:1`);
}

for (const mode of ["light", "dark"] as const) {
  for (const seed of themeSeeds) {
    test(`${mode} semantic colours remain readable for ${seed}`, () => {
      const surface = surfaceByMode[mode];
      const colors = createThemeSemanticColors(seed, mode);
      assert.equal(colors.onPrimary, "#ffffff");

      assertAtLeast(
        contrastRatio(colors.accentForeground, surface),
        4.5,
        "accent foreground against surface"
      );
      assertAtLeast(
        contrastRatio(colors.onAccentContainer, colors.accentContainer),
        4.5,
        "selected menu text against its container"
      );
      assertAtLeast(
        contrastRatio(colors.onPrimary, colors.primarySolid),
        4.5,
        "solid primary foreground"
      );
      assertAtLeast(
        contrastRatio(colors.primarySolid, surface),
        3,
        "solid primary against surface"
      );
      assertAtLeast(
        contrastRatio(colors.accentBorder, surface),
        3,
        "accent border against surface"
      );
      assertAtLeast(
        contrastRatio(colors.focusRing, surface),
        3,
        "focus ring against surface"
      );
      assert.equal(colors.elementLight.length, 9);
      assert.equal(colors.elementDark.length, 2);
    });
  }
}
