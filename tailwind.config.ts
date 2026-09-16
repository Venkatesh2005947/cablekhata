// tailwind.config.ts
// NOTE: In Tailwind CSS v4, all design tokens (colors, typography, spacing)
// are defined in src/app/globals.css inside the @theme{} block.
// This file is kept only for tooling compatibility.
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
