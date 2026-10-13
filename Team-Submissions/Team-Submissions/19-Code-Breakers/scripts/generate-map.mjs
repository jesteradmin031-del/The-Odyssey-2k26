import { writeFileSync } from 'node:fs';
// A deliberately illustrative city backdrop, bundled for dependable offline demos.
// This drawing is NOT street data. The online layer uses attributed OpenStreetMap tiles.
const width = 1600,
  height = 1400;
const xy = (lng, lat) => [((lng - 77.565) / 0.067) * width, ((12.997 - lat) / 0.052) * height];
let seed = 123456;
const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="1600" height="1400" fill="#eeefe5"/><defs><pattern id="grain" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".4" fill="#d3dbc7" opacity=".4"/></pattern></defs>`;
for (let y = -20; y < 1400; y += 91) {
  for (let x = -30; x < 1600; x += 107) {
    const dx = random() * 12,
      dy = random() * 9;
    svg += `<rect x="${x + dx + 10}" y="${y + dy + 10}" width="${72 + random() * 15}" height="${57 + random() * 12}" rx="${5 + random() * 7}" fill="${random() > 0.7 ? '#e0e6d6' : '#e4e7db'}" stroke="#dce2d2" stroke-width="1"/>`;
    if (random() > 0.68)
      svg += `<rect x="${x + dx + 18}" y="${y + dy + 17}" width="22" height="16" rx="2" fill="#d9dfce"/>`;
  }
}
const major = [
  'M -80 650 C 230 490 480 530 735 585 S 1300 645 1670 400',
  'M 620 -100 C 715 300 715 555 615 845 S 540 1250 770 1500',
  'M -100 1000 C 280 950 620 1070 975 890 S 1290 490 1630 610',
  'M 1120 -50 C 1030 250 1160 530 1080 800 S 1140 1250 1320 1490',
  'M -40 250 C 360 365 745 140 1040 285 S 1320 340 1660 230',
];
major.forEach((d) => {
  svg += `<path d="${d}" fill="none" stroke="#d8ddca" stroke-width="24"/><path d="${d}" fill="none" stroke="#fcfcf4" stroke-width="18"/><path d="${d}" fill="none" stroke="#e5e6cf" stroke-width="1" stroke-dasharray="5 5"/>`;
});
const polygon = (points, fill) =>
  `<polygon points="${points.map((p) => xy(...p).join(',')).join(' ')}" fill="${fill}" stroke="#c5d7af" stroke-width="2"/>`;
svg += polygon(
  [
    [77.5878, 12.9785],
    [77.5938, 12.978],
    [77.5965, 12.9748],
    [77.5948, 12.9702],
    [77.59, 12.9705],
    [77.5881, 12.9735],
  ],
  '#d4e3bd',
);
svg += polygon(
  [
    [77.5783, 12.9548],
    [77.5862, 12.9557],
    [77.5907, 12.9505],
    [77.5859, 12.9465],
    [77.5779, 12.948],
  ],
  '#d1e1bb',
);
svg += polygon(
  [
    [77.581, 12.988],
    [77.585, 12.987],
    [77.586, 12.984],
    [77.5815, 12.983],
  ],
  '#d5e3c5',
);
const [parkX, parkY] = xy(77.592, 12.974);
svg += `<path d="M ${parkX - 65} ${parkY - 88} Q ${parkX + 20} ${parkY - 10} ${parkX - 25} ${parkY + 87} M ${parkX - 70} ${parkY + 50} L ${parkX + 66} ${parkY - 32}" stroke="#eff3df" stroke-width="8" fill="none"/>`;
for (let i = 0; i < 55; i++) {
  let x = parkX + (random() - 0.5) * 150,
    y = parkY + (random() - 0.5) * 150;
  svg += `<circle cx="${x}" cy="${y}" r="${3 + random() * 5}" fill="#b9d19b" opacity=".65"/>`;
}
const labels = [
  ['C U B B O N  P A R K', 77.592, 12.9727, 12, '#8da36b'],
  ['SHIVAJI NAGAR', 77.608, 12.988, 14, '#afb7a0'],
  ['V A S A N T H  N A G A R', 77.59, 12.988, 13, '#adb59e'],
  ['RICHMOND TOWN', 77.606, 12.961, 14, '#a7b095'],
  ['ASHOK NAGAR', 77.613, 12.971, 13, '#a9b39b'],
  ['SAMPANGI RAMA NAGAR', 77.585, 12.966, 12, '#a7b199'],
  ['LALBAGH BOTANICAL GARDEN', 77.5845, 12.951, 12, '#8ba269'],
  ['M G  R O A D', 77.609, 12.977, 10, '#a8af98'],
  ['K A S T U R B A  R O A D', 77.598, 12.971, 9, '#a6af95'],
  ['B E N G A L U R U', 77.599, 12.994, 18, '#bbc2ae'],
];
labels.forEach(([text, lng, lat, size, color]) => {
  const [x, y] = xy(lng, lat);
  svg += `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" text-anchor="middle" letter-spacing="1">${text}</text>`;
});
const [stadX, stadY] = xy(77.5995, 12.9788);
svg += `<ellipse cx="${stadX}" cy="${stadY}" rx="33" ry="27" fill="#c5d8b6" stroke="#fafbf2" stroke-width="9"/><ellipse cx="${stadX}" cy="${stadY}" rx="12" ry="19" fill="#d5e2bf"/><rect width="1600" height="1400" fill="url(#grain)" pointer-events="none"/></svg>`;
writeFileSync(new URL('../public/demo-map.svg', import.meta.url), svg);
console.log('Generated bundled illustrative map.');
