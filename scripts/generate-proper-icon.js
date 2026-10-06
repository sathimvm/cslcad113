import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG precisely matching the user's reference image:
// - White rounded rectangle card with cyan stroke (#00a2e8)
// - Isometric ship with dual-tone blue facets (#0091ea / #0b4976)
// - Mast with yardarm
// - Two sweeping blue waves (#00a2e8 & #0288d1)
// - 45-degree CAD triangle ruler in dark charcoal (#293339) with triangular cutout and ruler tick marks
// - Bold black text: "CSL CAD VIEW"
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 600" width="512" height="600">
  <defs>
    <!-- Crisp drop shadows and smooth corners -->
    <filter id="cardGlow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#00a2e8" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Card Background -->
  <rect x="20" y="20" width="472" height="560" rx="46" ry="46" fill="#ffffff" stroke="#1da1f2" stroke-width="9" />

  <!-- === THE SHIP === -->
  <!-- Mast / Radar Tower -->
  <!-- Center mast post -->
  <rect x="207" y="62" width="16" height="70" fill="#0b4674" rx="2" />
  <!-- Mast Cross Yardarm -->
  <rect x="180" y="98" width="70" height="12" fill="#0b4674" rx="2" />
  <rect x="195" y="82" width="40" height="7" fill="#0b4674" rx="1.5" />

  <!-- Bridge / Superstructure - Top Tier -->
  <!-- Left facet (light) -->
  <polygon points="215,122 172,138 172,168 215,152" fill="#009fe3" />
  <!-- Right facet (dark) -->
  <polygon points="215,122 215,152 258,138 258,122" fill="#0b4674" />
  <!-- Bridge Windows accent -->
  <line x1="178" y1="147" x2="210" y2="135" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.9" />
  <line x1="220" y1="135" x2="252" y2="147" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.6" />

  <!-- Bridge / Superstructure - Lower Tier -->
  <!-- Left facet (light) -->
  <polygon points="215,152 148,177 148,214 215,189" fill="#009fe3" />
  <!-- Right facet (dark) -->
  <polygon points="215,152 215,189 282,177 282,152" fill="#0b4674" />
  <!-- Lower tier deck accents -->
  <line x1="154" y1="190" x2="208" y2="170" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" opacity="0.9" />
  <line x1="222" y1="170" x2="276" y2="190" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" opacity="0.6" />

  <!-- Main Vessel Hull (Isometric Bow) -->
  <!-- Left bow hull (vibrant azure/cyan) -->
  <path d="M 215,189 L 108,228 L 138,302 C 158,328 188,338 215,340 Z" fill="#0091ea" />
  <!-- Left sheer highlight line -->
  <path d="M 215,189 L 108,228 L 138,302" fill="none" stroke="#00b0ff" stroke-width="2" opacity="0.6" />

  <!-- Right bow hull (deep navy ocean blue) -->
  <path d="M 215,189 L 215,340 C 242,338 272,328 292,302 L 322,228 Z" fill="#0b4674" />

  <!-- Center Bow Stem Crease Line -->
  <line x1="215" y1="189" x2="215" y2="340" stroke="#ffffff" stroke-width="2.5" opacity="0.4" />

  <!-- === DYNAMIC OCEAN WAVES === -->
  <!-- Upper Wave Ribbon (Bright Cyan #00a2e8) -->
  <path d="M 88,295 C 120,295 145,342 195,342 C 245,342 270,305 315,305 C 335,305 348,312 355,316 C 342,326 325,334 308,334 C 265,334 238,368 190,368 C 145,368 120,332 88,322 Z" fill="#00a2e8" />

  <!-- Lower Wave Ribbon (Rich Royal Blue #0288d1) -->
  <path d="M 115,342 C 145,355 168,392 208,392 C 255,392 280,358 322,358 C 335,358 348,362 355,366 C 340,376 322,382 308,382 C 268,382 242,414 198,414 C 158,414 135,378 115,368 Z" fill="#0288d1" />

  <!-- === CAD DRAFTING TRIANGLE RULER (SET SQUARE) === -->
  <!-- Positioned on the right side, tilted ~45 degrees, dark charcoal #28333a -->
  <g id="triangle-ruler">
    <!-- Outer Triangle Body with Inner Cutout -->
    <path d="M 436,128 L 436,396 L 276,285 Z M 406,206 L 334,285 L 406,346 Z"
          fill="#273239"
          fill-rule="evenodd" />

    <!-- Ruler Measurement Hash / Tick Marks along the straight vertical/hypotenuse edge -->
    <!-- Distinct graduated CAD markings -->
    <line x1="436" y1="158" x2="416" y2="158" stroke="#71828d" stroke-width="4.5" stroke-linecap="round" />
    <line x1="436" y1="184" x2="423" y2="184" stroke="#71828d" stroke-width="3.5" stroke-linecap="round" />
    <line x1="436" y1="210" x2="416" y2="210" stroke="#71828d" stroke-width="4.5" stroke-linecap="round" />
    <line x1="436" y1="236" x2="423" y2="236" stroke="#71828d" stroke-width="3.5" stroke-linecap="round" />
    <line x1="436" y1="262" x2="416" y2="262" stroke="#71828d" stroke-width="4.5" stroke-linecap="round" />
    <line x1="436" y1="288" x2="423" y2="288" stroke="#71828d" stroke-width="3.5" stroke-linecap="round" />
    <line x1="436" y1="314" x2="416" y2="314" stroke="#71828d" stroke-width="4.5" stroke-linecap="round" />
    <line x1="436" y1="340" x2="423" y2="340" stroke="#71828d" stroke-width="3.5" stroke-linecap="round" />
    <line x1="436" y1="366" x2="416" y2="366" stroke="#71828d" stroke-width="4.5" stroke-linecap="round" />
  </g>

  <!-- === BOLD TYPOGRAPHY: CSL CAD VIEW === -->
  <text x="256" y="495"
        text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        font-weight="900"
        font-size="44"
        letter-spacing="1.5"
        fill="#111111">CSL CAD VIEW</text>
</svg>`;

// Also a square 512x512 version optimized for square app launchers & icons
const squareSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Card Background -->
  <rect x="14" y="14" width="484" height="484" rx="56" ry="56" fill="#ffffff" stroke="#1da1f2" stroke-width="9" />

  <!-- === THE SHIP === -->
  <!-- Mast / Radar Tower -->
  <rect x="210" y="44" width="15" height="60" fill="#0b4674" rx="2" />
  <rect x="185" y="74" width="65" height="11" fill="#0b4674" rx="2" />
  <rect x="198" y="60" width="38" height="6" fill="#0b4674" rx="1.5" />

  <!-- Bridge / Superstructure - Top Tier -->
  <polygon points="217,96 178,111 178,137 217,123" fill="#009fe3" />
  <polygon points="217,96 217,123 256,111 256,96" fill="#0b4674" />
  <line x1="184" y1="119" x2="212" y2="108" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.9" />
  <line x1="222" y1="108" x2="250" y2="119" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.6" />

  <!-- Bridge / Superstructure - Lower Tier -->
  <polygon points="217,123 156,146 156,179 217,156" fill="#009fe3" />
  <polygon points="217,123 217,156 278,146 278,123" fill="#0b4674" />
  <line x1="162" y1="158" x2="211" y2="139" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.9" />
  <line x1="223" y1="139" x2="272" y2="158" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.6" />

  <!-- Main Vessel Hull (Isometric Bow) -->
  <path d="M 217,156 L 120,191 L 147,258 C 165,281 192,290 217,292 Z" fill="#0091ea" />
  <path d="M 217,156 L 120,191 L 147,258" fill="none" stroke="#00b0ff" stroke-width="2" opacity="0.6" />
  <path d="M 217,156 L 217,292 C 242,290 269,281 287,258 L 314,191 Z" fill="#0b4674" />
  <line x1="217" y1="156" x2="217" y2="292" stroke="#ffffff" stroke-width="2.5" opacity="0.4" />

  <!-- === DYNAMIC OCEAN WAVES === -->
  <path d="M 102,252 C 131,252 154,294 199,294 C 244,294 267,261 308,261 C 326,261 337,267 344,271 C 332,280 316,287 301,287 C 262,287 238,318 195,318 C 154,318 131,285 102,276 Z" fill="#00a2e8" />
  <path d="M 126,294 C 153,306 174,339 210,339 C 252,339 275,308 313,308 C 325,308 336,312 343,315 C 329,324 313,329 300,329 C 264,329 241,358 201,358 C 165,358 144,326 126,317 Z" fill="#0288d1" />

  <!-- === CAD DRAFTING TRIANGLE RULER (SET SQUARE) === -->
  <g id="triangle-ruler-sq">
    <path d="M 420,102 L 420,344 L 275,243 Z M 392,172 L 327,243 L 392,298 Z"
          fill="#273239"
          fill-rule="evenodd" />

    <!-- Ruler Hash Marks -->
    <line x1="420" y1="128" x2="402" y2="128" stroke="#71828d" stroke-width="4" stroke-linecap="round" />
    <line x1="420" y1="151" x2="408" y2="151" stroke="#71828d" stroke-width="3" stroke-linecap="round" />
    <line x1="420" y1="174" x2="402" y2="174" stroke="#71828d" stroke-width="4" stroke-linecap="round" />
    <line x1="420" y1="198" x2="408" y2="198" stroke="#71828d" stroke-width="3" stroke-linecap="round" />
    <line x1="420" y1="221" x2="402" y2="221" stroke="#71828d" stroke-width="4" stroke-linecap="round" />
    <line x1="420" y1="245" x2="408" y2="245" stroke="#71828d" stroke-width="3" stroke-linecap="round" />
    <line x1="420" y1="268" x2="402" y2="268" stroke="#71828d" stroke-width="4" stroke-linecap="round" />
    <line x1="420" y1="292" x2="408" y2="292" stroke="#71828d" stroke-width="3" stroke-linecap="round" />
    <line x1="420" y1="316" x2="402" y2="316" stroke="#71828d" stroke-width="4" stroke-linecap="round" />
  </g>

  <!-- === BOLD TYPOGRAPHY: CSL CAD VIEW === -->
  <text x="256" y="435"
        text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        font-weight="900"
        font-size="44"
        letter-spacing="1.5"
        fill="#111111">CSL CAD VIEW</text>
</svg>`;

// Write SVGs
const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, 'icon-card.svg'), svgContent, 'utf8');
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), squareSvg, 'utf8');

console.log('SVGs written successfully. Converting to PNGs using ImageMagick...');

// Convert to various sizes using convert
const sizes = [
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-192.png', size: 192 },
  { file: 'favicon.png', size: 64 },
];

sizes.forEach(({ file, size }) => {
  const dest = path.join(iconsDir, file);
  execSync(`convert -background none -resize ${size}x${size} "${path.join(iconsDir, 'icon.svg')}" "${dest}"`);
  console.log(`Generated ${file} (${size}x${size})`);
});

// Also generate Android mipmap icons
const androidRes = path.join(__dirname, '../android/app/src/main/res');
const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

mipmaps.forEach(({ dir, size }) => {
  const targetDir = path.join(androidRes, dir);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  
  const launcher = path.join(targetDir, 'ic_launcher.png');
  const launcherRound = path.join(targetDir, 'ic_launcher_round.png');
  
  execSync(`convert -background none -resize ${size}x${size} "${path.join(iconsDir, 'icon.svg')}" "${launcher}"`);
  execSync(`convert -background none -resize ${size}x${size} "${path.join(iconsDir, 'icon.svg')}" "${launcherRound}"`);
  console.log(`Updated Android ${dir} (${size}x${size})`);
});

console.log('All icons successfully updated with the proper icon design!');
