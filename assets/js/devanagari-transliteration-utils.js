/* =========================================================================
   Devanagari Transliteration Utilities
   - toTelugu(devStr): Devanagari -> Telugu, strict letter-for-letter
   - toIAST(devStr):   Devanagari -> IAST (Roman), no hyphens, sandhi-faithful
   Both are pure functions: same Devanagari in, same script out, every time.
   Feed them the *already sandhi-joined* Devanagari (no embedded spaces
   except real word breaks) and they will mirror those word breaks exactly.
   ========================================================================= */

/* ---------- Devanagari -> Telugu (1:1 Brahmic script mapping) ---------- */
const DEV2TEL = {
  'अ':'అ','आ':'ఆ','इ':'ఇ','ई':'ఈ','उ':'ఉ','ऊ':'ఊ','ऋ':'ఋ','ॠ':'ౠ','ऌ':'ఌ','ॡ':'ౡ',
  'ए':'ఏ','ऐ':'ఐ','ओ':'ఓ','औ':'ఔ',
  'क':'క','ख':'ఖ','ग':'గ','घ':'ఘ','ङ':'ఙ',
  'च':'చ','छ':'ఛ','ज':'జ','झ':'ఝ','ञ':'ఞ',
  'ट':'ట','ठ':'ఠ','ड':'డ','ढ':'ఢ','ण':'ణ',
  'त':'త','थ':'థ','द':'ద','ध':'ధ','न':'న',
  'प':'ప','फ':'ఫ','ब':'బ','भ':'భ','म':'మ',
  'य':'య','र':'ర','ल':'ల','व':'వ',
  'श':'శ','ष':'ష','स':'స','ह':'హ','ळ':'ళ',
  'ा':'ా','ि':'ి','ी':'ీ','ु':'ు','ू':'ూ','ृ':'ృ','ॄ':'ౄ','ॢ':'ౢ','ॣ':'ౣ',
  'े':'ే','ै':'ై','ो':'ో','ौ':'ౌ',
  'ं':'ం','ः':'ః','ँ':'ఁ','ऽ':'ఽ','्':'్',
  '।':'।','॥':'॥'
};
function toTelugu(devStr){
  let out = '';
  for(const ch of devStr){ out += (DEV2TEL[ch] !== undefined) ? DEV2TEL[ch] : ch; }
  return out;
}

/* ---------- Devanagari -> IAST (handles the inherent-'a' rule) ---------- */
const IAST_VOWEL_INDEP = {'अ':'a','आ':'ā','इ':'i','ई':'ī','उ':'u','ऊ':'ū','ऋ':'ṛ','ॠ':'ṝ','ऌ':'l̥','ॡ':'l̥̄','ए':'e','ऐ':'ai','ओ':'o','औ':'au'};
const IAST_MATRA = {'ा':'ā','ि':'i','ी':'ī','ु':'u','ू':'ū','ृ':'ṛ','ॄ':'ṝ','ॢ':'l̥','ॣ':'l̥̄','े':'e','ै':'ai','ो':'o','ौ':'au'};
const IAST_CONS = {'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'ṅ','च':'c','छ':'ch','ज':'j','झ':'jh','ञ':'ñ','ट':'ṭ','ठ':'ṭh','ड':'ḍ','ढ':'ḍh','ण':'ṇ','त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'ś','ष':'ṣ','स':'s','ह':'h','ळ':'ḻ'};
const IAST_SPECIAL = {'ं':'ṁ','ः':'ḥ','ँ':'̃','ऽ':"'"};
function toIAST(devStr){
  let out=''; let pending=false; // pending = "previous consonant still owes its inherent 'a'"
  for(const ch of devStr){
    if(IAST_CONS[ch] !== undefined){
      if(pending) out+='a';
      out += IAST_CONS[ch]; pending=true;
    } else if(ch==='्'){
      pending=false; // virama: suppress the inherent 'a'
    } else if(IAST_MATRA[ch] !== undefined){
      out += IAST_MATRA[ch]; pending=false;
    } else if(IAST_VOWEL_INDEP[ch] !== undefined){
      if(pending){ out+='a'; pending=false; }
      out += IAST_VOWEL_INDEP[ch];
    } else if(IAST_SPECIAL[ch] !== undefined){
      if(pending){ out+='a'; pending=false; }
      out += IAST_SPECIAL[ch];
    } else {
      if(pending){ out+='a'; pending=false; }
      out += ch; // space / punctuation passes through unchanged
    }
  }
  if(pending) out += 'a';
  return out;
}

function capFirst(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function titleCaseWords(s){ return s.split(' ').map(capFirst).join(' '); }

/* Node / browser interop */
if (typeof module !== 'undefined' && module.exports){
  module.exports = { toTelugu, toIAST, capFirst, titleCaseWords };
}
