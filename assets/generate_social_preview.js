const fs = require('fs');
const path = require('path');

const WIDTH = 640;
const HEIGHT = 320;
const PADDING_TOP = 50;
const PADDING_BOTTOM = 50;
const CONTENT_TOP = PADDING_TOP;
const CONTENT_BOTTOM = HEIGHT - PADDING_BOTTOM; // 270
const NUM_FRAMES = 12;

// 256-color palette
const palette = new Array(256 * 3).fill(0);
function setPal(idx, r, g, b) {
  palette[idx * 3 + 0] = r;
  palette[idx * 3 + 1] = g;
  palette[idx * 3 + 2] = b;
}

// 0: Deep background
setPal(0, 8, 12, 20);      // #080c14
setPal(1, 15, 23, 42);     // #0f172a (dark surface)
setPal(2, 30, 41, 59);     // #1e293b (border/grid)
setPal(3, 56, 189, 248);   // #38bdf8 (cyan bright)
setPal(4, 2, 132, 199);    // #0284c7 (cyan medium)
setPal(5, 59, 130, 246);   // #3b82f6 (blue)
setPal(6, 192, 132, 252);  // #c084fc (purple bright)
setPal(7, 129, 140, 248);  // #818cf8 (indigo)
setPal(8, 52, 211, 153);   // #34d399 (emerald bright)
setPal(9, 16, 185, 129);   // #10b981 (emerald medium)
setPal(10, 251, 146, 60);  // #fb923c (orange/aws)
setPal(11, 255, 255, 255); // #ffffff (white)
setPal(12, 148, 163, 184); // #94a3b8 (gray light)
setPal(13, 71, 85, 105);   // #475569 (gray mid)
setPal(14, 224, 242, 254); // #e0f2fe (ice blue)
setPal(15, 16, 24, 40);    // #101828 (card bg)

// Fill gradient colors 16..63 for animated wave glow
for (let i = 0; i < 48; i++) {
  let t = i / 47;
  let r = Math.round(56 * (1 - t) + 192 * t);
  let g = Math.round(189 * (1 - t) + 132 * t);
  let b = Math.round(248 * (1 - t) + 252 * t);
  setPal(16 + i, r, g, b);
}

// 5x7 Basic Bitmap Font
const FONT = {
  ' ': [0, 0, 0, 0, 0],
  'A': [0x7c, 0x12, 0x11, 0x12, 0x7c],
  'B': [0x7f, 0x49, 0x49, 0x49, 0x36],
  'C': [0x3e, 0x41, 0x41, 0x41, 0x22],
  'D': [0x7f, 0x41, 0x41, 0x22, 0x1c],
  'E': [0x7f, 0x49, 0x49, 0x49, 0x41],
  'F': [0x7f, 0x09, 0x09, 0x09, 0x01],
  'G': [0x3e, 0x41, 0x49, 0x49, 0x7a],
  'H': [0x7f, 0x08, 0x08, 0x08, 0x7f],
  'I': [0x00, 0x41, 0x7f, 0x41, 0x00],
  'J': [0x20, 0x40, 0x41, 0x3f, 0x01],
  'K': [0x7f, 0x08, 0x14, 0x22, 0x41],
  'L': [0x7f, 0x40, 0x40, 0x40, 0x40],
  'M': [0x7f, 0x02, 0x0c, 0x02, 0x7f],
  'N': [0x7f, 0x04, 0x08, 0x10, 0x7f],
  'O': [0x3e, 0x41, 0x41, 0x41, 0x3e],
  'P': [0x7f, 0x09, 0x09, 0x09, 0x06],
  'Q': [0x3e, 0x41, 0x51, 0x21, 0x5e],
  'R': [0x7f, 0x09, 0x19, 0x29, 0x46],
  'S': [0x46, 0x49, 0x49, 0x49, 0x31],
  'T': [0x01, 0x01, 0x7f, 0x01, 0x01],
  'U': [0x3f, 0x40, 0x40, 0x40, 0x3f],
  'V': [0x1f, 0x20, 0x40, 0x20, 0x1f],
  'W': [0x7f, 0x20, 0x18, 0x20, 0x7f],
  'X': [0x63, 0x14, 0x08, 0x14, 0x63],
  'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
  'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
  '0': [0x3e, 0x51, 0x49, 0x45, 0x3e],
  '1': [0x00, 0x42, 0x7f, 0x40, 0x00],
  '2': [0x42, 0x61, 0x51, 0x49, 0x46],
  '3': [0x21, 0x41, 0x45, 0x4b, 0x31],
  '4': [0x18, 0x14, 0x12, 0x7f, 0x10],
  '5': [0x27, 0x45, 0x45, 0x45, 0x39],
  '6': [0x3c, 0x4a, 0x49, 0x49, 0x30],
  '7': [0x01, 0x71, 0x09, 0x05, 0x03],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36],
  '9': [0x06, 0x49, 0x49, 0x29, 0x1e],
  ':': [0x00, 0x36, 0x36, 0x00, 0x00],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08],
  '+': [0x08, 0x08, 0x3e, 0x08, 0x08],
  '%': [0x23, 0x13, 0x08, 0x64, 0x62],
  '.': [0x00, 0x60, 0x60, 0x00, 0x00],
  '/': [0x20, 0x10, 0x08, 0x04, 0x02],
  '&': [0x36, 0x49, 0x55, 0x22, 0x50],
  '•': [0x00, 0x1c, 0x1c, 0x00, 0x00]
};

function drawChar(buf, char, startX, startY, color, scale = 1) {
  const glyph = FONT[char.toUpperCase()] || FONT[' '];
  for (let col = 0; col < 5; col++) {
    const bits = glyph[col];
    for (let row = 0; row < 7; row++) {
      if ((bits >> row) & 1) {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const px = startX + col * scale + dx;
            const py = startY + row * scale + dy;
            if (px >= 0 && px < WIDTH && py >= 0 && py < HEIGHT) {
              buf[py * WIDTH + px] = color;
            }
          }
        }
      }
    }
  }
}

function drawText(buf, text, startX, startY, color, scale = 1) {
  let cx = startX;
  for (let i = 0; i < text.length; i++) {
    drawChar(buf, text[i], cx, startY, color, scale);
    cx += (5 + 1) * scale;
  }
}

function drawRect(buf, x, y, w, h, color) {
  for (let j = y; j < y + h; j++) {
    if (j < 0 || j >= HEIGHT) continue;
    for (let i = x; i < x + w; i++) {
      if (i < 0 || i >= WIDTH) continue;
      buf[j * WIDTH + i] = color;
    }
  }
}

function drawRectOutline(buf, x, y, w, h, color) {
  for (let i = x; i < x + w; i++) {
    if (y >= 0 && y < HEIGHT) buf[y * WIDTH + i] = color;
    if (y + h - 1 >= 0 && y + h - 1 < HEIGHT) buf[(y + h - 1) * WIDTH + i] = color;
  }
  for (let j = y; j < y + h; j++) {
    if (x >= 0 && x < WIDTH) buf[j * WIDTH + x] = color;
    if (x + w - 1 >= 0 && x + w - 1 < WIDTH) buf[j * WIDTH + (x + w - 1)] = color;
  }
}

// LZW Encoder
function lzwEncode(minCodeSize, pixelIndices) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = clearCode + 2;
  let dict = new Map();

  function resetDict() {
    dict.clear();
    codeSize = minCodeSize + 1;
    nextCode = clearCode + 2;
  }

  let byteStream = [];
  let curByte = 0;
  let curBits = 0;

  function writeBits(code, size) {
    curByte |= (code << curBits);
    curBits += size;
    while (curBits >= 8) {
      byteStream.push(curByte & 0xFF);
      curByte >>= 8;
      curBits -= 8;
    }
  }

  function flushBits() {
    if (curBits > 0) {
      byteStream.push(curByte & 0xFF);
      curByte = 0;
      curBits = 0;
    }
  }

  resetDict();
  writeBits(clearCode, codeSize);

  let prefix = '';
  for (let i = 0; i < pixelIndices.length; i++) {
    let k = String.fromCharCode(pixelIndices[i]);
    let pk = prefix === '' ? k : prefix + ',' + k;
    if (prefix === '' || dict.has(pk)) {
      prefix = pk;
    } else {
      let code = prefix.includes(',') ? dict.get(prefix) : parseInt(prefix);
      writeBits(code, codeSize);

      if (nextCode < 4096) {
        dict.set(pk, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeBits(clearCode, codeSize);
        resetDict();
      }
      prefix = k;
    }
  }
  if (prefix !== '') {
    let code = prefix.includes(',') ? dict.get(prefix) : parseInt(prefix);
    writeBits(code, codeSize);
  }
  writeBits(eoiCode, codeSize);
  flushBits();

  let subBlocks = [];
  for (let i = 0; i < byteStream.length; i += 255) {
    let chunk = byteStream.slice(i, Math.min(i + 255, byteStream.length));
    subBlocks.push(chunk.length);
    subBlocks.push(...chunk);
  }
  subBlocks.push(0x00);
  return Buffer.from([minCodeSize, ...subBlocks]);
}

// Generate frames
const frames = [];
for (let f = 0; f < NUM_FRAMES; f++) {
  const buf = new Uint8Array(WIDTH * HEIGHT); // all 0 (#080c14)

  // Subtle grid in content area (y = 50..270)
  for (let y = PADDING_TOP; y < CONTENT_BOTTOM; y += 24) {
    for (let x = 0; x < WIDTH; x += 32) {
      buf[y * WIDTH + x] = 2; // grid dot
    }
  }

  // Inner container outline with animated glowing corner accents
  drawRectOutline(buf, 20, 52, 600, 216, 2);
  drawRect(buf, 22, 54, 596, 212, 1);

  // Animated gradient wave strip at top of container
  const waveShift = (f / NUM_FRAMES) * 48;
  for (let x = 24; x < 616; x++) {
    const colIdx = 16 + Math.floor((x + waveShift * 4) % 48);
    buf[54 * WIDTH + x] = colIdx;
    buf[55 * WIDTH + x] = colIdx;
  }

  // Category Pill [FINOPS COMMITMENT SUITE]
  drawRect(buf, 36, 68, 190, 18, 15);
  drawRectOutline(buf, 36, 68, 190, 18, 4);
  // Status indicator dot (animated)
  const pulseColor = (f % 4 < 2) ? 8 : 9;
  drawRect(buf, 44, 74, 6, 6, pulseColor);
  drawText(buf, 'FINOPS ECOSYSTEM', 56, 73, 3, 1);

  // Main Header Text (scale = 2 -> 12px width per char)
  // "AWESOME RESERVED INSTANCE"
  drawText(buf, 'AWESOME RESERVED', 36, 96, 11, 2);
  drawText(buf, 'MANAGEMENT', 36, 116, 3, 2);

  // Subtitle
  drawText(buf, 'AUTONOMOUS COMMITMENTS  SAVINGS PLANS  SPOT OPTIMIZATION', 36, 142, 12, 1);

  // Platform badges
  // AWS
  drawRect(buf, 36, 160, 96, 18, 15);
  drawRectOutline(buf, 36, 160, 96, 18, 10);
  drawText(buf, 'AWS RI & SP', 44, 165, 10, 1);

  // AZURE
  drawRect(buf, 140, 160, 118, 18, 15);
  drawRectOutline(buf, 140, 160, 118, 18, 5);
  drawText(buf, 'AZURE RESERV', 148, 165, 3, 1);

  // GCP
  drawRect(buf, 266, 160, 84, 18, 15);
  drawRectOutline(buf, 266, 160, 84, 18, 7);
  drawText(buf, 'GCP CUDS', 274, 165, 6, 1);

  // SPOT
  drawRect(buf, 358, 160, 78, 18, 15);
  drawRectOutline(buf, 358, 160, 78, 18, 9);
  drawText(buf, 'SPOT K8S', 366, 165, 8, 1);

  // Right Side Metrics Card (y: 75..245, x: 450..605)
  drawRect(buf, 450, 75, 156, 172, 15);
  drawRectOutline(buf, 450, 75, 156, 172, 4);

  drawText(buf, 'EFFECTIVE SAVINGS', 460, 88, 12, 1);
  drawText(buf, 'UP TO 72%', 460, 104, 8, 2);

  // Mini dynamic chart bars
  const barHeights = [14, 22, 18, 30, 26, 38, 45, 52];
  for (let b = 0; b < barHeights.length; b++) {
    const animatedH = Math.min(52, Math.max(10, barHeights[b] + Math.round(Math.sin((f + b) * 0.8) * 8)));
    const bx = 460 + b * 17;
    const by = 185 - animatedH;
    drawRect(buf, bx, by, 12, animatedH, (b % 2 === 0) ? 3 : 6);
  }

  // Footer inside card
  drawRect(buf, 458, 205, 140, 26, 0);
  drawText(buf, '24/7 AUTONOMOUS', 466, 213, 14, 1);

  // Bottom info strip inside container
  drawRect(buf, 36, 195, 400, 52, 15);
  drawRectOutline(buf, 36, 195, 400, 52, 2);

  drawText(buf, 'MARKET: $7.8B-$15B FINOPS (MODERATELY FRAGMENTED)', 46, 206, 14, 1);
  drawText(buf, 'CATALOG: TOP SAAS PLATFORMS + OPEN-SOURCE TOOLS', 46, 224, 8, 1);

  frames.push(buf);
}

// Assemble GIF89a
const chunks = [];

// Header
chunks.push(Buffer.from('GIF89a'));

// Logical Screen Descriptor
const lsd = Buffer.alloc(7);
lsd.writeUInt16LE(WIDTH, 0);
lsd.writeUInt16LE(HEIGHT, 2);
lsd[4] = 0xF7; // Global Color Table present, 8 bits/pixel (256 colors)
lsd[5] = 0;    // Background color index (0)
lsd[6] = 0;    // Pixel aspect ratio
chunks.push(lsd);

// Global Color Table (256 * 3 bytes)
chunks.push(Buffer.from(palette));

// Netscape 2.0 Loop Extension
chunks.push(Buffer.from([
  0x21, 0xFF, 0x0B,
  0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30, // 'NETSCAPE2.0'
  0x03, 0x01, 0x00, 0x00, 0x00
]));

// Add Frames
for (let f = 0; f < NUM_FRAMES; f++) {
  // Graphic Control Extension
  chunks.push(Buffer.from([
    0x21, 0xF9, 0x04,
    0x00,       // disposal
    12, 0x00,   // delay time (12 * 10ms = 120ms)
    0x00,       // transparent color index
    0x00        // terminator
  ]));

  // Image Descriptor
  const id = Buffer.alloc(10);
  id[0] = 0x2C;
  id.writeUInt16LE(0, 1); // left
  id.writeUInt16LE(0, 3); // top
  id.writeUInt16LE(WIDTH, 5);
  id.writeUInt16LE(HEIGHT, 7);
  id[9] = 0x00; // no local color table
  chunks.push(id);

  // LZW Compressed Image Data
  chunks.push(lzwEncode(8, frames[f]));
}

// Trailer
chunks.push(Buffer.from([0x3B]));

const gifBuffer = Buffer.concat(chunks);
const outPath = path.join(__dirname, 'social-preview.gif');
fs.writeFileSync(outPath, gifBuffer);

console.log('GIF generated successfully at:', outPath);
console.log('GIF size in bytes:', gifBuffer.length);
console.log('GIF dimensions:', WIDTH, 'x', HEIGHT);
console.log('GIF strictly < 1MB:', gifBuffer.length < 1024 * 1024);
