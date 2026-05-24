import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#ffffff",
          hover: "#1d4ed8",
          light: "#dbeafe",
        },
        navy: {
          DEFAULT: "#1e3a5f",
          dark: "#162d4a",
          light: "#e8eef5",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "#64748b",
          foreground: "hsl(var(--muted-foreground))",
          soft: "#94a3b8",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          light: "#dbeafe",
        },
        canvas: "#ffffff",
        "surface-soft": "#f7f9fc",
        "surface-card": "#f0f4f8",
        "surface-strong": "#dde3ea",
        "surface-dark": "#1e3a5f",
        hairline: "#e2e8f0",
        "hairline-soft": "#f1f5f9",
        "hairline-muted": "#eef2f7",
        ink: "#0f172a",
        body: "#334155",
        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(30,58,95,0.08)",
        elevated: "0 4px 16px rgba(30,58,95,0.12)",
        modal: "0 8px 32px rgba(30,58,95,0.16)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config
