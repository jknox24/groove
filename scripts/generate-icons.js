// Simple script to generate PWA icons
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create a simple SVG icon
const createSvgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#7c3aed"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui, sans-serif" font-weight="bold" font-size="${size * 0.5}" fill="white">
    G
  </text>
</svg>
`;

const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  for (const size of [192, 512]) {
    const svg = createSvgIcon(size);
    const pngPath = path.join(iconsDir, `icon-${size}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(pngPath);

    console.log(`Created icon-${size}.png`);
  }
}

generateIcons().catch(console.error);
