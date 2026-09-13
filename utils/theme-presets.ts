export type ThemeMode = "light" | "dark";

export interface ThemeColorScale {
  [shade: string]: string;
}

export interface ThemeColors {
  background?: string;
  foreground?: string;
  surface?: string;
  surfaceMuted?: string;
  border?: string;
  muted?: string;
  primary?: ThemeColorScale | string;
  secondary?: ThemeColorScale | string;
  accent?: ThemeColorScale | string;
  vars?: Record<string, string>;
}

export interface ThemePreset {
  name: string;
  displayName: string;
  mode: ThemeMode;
  isDefault: boolean;
  sortOrder: number;
  colors: ThemeColors;
}

const COLOR_SHADES = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];

const cloneColors = (colors: ThemeColors): ThemeColors =>
  JSON.parse(JSON.stringify(colors));

const invertScale = (scale: ThemeColorScale): ThemeColorScale => {
  const inverted: ThemeColorScale = {};
  COLOR_SHADES.forEach((shade, index) => {
    const targetShade = COLOR_SHADES[COLOR_SHADES.length - 1 - index];
    if (targetShade != null) {
      inverted[shade] = scale[targetShade] ?? scale[shade] ?? "";
    }
  });
  return inverted;
};

// 蓝色色阶 - 用于主色调
const BLUE_SCALE: ThemeColorScale = {
  "50": "#EFF6FF",
  "100": "#DBEAFE",
  "200": "#BFDBFE",
  "300": "#93C5FD",
  "400": "#60A5FA",
  "500": "#3B82F6",
  "600": "#2563EB",
  "700": "#1D4ED8",
  "800": "#1E40AF",
  "900": "#1E3A8A",
  "950": "#172554",
};

// 石板灰色阶 - 用于辅助色（亮色模式：浅灰，暗色模式：深灰）
const SLATE_SCALE: ThemeColorScale = {
  "50": "#F8FAFC",
  "100": "#F1F5F9",
  "200": "#E2E8F0",
  "300": "#CBD5E1",
  "400": "#94A3B8",
  "500": "#64748B",
  "600": "#475569",
  "700": "#334155",
  "800": "#1E293B",
  "900": "#0F172A",
  "950": "#020617",
};

// 靛蓝色阶 - 用于强调色（亮色模式）
const INDIGO_SCALE: ThemeColorScale = {
  "50": "#EEF2FF",
  "100": "#E0E7FF",
  "200": "#C7D2FE",
  "300": "#A5B4FC",
  "400": "#818CF8",
  "500": "#6366F1",
  "600": "#4F46E5",
  "700": "#4338CA",
  "800": "#3730A3",
  "900": "#312E81",
  "950": "#1E1B4B",
};

// 自然黑/中性灰阶 - 暗色模式主色与辅助色（整体黑色系）
const NEUTRAL_DARK_SCALE: ThemeColorScale = {
  "50": "#0a0a0a",
  "100": "#141414",
  "200": "#1c1c1c",
  "300": "#262626",
  "400": "#404040",
  "500": "#525252",
  "600": "#737373",
  "700": "#a3a3a3",
  "800": "#d4d4d4",
  "900": "#e5e5e5",
  "950": "#fafafa",
};

// 暗色模式提醒色 - 仅用于强调/提醒（柔和紫）
const DARK_ACCENT_SCALE: ThemeColorScale = {
  "50": "#1a1625",
  "100": "#2e2640",
  "200": "#3d3260",
  "300": "#5b4b8a",
  "400": "#7c6ab3",
  "500": "#8b5cf6",
  "600": "#a78bfa",
  "700": "#c4b5fd",
  "800": "#ddd6fe",
  "900": "#ede9fe",
  "950": "#f5f3ff",
};

// 默认亮色主题 - 白蓝配色
export const defaultLightThemeColors: ThemeColors = {
  background: "#FFFFFF", // 纯白背景
  foreground: "#0F172A", // 深色文字
  surface: "#FFFFFF", // 白色表面
  surfaceMuted: "#F8FAFC", // 极浅灰表面
  border: "#E2E8F0", // 浅灰边框
  muted: "#64748B", // 中性灰文字
  primary: BLUE_SCALE, // 蓝色主色调
  secondary: SLATE_SCALE, // 石板灰辅助色
  accent: INDIGO_SCALE, // 靛蓝强调色
};

// 默认暗色主题 - 自然黑配色（主色/辅助色为黑灰系，强调色仅用于提醒）
export const defaultDarkThemeColors: ThemeColors = {
  background: "#0a0a0a",
  foreground: "#fafafa",
  surface: "#141414",
  surfaceMuted: "#0f0f0f",
  border: "#262626",
  muted: "#a3a3a3",
  primary: NEUTRAL_DARK_SCALE,
  secondary: NEUTRAL_DARK_SCALE,
  accent: DARK_ACCENT_SCALE,
};

export const defaultThemePresets: ThemePreset[] = [
  {
    name: "light-blue",
    displayName: "白蓝",
    mode: "light",
    isDefault: true,
    sortOrder: 1,
    colors: cloneColors(defaultLightThemeColors),
  },
  {
    name: "dark-blue",
    displayName: "自然黑",
    mode: "dark",
    isDefault: true,
    sortOrder: 11,
    colors: cloneColors(defaultDarkThemeColors),
  },
];

export const getDefaultColorsByMode = (mode: ThemeMode): ThemeColors =>
  cloneColors(
    mode === "dark" ? defaultDarkThemeColors : defaultLightThemeColors
  );
