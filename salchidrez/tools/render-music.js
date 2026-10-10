// Renderiza la música de Salchidrez a salchidrez/milonga.mp3
// Uso: NODE_PATH=$(npm root -g) node salchidrez/tools/render-music.js
// Requiere Playwright (Chromium) y ffmpeg con libmp3lame.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ path: path.join(__dirname, 'milonga.js') });
  const res = await page.evaluate(async () => {
    const buf = await Milonga.render();
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const pcm = new Int16Array(buf.length * 2);
    for (let i = 0; i < buf.length; i++) {
      pcm[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767;
      pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767;
    }
    const u8 = new Uint8Array(pcm.buffer);
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return { rate: buf.sampleRate, b64: btoa(s) };
  });
  await browser.close();

  const pcm = Buffer.from(res.b64, 'base64');
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
  hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(res.rate, 24);
  hdr.writeUInt32LE(res.rate * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
  hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
  const wav = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'milonga-')), 'milonga.wav');
  fs.writeFileSync(wav, Buffer.concat([hdr, pcm]));
  const out = path.join(__dirname, '..', 'milonga.mp3');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '112k', out]);
  console.log('OK', out, fs.statSync(out).size, 'bytes');
})();
