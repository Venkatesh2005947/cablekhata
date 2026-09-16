// src/app/page.tsx
// Root "/" is redirected to "/areas" via next.config.ts permanent redirect (308).
// This component is never rendered — the config-level redirect fires first.
export default function HomePage() {
  return null;
}
