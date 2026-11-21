// news-image-20261121: one image summing up the world news of
// Saturday 21 November 2026. Pure Node 22 standard library only:
// a small raster canvas, a hand-drawn 5x7 bitmap font, and a
// hand-rolled PNG encoder (zlib + CRC32). No network, no randomness,
// no time or date reads, so two runs write byte-identical files.
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---- palette: a printed newspaper front page -----------------------
const PAPER = [247, 243, 232];
const INK = [16, 36, 62];
const NAVY = [16, 36, 62];
const WHITE = [255, 255, 255];
const RED = [178, 34, 34];
const BLUE = [31, 93, 164];
const GOLD = [201, 148, 42];
const TEAL = [18, 122, 110];
const SLATE = [84, 98, 114];
const LIGHT = [232, 226, 210];

// ---- canvas ---------------------------------------------------------
const px = new Uint8Array(W * H * 3);
function setPixel(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function fillRect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) setPixel(i, j, c);
  }
}
function fillCircle(cx, cy, r, c) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPixel(x, y, c);
    }
  }
}
function ring(cx, cy, r, t, c) {
  for (let y = cy - r - t; y <= cy + r + t; y++) {
    for (let x = cx - r - t; x <= cx + r + t; x++) {
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (Math.abs(d - r) <= t / 2) setPixel(x, y, c);
    }
  }
}
function line(x0, y0, x1, y1, c, thick = 1) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + (dx * s) / steps);
    const y = Math.round(y0 + (dy * s) / steps);
    for (let a = 0; a < thick; a++) {
      for (let b = 0; b < thick; b++) setPixel(x + a, y + b, c);
    }
  }
}
function triangle(x0, y0, x1, y1, x2, y2, c) {
  const minX = Math.min(x0, x1, x2), maxX = Math.max(x0, x1, x2);
  const minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
  const d = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((x1 - x) * (y2 - y) - (y1 - y) * (x2 - x)) / d;
      const b = ((x2 - x) * (y0 - y) - (y2 - y) * (x0 - x)) / d;
      const g = 1 - a - b;
      if (a >= 0 && b >= 0 && g >= 0) setPixel(x, y, c);
    }
  }
}

// ---- 5x7 bitmap font (uppercase, digits, punctuation) ---------------
// Each glyph is 7 rows of 5 bits, written as strings of 0/1.
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
};

// ---- text -----------------------------------------------------------
function textWidth(s, scale) {
  return s.length * 6 * scale - scale;
}
function drawText(s, x, y, scale, c) {
  const up = s.toUpperCase();
  let cx = x;
  for (const ch of up) {
    const g = FONT[ch] || FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") fillRect(cx + col * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
}
function drawTextCentered(s, cx, y, scale, c) {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}
// Greedy word wrap into lines that fit maxW pixels at the given scale.
function wrap(s, scale, maxW) {
  const words = s.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textWidth(trial, scale) <= maxW || !cur) cur = trial;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawLines(lines, x, y, scale, c, leading) {
  lines.forEach((ln, i) => drawText(ln, x, y + i * leading, scale, c));
}

// ---- PNG encoder ----------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePng() {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- pictorial scenes (one per story, drawn from shapes) ------------
function scenePoland(x, y, w, h) {
  fillRect(x, y, w, h, [214, 228, 240]); // pale sky
  fillRect(x, y + h - 26, w, 26, [120, 160, 110]); // fields
  // Polish flag on a pole, left
  line(x + 28, y + 14, x + 28, y + h - 26, INK, 3);
  fillRect(x + 31, y + 16, 62, 16, WHITE);
  fillRect(x + 31, y + 32, 62, 16, RED);
  // missile streaking down, right, with flame
  line(x + w - 24, y + 6, x + w - 70, y + 54, [90, 90, 90], 5);
  triangle(x + w - 70, y + 54, x + w - 84, y + 50, x + w - 76, y + 68, [255, 140, 40]);
  triangle(x + w - 70, y + 54, x + w - 58, y + 48, x + w - 62, y + 64, [255, 200, 60]);
  // impact burst on the ground
  fillCircle(x + w - 96, y + h - 30, 12, [255, 170, 50]);
  fillCircle(x + w - 96, y + h - 30, 6, [255, 220, 90]);
  // NATO-style shield, centre, with a white star
  fillRect(x + 112, y + 62, 40, 46, BLUE);
  triangle(x + 112, y + 108, x + 152, y + 108, x + 132, y + 128, BLUE);
  fillCircle(x + 132, y + 84, 7, WHITE);
  fillRect(x + 129, y + 78, 6, 12, BLUE);
  fillRect(x + 126, y + 81, 12, 6, BLUE);
}
function sceneUkraine(x, y, w, h) {
  fillRect(x, y, w, h, [24, 32, 54]); // night sky
  fillCircle(x + w - 30, y + 22, 10, [240, 230, 190]); // moon
  // skyline in dark blue
  fillRect(x + 10, y + h - 70, 34, 70, [52, 68, 96]);
  fillRect(x + 50, y + h - 92, 30, 92, [52, 68, 96]);
  fillRect(x + 86, y + h - 58, 40, 58, [52, 68, 96]);
  fillRect(x + 132, y + h - 80, 28, 80, [52, 68, 96]);
  // lit windows
  for (let i = 0; i < 5; i++) fillRect(x + 18 + i * 26, y + h - 58, 6, 8, GOLD);
  // explosion burst over the skyline
  fillCircle(x + 118, y + 34, 20, [255, 150, 40]);
  fillCircle(x + 118, y + 34, 12, [255, 210, 80]);
  fillCircle(x + 96, y + 44, 8, [255, 120, 30]);
  fillCircle(x + 140, y + 44, 8, [255, 120, 30]);
  // falling sparks
  line(x + 100, y + 60, x + 92, y + 78, GOLD, 2);
  line(x + 136, y + 60, x + 144, y + 78, GOLD, 2);
  line(x + 118, y + 56, x + 118, y + 76, GOLD, 2);
}
function sceneRiyadh(x, y, w, h) {
  fillRect(x, y, w, h, [232, 196, 150]); // dusk sky
  fillCircle(x + w - 34, y + 26, 14, [255, 240, 200]); // low sun
  // towers
  fillRect(x + 16, y + h - 78, 26, 78, [70, 70, 84]);
  fillRect(x + 48, y + h - 104, 22, 104, [70, 70, 84]);
  triangle(x + 48, y + h - 118, x + 70, y + h - 118, x + 59, y + h - 104, [70, 70, 84]);
  fillRect(x + 78, y + h - 62, 30, 62, [90, 90, 104]);
  fillRect(x + 116, y + h - 88, 24, 88, [70, 70, 84]);
  // interceptor arc rising to meet the missile
  line(x + 60, y + h - 20, x + 120, y + 30, WHITE, 3);
  line(x + 162, y + 10, x + 128, y + 34, RED, 5);
  // interception flash
  fillCircle(x + 126, y + 30, 13, [255, 255, 255]);
  fillCircle(x + 126, y + 30, 7, [255, 200, 60]);
  for (let i = 0; i < 4; i++) {
    fillRect(x + 20 + i * 24, y + h - 52, 5, 6, GOLD);
  }
}
function sceneAkvan(x, y, w, h) {
  fillRect(x, y, w, h, [176, 224, 222]); // storm sea-sky
  // cyclone spiral: concentric rings, centre left
  const cx = x + 78, cy = y + 58;
  ring(cx, cy, 44, 5, TEAL);
  ring(cx, cy, 30, 5, [255, 255, 255]);
  ring(cx, cy, 16, 5, TEAL);
  fillCircle(cx, cy, 7, WHITE);
  // rain slashes, right, kept inside the scene box
  for (let i = 0; i < 5; i++) {
    line(x + 124 + i * 7, y + 18 + (i % 2) * 14, x + 117 + i * 7, y + 40 + (i % 2) * 14, BLUE, 3);
  }
  // waves at the bottom
  for (let i = 0; i < 4; i++) {
    line(x + 8 + i * 48, y + h - 22, x + 30 + i * 48, y + h - 30, BLUE, 3);
    line(x + 30 + i * 48, y + h - 30, x + 52 + i * 48, y + h - 22, BLUE, 3);
  }
  // shelter roof, bottom right
  triangle(x + 128, y + h - 34, x + 176, y + h - 34, x + 152, y + h - 52, RED);
  fillRect(x + 134, y + h - 34, 36, 16, [120, 80, 50]);
}
function sceneMarkets(x, y, w, h) {
  fillRect(x, y, w, h, WHITE);
  // axes
  line(x + 18, y + 12, x + 18, y + h - 18, SLATE, 2);
  line(x + 18, y + h - 18, x + w - 12, y + h - 18, SLATE, 2);
  // falling chart line, red, stepped down
  const pts = [[26, 26], [58, 34], [86, 30], [112, 52], [138, 66], [164, 92]];
  for (let i = 0; i < pts.length - 1; i++) {
    line(x + pts[i][0], y + pts[i][1], x + pts[i + 1][0], y + pts[i + 1][1], RED, 4);
  }
  // down arrow at the end
  triangle(x + 158, y + 88, x + 176, y + 88, x + 167, y + 104, RED);
  // small bars underneath, shrinking
  fillRect(x + 30, y + h - 44, 14, 22, [190, 200, 212]);
  fillRect(x + 54, y + h - 36, 14, 14, [190, 200, 212]);
  fillRect(x + 78, y + h - 30, 14, 8, [190, 200, 212]);
  drawText("-3.7%", x + 108, y + 18, 2, RED);
}
function sceneCrypto(x, y, w, h) {
  fillRect(x, y, w, h, [120, 20, 20]); // deep red: a market in the red
  // falling bars, left: tall to short
  fillRect(x + 12, y + 58, 16, 60, [255, 90, 70]);
  fillRect(x + 34, y + 74, 16, 44, [255, 90, 70]);
  fillRect(x + 56, y + 90, 16, 28, [255, 90, 70]);
  // bitcoin coin, right
  fillCircle(x + 118, y + 58, 36, GOLD);
  ring(x + 118, y + 58, 36, 3, [255, 220, 130]);
  drawText("B", x + 106, y + 36, 4, [120, 20, 20]);
  // down arrow under the coin
  line(x + 118, y + 100, x + 118, y + 112, WHITE, 3);
  triangle(x + 106, y + 104, x + 130, y + 104, x + 118, y + 116, WHITE);
  drawText("-5%", x + 12, y + 14, 3, WHITE);
}

// ---- layout -----------------------------------------------------------
const STORIES = [
  {
    kicker: "POLAND / EUROPE", color: RED, scene: scenePoland,
    head: "RUSSIAN MISSILES LAND IN POLAND",
    cap: "Tusk: a deliberate provocation. NATO: a grave violation of allied airspace.",
  },
  {
    kicker: "UKRAINE / WAR", color: BLUE, scene: sceneUkraine,
    head: "OVERNIGHT BARRAGE KILLS 8 IN UKRAINE",
    cap: "28 hurt in the huge air attack. In Kryvyi Rih: 2 dead, 42 hurt, 4 children.",
  },
  {
    kicker: "SAUDI ARABIA / GULF", color: GOLD, scene: sceneRiyadh,
    head: "HOUTHI MISSILE STOPPED OVER RIYADH",
    cap: "Saudi defences intercept the attack a day after a Riyadh tower was hit.",
  },
  {
    kicker: "INDIA / WEATHER", color: TEAL, scene: sceneAkvan,
    head: "CYCLONE AKVAN HITS ODISHA COAST",
    cap: "Landfall near Gopalpur at 70-80 km/h. Over 300,000 people moved to shelters.",
  },
  {
    kicker: "MARKETS / WALL STREET", color: RED, scene: sceneMarkets,
    head: "STOCKS SLIDE INTO CORRECTION",
    cap: "Wall Street falls about 3.7% on Friday as AI shares plunge. The Dow drops 1,101 points.",
  },
  {
    kicker: "CRYPTO / MARKETS", color: RED, scene: sceneCrypto,
    head: "BITCOIN CRASHES BELOW $60,000",
    cap: "Ether down 7%, BNB 7%, SOL 5%. Liquidations hit $1.91B in a day.",
  },
];

function drawPanel(s, x, y, w, h) {
  fillRect(x, y, w, h, WHITE);
  // border
  fillRect(x, y, w, 3, SLATE); fillRect(x, y + h - 3, w, 3, SLATE);
  fillRect(x, y, 3, h, SLATE); fillRect(x + w - 3, y, 3, h, SLATE);
  // kicker strip
  fillRect(x + 3, y + 3, w - 6, 30, s.color);
  drawText(s.kicker, x + 14, y + 11, 2, WHITE);
  // pictorial scene, left
  s.scene(x + 12, y + 45, 164, 118);
  // headline, right of the scene
  const headLines = wrap(s.head, 3, w - 200);
  drawLines(headLines, x + 188, y + 48, 3, INK, 26);
  // caption, full width under the scene
  const capLines = wrap(s.cap, 2, w - 24);
  drawLines(capLines, x + 12, y + 176, 2, SLATE, 19);
}

function drawHeader() {
  fillRect(0, 0, W, 148, NAVY);
  fillRect(0, 148, W, 4, GOLD);
  drawText("SATURDAY 21 NOVEMBER 2026", 28, 26, 4, WHITE);
  drawText("THE WORLD IN ONE PICTURE", 28, 84, 2, GOLD);
  drawText("SIX STORIES THAT DEFINED THE DAY", 28, 112, 2, [190, 200, 214]);
  // globe, right of the header
  const gx = 924, gy = 74;
  ring(gx, gy, 46, 3, WHITE);
  ring(gx, gy, 46, 3, WHITE);
  line(gx - 46, gy, gx + 46, gy, WHITE, 2);
  line(gx, gy - 46, gx, gy + 46, WHITE, 2);
  // meridian ellipses, drawn as short vertical chords
  for (let k = -2; k <= 2; k++) {
    if (k === 0) continue;
    const off = k * 18;
    const half = Math.floor(Math.sqrt(46 * 46 - off * off) * 0.9);
    line(gx + off, gy - half, gx + off, gy + half, WHITE, 2);
  }
  fillCircle(gx - 18, gy - 14, 5, GOLD);
  fillCircle(gx + 20, gy + 16, 5, RED);
}

function drawFooter() {
  fillRect(0, 946, W, 64, NAVY);
  const s = "ALSO TODAY: JPMORGAN, VISA, MASTERCARD HIT BY CYBERATTACK * ICJ: MYANMAR COMMITTED GENOCIDE * TRUMP-XI-PUTIN SUMMIT: PLEDGES, NO BREAKTHROUGH";
  const lines = wrap(s, 2, W - 56);
  drawLines(lines, 28, 956, 2, WHITE, 20);
}

function main() {
  fillRect(0, 0, W, H, PAPER);
  drawHeader();
  const colW = 488, rowH = 246;
  STORIES.forEach((s, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    drawPanel(s, 16 + col * (colW + 16), 164 + row * (rowH + 16), colW, rowH);
  });
  drawFooter();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "out";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outDir + "/entry.png", encodePng());
}

main();
