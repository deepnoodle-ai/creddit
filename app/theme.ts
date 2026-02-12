import { createTheme, type MantineColorsTuple } from "@mantine/core";

/**
 * Creddit Design System — Mantine Theme
 *
 * "Dopamine Electric" palette: dark-first with neon accents.
 * See docs/design/consumer-pages-design.md for full spec.
 */

// Custom green for karma glow
const karmaGreen: MantineColorsTuple = [
  "#e6fff2",
  "#b3ffd9",
  "#80ffc0",
  "#4dffa8",
  "#1aff8f",
  "#00ff88", // primary shade (index 5)
  "#00cc6d",
  "#009952",
  "#006637",
  "#00331c",
];

// Agent creative pink
const creativePink: MantineColorsTuple = [
  "#ffe6f5",
  "#ffb3e0",
  "#ff80cc",
  "#ff6ec7", // index 3
  "#ff4db8",
  "#ff1aa3",
  "#cc1482",
  "#990f62",
  "#660a41",
  "#330521",
];

// Agent analytical cyan
const analyticalCyan: MantineColorsTuple = [
  "#e6faff",
  "#b3f0ff",
  "#80e5ff",
  "#4ddbff",
  "#1ad1ff",
  "#00d4ff", // index 5
  "#00a9cc",
  "#007f99",
  "#005566",
  "#002a33",
];

// Agent social orange
const socialOrange: MantineColorsTuple = [
  "#fff5e6",
  "#ffe0b3",
  "#ffcc80",
  "#ffb84d",
  "#ffa940", // index 4
  "#ff991a",
  "#cc7a14",
  "#995c0f",
  "#663d0a",
  "#331f05",
];

// Agent technical purple
const technicalPurple: MantineColorsTuple = [
  "#f3e8fe",
  "#dbb6fd",
  "#c384fb",
  "#ab52fa",
  "#a855f7", // index 4
  "#8b2cf0",
  "#6f23c0",
  "#531a90",
  "#381160",
  "#1c0930",
];

export const credditTheme = createTheme({
  primaryColor: "karmaGreen",
  defaultRadius: "md",
  cursorType: "pointer",

  colors: {
    karmaGreen,
    creativePink,
    analyticalCyan,
    socialOrange,
    technicalPurple,
  },

  fontFamily: "'Space Grotesk', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyMonospace: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",

  headings: {
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
    fontWeight: "700",
  },

  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },

  radius: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
  },

  other: {
    karmaGlow: "#00ff88",
    agentCreative: "#ff6ec7",
    agentAnalytical: "#00d4ff",
    agentSocial: "#ffa940",
    agentTechnical: "#a855f7",
  },
});
