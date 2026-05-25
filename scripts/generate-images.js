#!/usr/bin/env node
/**
 * generate-images.js — Creates SVG placeholder images for each stotram.
 * No external deps. Outputs to assets/images/{slug}-01.svg etc.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const IMAGES = [
  {
    slug: 'vishnu-sahasranamam',
    title: 'విష్ణు సహస్రనామం',
    subtitle: 'Vishnu Sahasranamam',
    symbol: 'ॐ',
    bg1: '#0D1259', bg2: '#1A237E', bg3: '#3949AB',
    accent: '#FFD700', textCol: '#FFFFFF',
    variants: [
      { file: '01', symbol: 'ॐ',    label: 'నమో నారాయణాయ' },
      { file: '02', symbol: 'श्री', label: 'శ్రీ విష్ణవే నమః' },
      { file: '03', symbol: '🪷',   label: 'సహస్ర నామ పూజ'  },
    ]
  },
  {
    slug: 'lalita-sahasranamam',
    title: 'లలితా సహస్రనామం',
    subtitle: 'Lalita Sahasranamam',
    symbol: 'श्री',
    bg1: '#560027', bg2: '#880E4F', bg3: '#AD1457',
    accent: '#F8BBD0', textCol: '#FFFFFF',
    variants: [
      { file: '01', symbol: 'श्री',  label: 'శ్రీ లలితాయై నమః'   },
      { file: '02', symbol: 'ॐ',    label: 'త్రిపురసుందరి'        },
      { file: '03', symbol: '✦',    label: 'శ్రీ చక్ర పూజ'        },
    ]
  },
  {
    slug: 'soundaryalahari',
    title: 'సౌందర్యలహరి',
    subtitle: 'Soundaryalahari',
    symbol: 'శ',
    bg1: '#3E0052', bg2: '#6A1B9A', bg3: '#8E24AA',
    accent: '#EE82EE', textCol: '#FFFFFF',
    variants: [
      { file: '01', symbol: 'ॐ',   label: 'ఆది శంకరాచార్య'     },
      { file: '02', symbol: 'श्री', label: 'సౌందర్య లహరి'       },
    ]
  },
  {
    slug: 'surya-siddhanta',
    title: 'సూర్యసిద్ధాంతం',
    subtitle: 'Surya Siddhanta',
    symbol: '☀',
    bg1: '#7F2700', bg2: '#E65100', bg3: '#F4511E',
    accent: '#FFCC02', textCol: '#FFFFFF',
    variants: [
      { file: '01', symbol: '☀',   label: 'జ్యోతిష్య శాస్త్రం'  },
      { file: '02', symbol: 'ॐ',   label: 'సూర్య సిద్ధాంతం'     },
    ]
  },
];

function makeSVG(cfg, variant) {
  const { bg1, bg2, bg3, accent, textCol, title, subtitle } = cfg;
  const { symbol, label } = variant;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${bg1}"/>
      <stop offset="50%"  stop-color="${bg2}"/>
      <stop offset="100%" stop-color="${bg3}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="40%">
      <stop offset="0%"   stop-color="${accent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="500" fill="url(#bg)"/>
  <rect width="800" height="500" fill="url(#glow)"/>

  <!-- Decorative border -->
  <rect x="16" y="16" width="768" height="468" rx="12"
        fill="none" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.4"/>
  <rect x="24" y="24" width="752" height="452" rx="8"
        fill="none" stroke="${accent}" stroke-width="0.5" stroke-opacity="0.25"/>

  <!-- Corner ornaments -->
  <g fill="${accent}" fill-opacity="0.5" font-size="20">
    <text x="30" y="52">✦</text>
    <text x="756" y="52">✦</text>
    <text x="30" y="486">✦</text>
    <text x="756" y="486">✦</text>
  </g>

  <!-- Decorative circles -->
  <circle cx="400" cy="250" r="180" fill="none" stroke="${accent}"
          stroke-width="0.75" stroke-opacity="0.15"/>
  <circle cx="400" cy="250" r="140" fill="none" stroke="${accent}"
          stroke-width="0.5" stroke-opacity="0.1"/>

  <!-- Main symbol -->
  <text x="400" y="280" font-size="130" text-anchor="middle"
        font-family="serif" fill="${accent}" fill-opacity="0.9"
        filter="url(#blur)" opacity="0.4">${symbol}</text>
  <text x="400" y="280" font-size="130" text-anchor="middle"
        font-family="serif" fill="${accent}" fill-opacity="0.92">${symbol}</text>

  <!-- Title (Telugu) -->
  <text x="400" y="370" font-size="26" text-anchor="middle"
        font-family="Noto Sans Telugu, sans-serif"
        fill="${textCol}" fill-opacity="0.95"
        letter-spacing="1">${title}</text>

  <!-- Subtitle (English) -->
  <text x="400" y="402" font-size="15" text-anchor="middle"
        font-family="Georgia, serif" font-style="italic"
        fill="${accent}" fill-opacity="0.8">${subtitle}</text>

  <!-- Label / mantra line -->
  <text x="400" y="448" font-size="13" text-anchor="middle"
        font-family="Noto Sans Telugu, sans-serif"
        fill="${textCol}" fill-opacity="0.55">${label}</text>
</svg>`;
}

// Icon SVG (192×192 for PWA)
function makeIcon(symbol, bg1, bg2, accent) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
  </defs>
  <rect width="192" height="192" rx="32" fill="url(#bg)"/>
  <text x="96" y="125" font-size="88" text-anchor="middle"
        font-family="serif" fill="${accent}">${symbol}</text>
</svg>`;
}

// Output directories
const imgDir  = path.join(__dirname, '..', 'assets', 'images');
const iconDir = path.join(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(imgDir,  { recursive: true });
fs.mkdirSync(iconDir, { recursive: true });

for (const cfg of IMAGES) {
  for (const variant of cfg.variants) {
    const filename = `${cfg.slug}-${variant.file}.svg`;
    const outPath  = path.join(imgDir, filename);
    fs.writeFileSync(outPath, makeSVG(cfg, variant));
    console.log(`  WROTE  assets/images/${filename}`);
  }
}

// PWA icons
const vishnu = IMAGES[0];
fs.writeFileSync(path.join(iconDir, 'icon-192.svg'),
  makeIcon(vishnu.symbol, vishnu.bg1, vishnu.bg2, vishnu.accent));
fs.writeFileSync(path.join(iconDir, 'icon-512.svg'),
  makeIcon(vishnu.symbol, vishnu.bg1, vishnu.bg2, vishnu.accent).replace('192','512').replace(/width="192"/g,'width="512"').replace(/height="192"/g,'height="512"').replace(/rx="32"/,'rx="64"').replace('96','256').replace('125','330').replace('88','230'));
console.log('  WROTE  assets/icons/icon-192.svg');
console.log('  WROTE  assets/icons/icon-512.svg');
console.log('\nDone.');
