// Share card generator — palm leaf manuscript design
// Draws a 1080×1080 PNG on an off-screen canvas and shares or downloads it.

window.ShareCard = (() => {
  const S   = 1080;
  const PAD = 72;
  const INK  = '#1A0A02';
  const INK2 = '#3A2010';

  const Z = {
    borderTop:  100,
    source:     148,
    verseStart: 230,
    meaningHead: 480,
    meaningText: 528,
    tatpHead:   690,
    tatpText:   738,
    borderBot:  960,
    footerY:   1010,
  };

  function _noise(ctx, w, h, alpha) {
    const id = ctx.createImageData(w, h);
    const d  = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255;
      d[i] = d[i+1] = d[i+2] = v;
      d[i+3] = alpha;
    }
    ctx.putImageData(id, 0, 0);
  }

  function _sectionHeading(ctx, label, x, y, color) {
    ctx.save();
    ctx.font = 'bold 30px "Georgia", serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    const tw = ctx.measureText(label).width;
    const lx = x - tw / 2;
    ctx.fillText(label, lx, y);
    const ruleGap = 18, ruleLen = 80;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(lx - ruleGap - ruleLen, y - 8); ctx.lineTo(lx - ruleGap, y - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx + tw + ruleGap, y - 8); ctx.lineTo(lx + tw + ruleGap + ruleLen, y - 8); ctx.stroke();
    ctx.restore();
  }

  function _wrap(ctx, text, x, y, maxW, lineH, maxLines) {
    const words = text.split(' ');
    let line = '', cy = y, count = 0;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        if (maxLines && count >= maxLines - 1) { ctx.fillText(line.trim() + '…', x, cy); return cy + lineH; }
        ctx.fillText(line.trim(), x, cy);
        line = word + ' '; cy += lineH; count++;
      } else { line = test; }
    }
    if (line.trim()) ctx.fillText(line.trim(), x, cy);
    return cy + lineH;
  }

  // Fold 4-pada verse into 2 lines
  function _normVerse(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 4) return `${lines[0]} ${lines[1]}\n${lines[2]} ${lines[3]}`;
    if (lines.length === 3) return `${lines[0]} ${lines[1]}\n${lines[2]}`;
    return text;
  }

  function _draw(canvas, data) {
    const ctx = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, S, S);
    bg.addColorStop(0,   '#C8943A');
    bg.addColorStop(0.3, '#D4A040');
    bg.addColorStop(0.6, '#C08030');
    bg.addColorStop(1,   '#A86820');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);

    // Vein streaks
    for (let i = 0; i < 18; i++) {
      const y = Math.random() * S;
      const a = 0.03 + Math.random() * 0.055;
      ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? '255,200,100' : '80,30,0'},${a})`;
      ctx.lineWidth = 1 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(S*0.3, y+(Math.random()-.5)*12, S*0.7, y+(Math.random()-.5)*12, S, y);
      ctx.stroke();
    }

    // Grain
    const off = document.createElement('canvas');
    off.width = S; off.height = S;
    _noise(off.getContext('2d'), S, S, 28);
    ctx.drawImage(off, 0, 0);

    // Vignette
    const vig = ctx.createRadialGradient(S/2, S/2, S*0.32, S/2, S/2, S*0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(30,8,0,0.42)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, S, S);

    // Binding hole
    ctx.save();
    ctx.beginPath(); ctx.arc(S/2, 52, 20, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(20,6,0,0.55)'; ctx.fill();
    ctx.strokeStyle = 'rgba(100,50,10,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    // Border lines
    ctx.strokeStyle = 'rgba(80,30,5,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PAD, Z.borderTop); ctx.lineTo(S-PAD, Z.borderTop); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, Z.borderBot); ctx.lineTo(S-PAD, Z.borderBot); ctx.stroke();

    // Source line
    ctx.font = '500 25px "Georgia", serif';
    ctx.fillStyle = INK2; ctx.textAlign = 'center';
    ctx.fillText((data.source || '').toUpperCase(), S/2, Z.source);

    // Verse — 2 lines
    const verseText = _normVerse(data.verse || '');
    const verseLines = verseText.split('\n');
    const VFS = data.script === 'iast' ? 46 : 50;
    ctx.font = `500 ${VFS}px "Noto Sans Telugu","Noto Serif Devanagari","Georgia",serif`;
    ctx.fillStyle = INK; ctx.textAlign = 'center';
    let vy = Z.verseStart;
    for (const line of verseLines) { ctx.fillText(line, S/2, vy); vy += VFS * 2.0; }

    // Meaning
    _sectionHeading(ctx, 'అర్థం  ·  MEANING', S/2, Z.meaningHead, '#6B1A00');
    ctx.font = '500 32px "Noto Sans Telugu","Georgia",serif';
    ctx.fillStyle = INK; ctx.textAlign = 'center';
    _wrap(ctx, data.meaning || '', S/2, Z.meaningText, S - PAD*2.2, 50, 3);

    // Tatparyam
    _sectionHeading(ctx, 'తాత్పర్యం  ·  COMMENTARY', S/2, Z.tatpHead, '#1A3A20');
    ctx.font = '500 28px "Noto Sans Telugu","Georgia",serif';
    ctx.fillStyle = INK2; ctx.textAlign = 'center';
    _wrap(ctx, data.tatparyam || '', S/2, Z.tatpText, S - PAD*2.2, 46, 3);

    // Footer
    ctx.font = '600 28px "Noto Sans Telugu","Noto Serif Devanagari","Georgia",serif';
    ctx.fillStyle = INK; ctx.textAlign = 'left';
    ctx.fillText('సంస్కృతి · संस्कृति', PAD, Z.footerY);
    ctx.font = '500 26px "Georgia",serif';
    ctx.fillStyle = INK2; ctx.textAlign = 'right';
    ctx.fillText('https://samskruti.info', S - PAD, Z.footerY);
  }

  async function share(data) {
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    _draw(canvas, data);

    const filename = `subhashitam-${data.slug || 'verse'}.png`;

    if (navigator.share && navigator.canShare) {
      try {
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'సుభాషితం', text: 'samskruti.info' });
          return;
        }
      } catch (e) {
        if (e.name === 'AbortError') return; // user cancelled
      }
    }

    // Desktop fallback — download
    const a = document.createElement('a');
    a.download = filename;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  return { share };
})();
