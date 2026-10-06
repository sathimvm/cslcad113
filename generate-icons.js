import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

function crc32(buf) {
  let table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// 5x7 block font for "CSL CAD VIEW"
const FONT_5X7 = {
  'C': [
    " XXX ",
    "X   X",
    "X    ",
    "X    ",
    "X    ",
    "X   X",
    " XXX "
  ],
  'S': [
    " XXX ",
    "X   X",
    "X    ",
    " XXX ",
    "    X",
    "X   X",
    " XXX "
  ],
  'L': [
    "X    ",
    "X    ",
    "X    ",
    "X    ",
    "X    ",
    "X    ",
    "XXXXX"
  ],
  'A': [
    " XXX ",
    "X   X",
    "X   X",
    "XXXXX",
    "X   X",
    "X   X",
    "X   X"
  ],
  'D': [
    "XXXX ",
    "X   X",
    "X   X",
    "X   X",
    "X   X",
    "X   X",
    "XXXX "
  ],
  'V': [
    "X   X",
    "X   X",
    "X   X",
    "X   X",
    "X   X",
    " X X ",
    "  X  "
  ],
  'I': [
    "XXXXX",
    "  X  ",
    "  X  ",
    "  X  ",
    "  X  ",
    "  X  ",
    "XXXXX"
  ],
  'E': [
    "XXXXX",
    "X    ",
    "X    ",
    "XXXX ",
    "X    ",
    "X    ",
    "XXXXX"
  ],
  'W': [
    "X   X",
    "X   X",
    "X   X",
    "X X X",
    "X X X",
    "X X X",
    " X X "
  ],
  ' ': [
    "     ",
    "     ",
    "     ",
    "     ",
    "     ",
    "     ",
    "     "
  ]
};

function createPng(width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  // Buffer for raw image data
  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push([255, 255, 255, 255]); // white background
    }
    grid.push(row);
  }

  const setPixel = (x, y, r, g, b, a = 255) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[y][x] = [r, g, b, a];
    }
  };

  const drawRect = (x0, y0, w, h, r, g, b, a = 255) => {
    for (let y = Math.floor(y0); y < Math.floor(y0 + h); y++) {
      for (let x = Math.floor(x0); x < Math.floor(x0 + w); x++) {
        setPixel(x, y, r, g, b, a);
      }
    }
  };

  // 1. Draw rounded cyan card border
  const borderThickness = Math.max(3, Math.round(width * 0.035));
  const cornerRadius = Math.round(width * 0.12);
  const inset = Math.round(width * 0.03);
  const bw = width - inset * 2;
  const bh = height - inset * 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // outside card
      if (x < inset || x >= inset + bw || y < inset || y >= inset + bh) {
        grid[y][x] = [255, 255, 255, 0]; // transparent outside
        continue;
      }
      // rounded corner calculation
      let dx = 0, dy = 0;
      if (x < inset + cornerRadius) dx = inset + cornerRadius - x;
      else if (x >= inset + bw - cornerRadius) dx = x - (inset + bw - cornerRadius);
      if (y < inset + cornerRadius) dy = inset + cornerRadius - y;
      else if (y >= inset + bh - cornerRadius) dy = y - (inset + bh - cornerRadius);

      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > cornerRadius) {
        grid[y][x] = [255, 255, 255, 0]; // transparent
      } else if (d > cornerRadius - borderThickness) {
        // Border: cyan #21b5eb
        grid[y][x] = [33, 181, 235, 255];
      } else if (x < inset + borderThickness || x >= inset + bw - borderThickness ||
                 y < inset + borderThickness || y >= inset + bh - borderThickness) {
        grid[y][x] = [33, 181, 235, 255];
      }
    }
  }

  // 2. Draw Ship Superstructure & Mast
  const cx = width * 0.44;
  const sTop = height * 0.11;

  // Mast cross
  const mastH = height * 0.10;
  const mastW = Math.max(3, Math.round(width * 0.022));
  drawRect(cx - mastW / 2, sTop, mastW, mastH, 13, 71, 161);
  drawRect(cx - width * 0.045, sTop + mastH * 0.35, width * 0.09, mastW, 13, 71, 161);

  // Superstructure Tiers
  // Tier 1 (top):
  drawRect(cx - width * 0.06, sTop + mastH, width * 0.12, height * 0.038, 21, 101, 192);
  // Tier 2:
  drawRect(cx - width * 0.10, sTop + mastH + height * 0.038, width * 0.20, height * 0.045, 13, 71, 161);
  // Tier 3:
  drawRect(cx - width * 0.14, sTop + mastH + height * 0.083, width * 0.28, height * 0.048, 25, 118, 210);

  // 3. Draw Ship Hull (symmetrical prow, port cyan, starboard navy)
  const hullTopY = sTop + mastH + height * 0.131;
  const hullBottomY = height * 0.58;
  const hullWLeft = width * 0.26;
  const hullWRight = width * 0.15;

  for (let y = Math.floor(hullTopY); y <= Math.floor(hullBottomY); y++) {
    const t = (y - hullTopY) / (hullBottomY - hullTopY);
    // Left port side (bright marine cyan #0288d1 / #00b0ff)
    const leftX = cx - (hullWLeft * (1 - t * 0.45));
    for (let x = Math.floor(leftX); x < cx; x++) {
      setPixel(x, y, 2, 136, 209);
    }
    // Right starboard side (deep navy #0d47a1)
    const rightX = cx + (hullWRight * (1 - t * 0.45));
    for (let x = Math.floor(cx); x <= Math.floor(rightX); x++) {
      setPixel(x, y, 13, 71, 161);
    }
    // Center white keel line
    setPixel(Math.floor(cx), y, 255, 255, 255);
    setPixel(Math.floor(cx) - 1, y, 255, 255, 255);
  }

  // 4. Draw CAD Set Square (Triangle Ruler on the right)
  const triX0 = width * 0.52; // left corner
  const triY0 = height * 0.51;
  const triX1 = width * 0.86; // right edge
  const triY1 = height * 0.23; // top corner
  const triY2 = height * 0.69; // bottom-right corner

  // Point in triangle test
  function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
    const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
    const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
    const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
  }

  // Outer triangle (dark slate charcoal #2d3748)
  // Inner cutout triangle
  const inX0 = width * 0.60;
  const inY0 = height * 0.51;
  const inX1 = width * 0.80;
  const inY1 = height * 0.37;
  const inY2 = height * 0.62;

  for (let y = Math.floor(triY1); y <= Math.floor(triY2); y++) {
    for (let x = Math.floor(triX0); x <= Math.floor(triX1); x++) {
      if (pointInTriangle(x, y, triX0, triY0, triX1, triY1, triX1, triY2)) {
        if (pointInTriangle(x, y, inX0, inY0, inX1, inY1, inX1, inY2)) {
          setPixel(x, y, 255, 255, 255); // cutout
        } else {
          setPixel(x, y, 45, 55, 72); // ruler body
        }
      }
    }
  }

  // Ruler tick marks along right edge (triX1)
  const tickSpacing = Math.round(height * 0.045);
  for (let ty = Math.floor(triY1 + tickSpacing); ty < triY2 - tickSpacing; ty += tickSpacing) {
    const isMajor = ((ty / tickSpacing) % 2 === 0);
    const tickLen = isMajor ? Math.round(width * 0.045) : Math.round(width * 0.025);
    for (let tx = Math.floor(triX1 - tickLen); tx <= Math.floor(triX1); tx++) {
      setPixel(tx, ty, 203, 213, 225);
      setPixel(tx, ty + 1, 203, 213, 225);
    }
  }

  // 5. Draw 3 Flowing Ocean Waves at the base of the ship
  const waveParams = [
    { yOffset: height * 0.54, color: [0, 176, 255], thick: Math.max(3, Math.round(height * 0.030)) }, // bright cyan
    { yOffset: height * 0.60, color: [2, 136, 209], thick: Math.max(3, Math.round(height * 0.026)) }, // marine blue
    { yOffset: height * 0.66, color: [13, 71, 161], thick: Math.max(2, Math.round(height * 0.022)) }  // deep navy
  ];

  waveParams.forEach(({ yOffset, color, thick }) => {
    const startX = width * 0.16;
    const endX = width * 0.66;
    for (let x = Math.floor(startX); x <= Math.floor(endX); x++) {
      const u = (x - startX) / (endX - startX);
      // Smooth S-curve wave: trough then crest then settle
      const waveY = yOffset + Math.sin(u * Math.PI * 2.2 - 0.6) * (height * 0.038) + (u * height * 0.015);
      for (let ty = Math.floor(waveY - thick / 2); ty <= Math.floor(waveY + thick / 2); ty++) {
        setPixel(x, ty, color[0], color[1], color[2]);
      }
    }
  });

  // 6. Draw Text "CSL CAD VIEW"
  const text = "CSL CAD VIEW";
  const scale = Math.max(2, Math.round(width * 0.019));
  const charW = 5 * scale;
  const charH = 7 * scale;
  const letterSpacing = Math.round(scale * 1.6);
  const totalTextW = text.length * charW + (text.length - 1) * letterSpacing;
  let textStartX = Math.round((width - totalTextW) / 2);
  const textStartY = Math.round(height * 0.81);

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const bitmap = FONT_5X7[ch] || FONT_5X7[' '];
    for (let row = 0; row < 7; row++) {
      const line = bitmap[row];
      for (let col = 0; col < 5; col++) {
        if (line[col] === 'X') {
          drawRect(
            textStartX + col * scale,
            textStartY + row * scale,
            scale,
            scale,
            17, 24, 39 // Dark Slate #111827
          );
        }
      }
    }
    textStartX += charW + letterSpacing;
  }

  // Convert grid to raw PNG scanlines
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = grid[y][x];
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Generate the sizes
const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 64,  name: 'favicon.png' }
];

sizes.forEach(({ size, name }) => {
  const buf = createPng(size, size);
  fs.writeFileSync(path.join(iconsDir, name), buf);
  console.log(`Successfully generated ${name} (${size}x${size})`);
});
