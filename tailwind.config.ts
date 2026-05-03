import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#5B6FF5",
        "brand-light": "#EEF0FE",
        ink: "#111111",
        body: "#333333",
        muted: "#999999",
        subtle: "#BBBBBB",
        "bg-subtle": "#F5F5F5",
        "bg-section": "#F5F5F5",
        "border-row": "#F0F0F0",
        "border-card": "#E0E0E0",
        danger: "#FF3B30",
        primary: {
          50: "#f0eeff",
          100: "#ddd8ff",
          200: "#c5bcff",
          500: "#6C5CE7",
          600: "#5a4bd1",
          700: "#4a3cba",
        },
        gray: {
          50: "#F9F9F9",
          100: "#F2F2F2",
          200: "#E8E8E8",
          300: "#D4D4D4",
          400: "#AAAAAA",
          500: "#888888",
          600: "#666666",
          700: "#444444",
          800: "#2D2D2D",
          900: "#1A1A1A",
        },
      },
      screens: {
        xs: "375px",
      },
      borderRadius: {
        icon: "10px",
        stat: "14px",
        avatar: "16px",
        chip: "9999px",
      },
      fontSize: {
        "section-label": [
          "11px",
          {
            lineHeight: "1.4",
            letterSpacing: "0.06em",
            fontWeight: "600",
          },
        ],
      },
    },
  },
  plugins: [],
};

export default config;
