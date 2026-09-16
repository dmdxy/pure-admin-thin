import { mixColors, type ThemeMode } from "@/utils/themeColor";

export interface TerrainPalette {
  terrainBg: string;
  mountainFar: string;
  mountainMain: string;
  mountainMiddle: string;
  mountainFront: string;
  contourFar: string;
  contourMain: string;
  contourMiddle: string;
  contourFront: string;
  contourWidth?: number;
  contourWidthFar?: number;
  contourWidthMain?: number;
  contourWidthMiddle?: number;
  contourWidthFront?: number;
  contourOpacityFar?: number;
  contourOpacityMain?: number;
  contourOpacityMiddle?: number;
  contourOpacityFront?: number;
}

/** 针对 Pure Admin 预置 6 种系统主色及 dark/light 模式的高精度手调主题方案 */
const PRESET_THEMES: Record<
  string,
  { light: TerrainPalette; dark: TerrainPalette }
> = {
  // 测绘蓝 #034EA2
  "#034EA2": {
    light: {
      terrainBg: "#eff4fa",
      mountainFar: "#cbd8ea",
      mountainMain: "#9eb7d6",
      mountainMiddle: "#7697bc",
      mountainFront: "#416f9a",
      contourFar: "#8ea7c7",
      contourMain: "#eef4fd",
      contourMiddle: "#c5d7ed",
      contourFront: "#80a1c6",
      contourWidth: 1.0
    },
    dark: {
      terrainBg: "#172332",
      mountainFar: "#27384d",
      mountainMain: "#7f9fc4",
      mountainMiddle: "#4e7096",
      mountainFront: "#1b3c66",
      contourFar: "#5b779b",
      contourMain: "#dbe8f7",
      contourMiddle: "#a9c4e2",
      contourFront: "#6d98c7",
      contourWidth: 1.0
    }
  },
  // 天空蓝 #0284C7
  "#0284C7": {
    light: {
      terrainBg: "#f0f7fb",
      mountainFar: "#cde2f0",
      mountainMain: "#9ec9e4",
      mountainMiddle: "#6ba9d2",
      mountainFront: "#1c6d9f",
      contourFar: "#8fb8d6",
      contourMain: "#f0f8fd",
      contourMiddle: "#cce4f5",
      contourFront: "#90c6ec",
      contourWidth: 1.0
    },
    dark: {
      terrainBg: "#142633",
      mountainFar: "#213d52",
      mountainMain: "#77a9cc",
      mountainMiddle: "#44789e",
      mountainFront: "#145277",
      contourFar: "#527e9e",
      contourMain: "#d5ebfa",
      contourMiddle: "#9ac8e8",
      contourFront: "#5ea3d6",
      contourWidth: 1.0
    }
  },
  // 水色青 #0F766E
  "#0F766E": {
    light: {
      terrainBg: "#edf5f4",
      mountainFar: "#cbdcd9",
      mountainMain: "#9fbfb9",
      mountainMiddle: "#6f9e95",
      mountainFront: "#24675f",
      contourFar: "#8eaead",
      contourMain: "#eef6f5",
      contourMiddle: "#cbe3df",
      contourFront: "#91c5bd",
      contourWidth: 1.0
    },
    dark: {
      terrainBg: "#172927",
      mountainFar: "#263f3c",
      mountainMain: "#7caaa1",
      mountainMiddle: "#497a72",
      mountainFront: "#174f48",
      contourFar: "#558079",
      contourMain: "#daf2ee",
      contourMiddle: "#9fd0c7",
      contourFront: "#5ea89c",
      contourWidth: 1.0
    }
  },
  // 地形绿 #15803D
  "#15803D": {
    light: {
      terrainBg: "#f0f6f0",
      mountainFar: "#cee0ce",
      mountainMain: "#a2c6a0",
      mountainMiddle: "#72a36f",
      mountainFront: "#286b24",
      contourFar: "#90b58e",
      contourMain: "#f1f7f0",
      contourMiddle: "#cee5cc",
      contourFront: "#98ce94",
      contourWidth: 1.0
    },
    dark: {
      terrainBg: "#182a1a",
      mountainFar: "#28412b",
      mountainMain: "#7eaf7b",
      mountainMiddle: "#4d7c4a",
      mountainFront: "#1b5219",
      contourFar: "#598357",
      contourMain: "#dbf4d8",
      contourMiddle: "#a0d29d",
      contourFront: "#64aa61",
      contourWidth: 1.0
    }
  },
  // 海图藏青 #1E3A5F
  "#1E3A5F": {
    light: {
      terrainBg: "#eef2f7",
      mountainFar: "#cad3e1",
      mountainMain: "#9ba9c3",
      mountainMiddle: "#687a9c",
      mountainFront: "#243a5d",
      contourFar: "#8c9cb6",
      contourMain: "#eff3f9",
      contourMiddle: "#cbd5e7",
      contourFront: "#96a9c9",
      contourWidth: 1.0
    },
    dark: {
      terrainBg: "#151d28",
      mountainFar: "#232e3d",
      mountainMain: "#7486a2",
      mountainMiddle: "#475771",
      mountainFront: "#1b2c45",
      contourFar: "#536581",
      contourMain: "#d7e2f1",
      contourMiddle: "#9cb1cf",
      contourFront: "#6480a8",
      contourWidth: 1.0
    }
  },
  // 岩石灰 #57534E
  "#57534E": {
    light: {
      terrainBg: "#f4f3f2",
      mountainFar: "#ddd9d6",
      mountainMain: "#bdb6b1",
      mountainMiddle: "#908882",
      mountainFront: "#504944",
      contourFar: "#a39c96",
      contourMain: "#f7f6f5",
      contourMiddle: "#ded9d5",
      contourFront: "#b5aca5",
      contourWidth: 1.0
    },
    dark: {
      terrainBg: "#22201e",
      mountainFar: "#353230",
      mountainMain: "#948d88",
      mountainMiddle: "#655e58",
      mountainFront: "#3c3732",
      contourFar: "#726b65",
      contourMain: "#ebe6e2",
      contourMiddle: "#b8b0aa",
      contourFront: "#877e77",
      contourWidth: 1.0
    }
  }
};

/**
 * 针对未匹配到预设的任意 Hex 颜色，自动推导生成具有和谐层次的山体等高线调色盘
 */
function deriveDynamicPalette(
  seedHex: string,
  mode: ThemeMode
): TerrainPalette {
  const isDark = mode === "dark";

  if (isDark) {
    const bg = mixColors("#080c10", seedHex, 0.22);
    const mFar = mixColors("#16202c", seedHex, 0.35);
    const mMain = mixColors("#99b8dc", seedHex, 0.55);
    const mMiddle = mixColors("#4c729c", seedHex, 0.65);
    const mFront = mixColors("#12365c", seedHex, 0.75);

    return {
      terrainBg: bg,
      mountainFar: mFar,
      mountainMain: mMain,
      mountainMiddle: mMiddle,
      mountainFront: mFront,
      contourFar: mixColors("#ffffff", mFar, 0.35),
      contourMain: mixColors("#ffffff", mMain, 0.65),
      contourMiddle: mixColors("#ffffff", mMiddle, 0.45),
      contourFront: mixColors("#ffffff", mFront, 0.4),
      contourWidth: 1.0
    };
  } else {
    const bg = mixColors("#f7fafc", seedHex, 0.08);
    const mFar = mixColors("#dae4ef", seedHex, 0.25);
    const mMain = mixColors("#a7c4e2", seedHex, 0.45);
    const mMiddle = mixColors("#6a97c4", seedHex, 0.58);
    const mFront = mixColors("#1b528b", seedHex, 0.75);

    return {
      terrainBg: bg,
      mountainFar: mFar,
      mountainMain: mMain,
      mountainMiddle: mMiddle,
      mountainFront: mFront,
      contourFar: mixColors("#475569", mFar, 0.45),
      contourMain: mixColors("#ffffff", mMain, 0.8),
      contourMiddle: mixColors("#ffffff", mMiddle, 0.6),
      contourFront: mixColors("#ffffff", mFront, 0.45),
      contourWidth: 1.0
    };
  }
}

/**
 * 获取与当前系统主色和明暗模式完美适配的 SVG 调色方案
 */
export function getTerrainPalette(
  primaryColor: string,
  isDark: boolean
): TerrainPalette {
  const mode: ThemeMode = isDark ? "dark" : "light";
  const normalizedKey = primaryColor.toUpperCase();

  // 寻找预设
  for (const [presetColor, themes] of Object.entries(PRESET_THEMES)) {
    if (presetColor.toUpperCase() === normalizedKey) {
      return themes[mode];
    }
  }

  // 动态根据算法推导
  try {
    return deriveDynamicPalette(primaryColor, mode);
  } catch {
    // 降级使用第一套测绘蓝
    return PRESET_THEMES["#034EA2"][mode];
  }
}

/**
 * 将调色板转换为 CSS 变量对象，供内嵌 SVG 样式容器直接绑定
 */
export function paletteToCssVars(
  palette: TerrainPalette
): Record<string, string> {
  return {
    "--terrain-bg": palette.terrainBg,
    "--mountain-far": palette.mountainFar,
    "--mountain-main": palette.mountainMain,
    "--mountain-middle": palette.mountainMiddle,
    "--mountain-front": palette.mountainFront,
    "--contour-far": palette.contourFar,
    "--contour-main": palette.contourMain,
    "--contour-middle": palette.contourMiddle,
    "--contour-front": palette.contourFront,
    "--contour-width": String(palette.contourWidth ?? 1.0),
    "--contour-width-far": String(palette.contourWidthFar ?? 0.82),
    "--contour-width-main": String(palette.contourWidthMain ?? 1.0),
    "--contour-width-middle": String(palette.contourWidthMiddle ?? 0.92),
    "--contour-width-front": String(palette.contourWidthFront ?? 1.0),
    "--contour-far-opacity": String(palette.contourOpacityFar ?? 0.3),
    "--contour-main-opacity": String(palette.contourOpacityMain ?? 0.72),
    "--contour-middle-opacity": String(palette.contourOpacityMiddle ?? 0.52),
    "--contour-front-opacity": String(palette.contourOpacityFront ?? 0.6)
  };
}
