// scripts/generate-icons.mjs
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

// SVG icon with emerald background and Cable TV network symbol
const createSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#006948"/>
  <g transform="translate(${size * 0.2}, ${size * 0.2}) scale(${size * 0.6 / 100})">
    <!-- Outer Cable Loop -->
    <path d="M50 15 C30 15 15 30 15 50 C15 70 30 85 50 85 C70 85 85 70 85 50 C85 30 70 15 50 15 Z" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
    <!-- Center Plug / Connection nodes -->
    <circle cx="35" cy="50" r="7" fill="#ffffff"/>
    <circle cx="65" cy="50" r="7" fill="#ffffff"/>
    <line x1="35" y1="50" x2="65" y2="50" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
    <line x1="50" y1="23" x2="50" y2="40" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
    <line x1="50" y1="60" x2="50" y2="77" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
  </g>
</svg>
`;

async function generate() {
  console.log("Generating PWA icons...");
  
  // 192x192
  await sharp(Buffer.from(createSvg(192)))
    .png()
    .toFile(path.join(publicDir, "icon-192.png"));
  console.log("✅ Created public/icon-192.png");

  // 512x512
  await sharp(Buffer.from(createSvg(512)))
    .png()
    .toFile(path.join(publicDir, "icon-512.png"));
  console.log("✅ Created public/icon-512.png");

  // apple-touch-icon
  await sharp(Buffer.from(createSvg(180)))
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("✅ Created public/apple-touch-icon.png");

  console.log("🎉 All icons generated successfully!");
}

generate().catch(console.error);
