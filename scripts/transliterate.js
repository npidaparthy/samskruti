#!/usr/bin/env node
/**
 * transliterate.js — Telugu → Devanagari + IAST converter.
 * Self-contained, no dependencies. Syllable-aware algorithm.
 *
 * Usage:
 *   node scripts/transliterate.js               # all data/**\/*.txt
 *   node scripts/transliterate.js path/file.txt # single file
 *   node scripts/transliterate.js --force        # regenerate existing
 */

'use strict';
const fs   = require('fs');
const path = require('path');

// ──────────────────────────────────────────────────────────────────────────────
// MAPPING TABLES  [telugu, devanagari, iast]
// Consonants listed WITHOUT inherent vowel — the algorithm adds 'a' only when
// no vowel sign or virama follows.
// ──────────────────────────────────────────────────────────────────────────────

const CONS = [
  // velar
  ['క','क','k'],  ['ఖ','ख','kh'], ['గ','ग','g'],  ['ఘ','घ','gh'], ['ఙ','ङ','ṅ'],
  // palatal
  ['చ','च','c'],  ['ఛ','छ','ch'], ['జ','ज','j'],  ['ఝ','झ','jh'], ['ఞ','ञ','ñ'],
  // retroflex
  ['ట','ट','ṭ'],  ['ఠ','ठ','ṭh'], ['డ','ड','ḍ'],  ['ఢ','ढ','ḍh'], ['ణ','ण','ṇ'],
  // dental
  ['త','त','t'],  ['థ','थ','th'], ['ద','द','d'],  ['ధ','ध','dh'], ['న','न','n'],
  // labial
  ['ప','प','p'],  ['ఫ','फ','ph'], ['బ','ब','b'],  ['భ','भ','bh'], ['మ','म','m'],
  // semivowels
  ['య','य','y'],  ['ర','र','r'],  ['ల','ल','l'],  ['వ','व','v'],
  // sibilants + h
  ['శ','श','ś'],  ['ష','ष','ṣ'],  ['స','स','s'],  ['హ','ह','h'],
  // special Telugu consonants
  ['ళ','ळ','ḷ'],  ['ఱ','र','r'],  ['ఴ','ऴ','ḻ'],
];

const VOWS = [
  // Independent vowels
  ['అ','अ','a'],  ['ఆ','आ','ā'],  ['ఇ','इ','i'],  ['ఈ','ई','ī'],
  ['ఉ','उ','u'],  ['ఊ','ऊ','ū'],  ['ఋ','ऋ','ṛ'],  ['ౠ','ॠ','ṝ'],
  ['ఌ','ऌ','ḷ'],
  ['ఎ','ए','e'],  ['ఏ','ए','ē'],  ['ఐ','ऐ','ai'],
  ['ఒ','ओ','o'],  ['ఓ','ओ','ō'],  ['ఔ','औ','au'],
  ['అం','अं','aṃ'], ['అః','अः','aḥ'],
];

const MATRA = [
  // Dependent vowel signs (matras)
  ['ా','ा','ā'],  ['ి','ि','i'],  ['ీ','ी','ī'],
  ['ు','ु','u'],  ['ూ','ू','ū'],  ['ృ','ृ','ṛ'],  ['ౄ','ॄ','ṝ'],
  ['ె','े','e'],  ['ే','े','ē'],  ['ై','ै','ai'],
  ['ొ','ो','o'],  ['ో','ो','ō'],  ['ౌ','ौ','au'],
];

const MISC = [
  ['ం','ं','ṃ'],   // anusvara
  ['ః','ः','ḥ'],   // visarga
  ['ఁ','ँ','m̐'],  // chandrabindu
  ['్','्',''],    // virama
  ['ఽ','ऽ',"'"],  // avagraha
  ['ౕ','',''],    // ignore rare marks
  ['ౖ','',''],
];

const DIGITS = [
  ['౦','०','0'],['౧','१','1'],['౨','२','2'],['౩','३','3'],['౪','४','4'],
  ['౫','५','5'],['౬','६','6'],['౭','७','7'],['౮','८','8'],['౯','९','9'],
];

// Dandas and punctuation
const PUNCT = { '।':'।', '॥':'॥', '|':'।', '||':'॥' };

// ──────────────────────────────────────────────────────────────────────────────
// BUILD LOOKUP MAPS
// ──────────────────────────────────────────────────────────────────────────────

const SA   = new Map();  // telugu → devanagari
const IAST = new Map();  // telugu → IAST
const CONS_SET = new Set();  // telugu consonant chars

for (const [te, sa, ia] of [...CONS, ...VOWS, ...MATRA, ...MISC, ...DIGITS]) {
  if (te) { SA.set(te, sa); IAST.set(te, ia); }
}
for (const [te] of CONS) CONS_SET.add(te);

// Sort keys longest-first for greedy matching
const ALL_KEYS = [...SA.keys()].sort((a, b) => b.length - a.length);

const VIRAMA_TE = '్';
const VIRAMA_SA = '्';

// ──────────────────────────────────────────────────────────────────────────────
// SYLLABLE-AWARE CONVERSION
// Algorithm:
//   1. Scan character by character using greedy longest-match.
//   2. When we see a consonant:
//      a. If followed by virama → output consonant (no inherent 'a')
//      b. If followed by matra  → output consonant + matra
//      c. Otherwise             → output consonant + inherent 'a'
//   3. Independent vowels, misc, digits pass through their maps directly.
// ──────────────────────────────────────────────────────────────────────────────

function convertLine(text, target) {
  const map = target === 'sa' ? SA : IAST;
  let out = '';
  let i   = 0;

  while (i < text.length) {
    // Try greedy longest match
    let matched = false;
    for (const key of ALL_KEYS) {
      if (text.startsWith(key, i)) {
        const isCons = CONS_SET.has(key);

        if (isCons) {
          const next = text[i + key.length];          // char immediately after consonant
          const next2 = text.slice(i + key.length, i + key.length + 2);

          if (next === VIRAMA_TE) {
            // Consonant + virama → pure consonant (halant in Devanagari)
            if (target === 'sa') {
              out += map.get(key) + VIRAMA_SA;
            } else {
              out += map.get(key);  // IAST: just the consonant letter, no 'a'
            }
            i += key.length + 1;  // consume consonant + virama
          } else if (next && SA.has(next) && !CONS_SET.has(next)) {
            // Check if next is a matra (dependent vowel sign)
            const isMatra = MATRA.some(([te]) => te === next);
            if (isMatra) {
              // Consonant + matra → consonant + vowel (no inherent 'a')
              out += map.get(key) + map.get(next);
              i += key.length + next.length;
            } else {
              // Misc char follows (anusvara, visarga etc.) — add inherent 'a'
              out += map.get(key) + (target === 'sa' ? '' : 'a');
              i += key.length;
            }
          } else {
            // Consonant at end or before another consonant → inherent 'a'
            out += map.get(key) + (target === 'sa' ? '' : 'a');
            i += key.length;
          }
        } else {
          // Non-consonant: vowel, matra, misc, digit
          out += (map.get(key) !== undefined ? map.get(key) : key);
          i += key.length;
        }

        matched = true;
        break;
      }
    }

    if (!matched) {
      out += text[i];  // pass through (ASCII, spaces, numbers, punctuation)
      i++;
    }
  }

  return out;
}

// ──────────────────────────────────────────────────────────────────────────────
// FILE PROCESSING
// ──────────────────────────────────────────────────────────────────────────────

const FORCE = process.argv.includes('--force');

function processFile(srcPath) {
  if (/_sa\.txt$/.test(srcPath) || /_iast\.txt$/.test(srcPath)) return;

  const saPath   = srcPath.replace(/\.txt$/, '_sa.txt');
  const iastPath = srcPath.replace(/\.txt$/, '_iast.txt');

  const content = fs.readFileSync(srcPath, 'utf8');

  // Detect script
  const teCount  = (content.match(/[\u0C00-\u0C7F]/g) || []).length;
  const devCount = (content.match(/[\u0900-\u097F]/g) || []).length;

  if (teCount === 0 && devCount === 0) {
    console.log(`  SKIP  ${path.basename(srcPath)} (no Indic text)`);
    return;
  }
  if (devCount > teCount) {
    console.log(`  SKIP  ${path.basename(srcPath)} (already Devanagari)`);
    return;
  }

  const lines = content.split(/\r?\n/);
  const saLines = [], iastLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Preserve structural tags and blank lines as-is
    if (trimmed === '' || trimmed.startsWith('#') ||
        trimmed.startsWith('[AUDIO_') || trimmed.startsWith('[TAG')) {
      saLines.push(line);
      iastLines.push(line);
    } else {
      saLines.push(convertLine(line, 'sa'));
      iastLines.push(convertLine(line, 'iast'));
    }
  }

  const writeSA   = FORCE || !fs.existsSync(saPath);
  const writeIAST = FORCE || !fs.existsSync(iastPath);

  if (writeSA)   { fs.writeFileSync(saPath,   saLines.join('\n'),   'utf8'); }
  if (writeIAST) { fs.writeFileSync(iastPath, iastLines.join('\n'), 'utf8'); }

  const tag = FORCE ? 'FORCE' : 'WROTE';
  if (writeSA)   console.log(`  ${tag}  ${path.basename(saPath)}`);
  if (writeIAST) console.log(`  ${tag}  ${path.basename(iastPath)}`);
  if (!writeSA && !writeIAST) console.log(`  SKIP  ${path.basename(srcPath)} (exists, use --force)`);
}

function findTxt(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findTxt(full));
    else if (e.isFile() && e.name.endsWith('.txt') && !e.name.includes('meaning')) out.push(full);
  }
  return out;
}

function findGenerated(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findGenerated(full));
    else if (e.isFile() && (/_sa\.txt$/.test(e.name) || /_iast\.txt$/.test(e.name))) out.push(full);
  }
  return out;
}

// MAIN
const rawArgs = process.argv.slice(2);

if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
  console.log(`
transliterate.js — Telugu → Devanagari + IAST converter

Usage:
  node scripts/transliterate.js                  # transliterate all data/**/*.txt (skip existing)
  node scripts/transliterate.js --force          # regenerate all, overwrite existing
  node scripts/transliterate.js --clean          # delete all generated _sa.txt and _iast.txt
  node scripts/transliterate.js --clean --force  # delete then regenerate fresh
  node scripts/transliterate.js <file.txt>       # transliterate a single file

Notes:
  - Files matching *meaning* are skipped
  - Generated files (_sa.txt, _iast.txt) are git-ignored
  - CI stamps the cache version and runs this automatically on every push
`);
  process.exit(0);
}

const force   = rawArgs.includes('--force');
const clean   = rawArgs.includes('--clean');
const args    = rawArgs.filter(a => a !== '--force' && a !== '--clean');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) { console.error('data/ not found'); process.exit(1); }

if (clean) {
  const generated = findGenerated(dataDir);
  if (!generated.length) {
    console.log('No generated files found.\n');
  } else {
    console.log(`Removing ${generated.length} generated file(s)...`);
    for (const f of generated) { fs.unlinkSync(f); console.log(`  deleted ${path.relative(dataDir, f)}`); }
    console.log('');
  }
}

if (args.length) {
  for (const f of args) {
    if (fs.existsSync(f)) { console.log(`Processing: ${f}`); processFile(f); }
    else console.error(`Not found: ${f}`);
  }
} else if (!clean || rawArgs.includes('--force')) {
  const files = findTxt(dataDir);
  console.log(`Found ${files.length} source .txt files\n`);
  for (const f of files) processFile(f);
  console.log('\nDone.');
}
