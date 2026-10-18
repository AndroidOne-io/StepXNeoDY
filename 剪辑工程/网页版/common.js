// 本片公共部分：配色、时间线查询、视频取帧、出镜口播、标题/徽章、转场（对折）、整帧合成 frame(t)
'use strict';
const { W, H, seg, lerp, ease, easeOut, easeIn, backOut, clamp, rgb } = E;
const EV = D.EV, PRE = D.PRE;
const C = {                                           // 配色：现实世界 = 石墨黑 + STEPX 橙；梦境世界 = 深梅紫 + 粉 + 冰蓝
  INK: [11, 11, 15], GRAPH: [24, 24, 30], ORANGE: [255, 106, 31], AMBER: [255, 179, 71], WHITE: [244, 244, 247],
  PLUM: [26, 11, 31], PINK: [255, 95, 162], LILAC: [185, 140, 255], ICE: [111, 227, 255], MINT: [94, 234, 180], GOLD: [255, 210, 120],
};
const VIS = {};                                       // 镜号 → (ctx, t) 画面函数
const S = {}; D.shots.forEach(s => { s.dur = s.end - s.start; S[s.i] = s; });
const shotAt = t => D.shots.find(s => s.start <= t && t < s.end) || (t < 0 ? D.shots[0] : D.shots[D.shots.length - 1]);
const img = n => E.img(n);
const NORM = s => (s.match(/[一-鿿]|[A-Za-z]+|\d/g) || []);
function wt(i, word, k = 0) {                         // 第 i 镜里这个词第一个字被说出来的时刻（和 build.py 的 wt 一样）
  const s = S[i]; let p = -1; for (let j = 0; j <= k; j++) p = s.text.indexOf(word, p + 1);
  return s.chars[NORM(s.text.slice(0, p)).length];
}

// ------------------------------------------------------------------ 视频素材（sources.js）：?proxy 用测试代理，?export 用导出副本
(() => {
  const q = location.search, m = {};
  for (const k in window.VSRC) m[k] = /[?&]proxy\b/.test(q) ? `_proxy/${k}.webm` : /[?&]export\b/.test(q) ? `_export/${k}.mp4` : '../../' + window.VSRC[k];
  E.setVideoSources(m);
})();
// 取视频某一时刻的画面（返回可直接画的画布/视频）；rate 为播放速度
const V = (key, ts, rate = 1, slot = 0) => E.video(key, ts, rate, slot);
// 归一化裁切 [x,y,w,h]（0–1）→ 源像素，代理素材分辨率不同也能对上
function px(src, r) { const [w, h] = E.sizeOf(src); return [r[0] * w, r[1] * h, r[2] * w, r[3] * h]; }
// 铺满全屏的一段素材：key, 素材起点, 速度；crop 去掉原片烧录的字幕/水印；push 慢推；grade 调色
function full(ctx, key, ts, o = {}) {
  const { rate = 1, crop = null, z = 1, fx = 0.5, fy = 0.5, sat = 1, dim = 1, warm = false } = o;
  const v = V(key, ts, rate); if (!E.ready(v)) { ctx.fillStyle = '#101014'; ctx.fillRect(0, 0, W, H); return; }
  E.zoomBegin(ctx, z, fx, fy); E.cover(ctx, v, 0, 0, W, H, 0.5, 0.5, crop ? px(v, crop) : null); E.zoomEnd(ctx);
  if (sat < 1 || dim < 1 || warm) E.grade(ctx, 0, 0, W, H, sat, dim, warm);
}
// 一组镜头按时间点硬切：clips = [[起始时刻, (ctx, t, t0, dur) => 画]]，取 t 所在的那一个；dur = 到下一个镜头（或本句结束）的时长
function cutList(ctx, t, clips, tEnd) {
  let k = 0; for (let j = 0; j < clips.length; j++) if (t >= clips[j][0]) k = j;
  const end = k + 1 < clips.length ? clips[k + 1][0] : (tEnd !== undefined ? tEnd : shotAt(t).end);
  clips[k][1](ctx, t, clips[k][0], Math.max(0.2, end - clips[k][0])); return k;
}
// 案例原片：去掉底部烧录字幕和右上角水印
const CASE_CROP = [0.07, 0.085, 0.86, 0.765];
// 原片里的一个镜头 [a, b]（原片秒数，按场景切点量好的）：放得下就居中截取，放不下就放慢（最慢 0.55 倍），绝不跨到别的镜头
const clip = (key, a, b, o = {}) => (ctx, t, t0, dur) => {
  const avail = b - a - 0.08; let rate = o.rate || 1; if (dur * rate > avail) rate = Math.max(0.55, avail / dur);
  const start = a + 0.04 + Math.max(0, avail - dur * rate) * (o.align === undefined ? 0.5 : o.align);
  const ts = Math.min(start + (t - t0) * rate, b - 0.06);
  full(ctx, key, ts, Object.assign({ crop: CASE_CROP }, o, { rate, z: (o.z || 1) * (1 + (o.push === undefined ? 0.05 : o.push) * clamp((t - t0) / Math.max(dur, 0.5), 0, 1)) }));
};

// ------------------------------------------------------------------ 出镜口播（cam）：按 pieces 把时间线时间换成原片时间
const CAM_P = D.pieces.filter(p => p[0] === 'cam');
function camTs(t) {
  let best = CAM_P[0];
  for (const p of CAM_P) if (p[3] <= t + 1e-6) best = p;
  const i = CAM_P.indexOf(best), nxt = CAM_P[i + 1];
  let ts = best[1] + (t - best[3]);
  if (nxt) ts = Math.min(ts, nxt[1] - 0.04);            // 停顿时继续放原片，但不跑进下一句
  return Math.max(0, ts);
}
// 出镜画面：z 景别（1 = 原始），fy 构图中心；4K 原片，推近不糊
function host(ctx, t, z = 1, fx = 0.5, fy = 0.42) {
  const v = V('cam', camTs(t), 1);
  if (!E.ready(v)) { ctx.fillStyle = '#1b1712'; ctx.fillRect(0, 0, W, H); return; }
  E.zoomBegin(ctx, z, fx, fy); E.cover(ctx, v, 0, 0, W, H); E.zoomEnd(ctx);
}
// 景别跳切：jumps = [[时刻, 景别], ...]，每段内再轻微推 1.5%
function hostJ(ctx, t, jumps, fy = 0.42) {
  let z = jumps[0][1], t0 = jumps[0][0];
  for (const [a, zz] of jumps) if (t >= a) { z = zz; t0 = a; }
  host(ctx, t, z * (1 + 0.015 * clamp((t - t0) / 4, 0, 1)), 0.5, fy);
}

// ------------------------------------------------------------------ 背景
const bg = (ctx, name, a = 1) => { const im = img(name); if (E.ready(im)) { ctx.save(); ctx.globalAlpha = a; ctx.drawImage(im, 0, 0, W, H); ctx.restore(); } else { ctx.fillStyle = '#121216'; ctx.fillRect(0, 0, W, H); } };
// 图片铺满 + 缓慢推拉（Ken Burns）；竖图用模糊放大的自己垫底
function photo(ctx, name, u, o = {}) {
  const { z0 = 1.05, z1 = 1.15, fy0 = 0.5, fy1 = 0.5, fx = 0.5, blurBg = true } = o;
  const im = img(name); if (!E.ready(im)) return;
  const [iw, ih] = E.sizeOf(im);
  if (blurBg && iw / ih < W / H * 0.9) { E.blurDraw(ctx, im, 26, 0, 0, W, H, 0.85); E.fill(ctx, '#000', 0.35); }
  const z = lerp(z0, z1, u), fy = lerp(fy0, fy1, u);
  E.zoomBegin(ctx, z, fx, 0.5); E.cover(ctx, im, 0, 0, W, H, fx, fy); E.zoomEnd(ctx);
}

// ------------------------------------------------------------------ 字：标题、徽章、高亮（离屏渲染后缓存，播放时只贴图）
const _txt = {};
function title(key, str, o = {}) {                 // 返回一张画好的标题画布
  if (_txt[key]) return _txt[key];
  const { size = 150, font = 'Title', fill = ['#ffffff', '#ffd9b8'], stroke = 0, glow = C.ORANGE, glowK = 0.55, shadow = 0.6, sub = null, subSize = 54, subFill = '#f4f4f7', spacing = 4 } = o;
  const c = document.createElement('canvas'), g = c.getContext('2d');
  g.font = `${size}px ${font}`; try { g.letterSpacing = spacing + 'px'; } catch (e) {}
  const w1 = g.measureText(str).width; let w2 = 0;
  if (sub) { g.font = `${subSize}px Title`; w2 = g.measureText(sub).width; }
  c.width = Math.ceil(Math.max(w1, w2) + 160); c.height = Math.ceil(size * 1.45 + (sub ? subSize * 1.7 : 0) + 60);
  g.textAlign = 'center'; g.textBaseline = 'middle'; const cx = c.width / 2, cy = 30 + size * 0.72;
  g.font = `${size}px ${font}`; try { g.letterSpacing = spacing + 'px'; } catch (e) {}
  const gr = g.createLinearGradient(0, cy - size / 2, 0, cy + size / 2); fill.forEach((f, i) => gr.addColorStop(i / Math.max(1, fill.length - 1), f));
  g.shadowColor = `rgba(0,0,0,${shadow})`; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = gr; g.fillText(str, cx, cy);
  if (glow) { g.shadowColor = rgb(glow, 1, glowK); g.shadowBlur = 44; g.shadowOffsetY = 0; g.fillText(str, cx, cy); }
  g.shadowColor = 'transparent';
  if (stroke) { g.lineWidth = stroke; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.strokeText(str, cx, cy); }
  g.fillStyle = gr; g.fillText(str, cx, cy);
  if (sub) { g.font = `${subSize}px Title`; try { g.letterSpacing = '6px'; } catch (e) {} g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 14; g.shadowOffsetY = 4; g.fillStyle = subFill; g.fillText(sub, cx, cy + size * 0.62 + subSize * 0.85); }
  return (_txt[key] = c);
}
// 标注（人名、作品名、步骤）：左边一道发光色条 + 干净的黑体字 + 下面一道渐隐细线，背后只有一层很淡的暗影，不用胶囊框
const SANS = '"PingFang SC","Noto Sans CJK SC","Noto Sans SC","Microsoft YaHei",sans-serif';
function badge(key, str, o = {}) {
  if (_txt[key]) return _txt[key];
  const { size = 46, col = C.ORANGE, dot = true, textCol = '#ffffff', bgA = 1, weight = 600 } = o;
  const fs = Math.round(size * 0.95), c = document.createElement('canvas'), g = c.getContext('2d');
  const F = `${weight} ${fs}px ${SANS}`; g.font = F; try { g.letterSpacing = '3px'; } catch (e) {}
  const tw = g.measureText(str).width, barW = dot ? 6 : 0, gap = dot ? 22 : 0, padX = 26, h = fs * 2.0;
  const w = padX + barW + gap + tw + padX * 1.6; c.width = Math.ceil(w + 60); c.height = Math.ceil(h + 60);
  const x = 30, y = 30, cy = y + h / 2;
  const sh = g.createLinearGradient(x, 0, x + w, 0);                       // 背后淡淡一层暗影，往右渐隐
  sh.addColorStop(0, `rgba(8,8,12,${0.55 * bgA})`); sh.addColorStop(0.7, `rgba(8,8,12,${0.35 * bgA})`); sh.addColorStop(1, 'rgba(8,8,12,0)');
  g.fillStyle = sh; g.fillRect(x, y, w, h);
  if (dot) { g.shadowColor = rgb(col, 1, 0.9); g.shadowBlur = 16; g.fillStyle = rgb(col); g.fillRect(x + padX, cy - fs * 0.62, barW, fs * 1.24); g.shadowColor = 'transparent'; }
  const tx = x + padX + barW + gap;
  const ln = g.createLinearGradient(tx, 0, tx + tw + padX, 0); ln.addColorStop(0, rgb(col, 1, 0.85)); ln.addColorStop(1, rgb(col, 1, 0));
  g.fillStyle = ln; g.fillRect(tx, cy + fs * 0.78, tw + padX, 2);           // 字下面一道细线
  g.font = F; try { g.letterSpacing = '3px'; } catch (e) {} g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,0.65)'; g.shadowBlur = 12; g.shadowOffsetY = 3; g.fillStyle = textCol; g.fillText(str, tx, cy + 1);
  return (_txt[key] = c);
}
// 作者署名（用了别人的视频要注明来源）：照抖音习惯写「@作者」，和字幕同一款字、同样的黑描边，没有框、没有色条
function credit(ctx, t, t0, t1, str) {
  const a = seg(t, t0, t0 + 0.25) * (1 - seg(t, t1 - 0.25, t1)); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.font = '56px Sub'; ctx.textBaseline = 'middle'; try { ctx.letterSpacing = '1.5px'; } catch (e) {}
  ctx.lineJoin = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = 'rgb(8,10,16)'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
  ctx.strokeText(str, 96, 92); ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgb(242,245,250)'; ctx.fillText(str, 96, 92); ctx.restore();
}
// 印章（拍板、校验通过）
function stamp(key, str, col = C.ORANGE) {
  if (_txt[key]) return _txt[key];
  const c = document.createElement('canvas'); c.width = 620; c.height = 260; const g = c.getContext('2d');
  g.translate(310, 130); g.lineWidth = 10; g.strokeStyle = rgb(col); g.beginPath(); g.roundRect(-280, -100, 560, 200, 26); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.roundRect(-262, -82, 524, 164, 16); g.stroke();
  g.font = '112px Title'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = rgb(col);
  try { g.letterSpacing = '10px'; } catch (e) {}
  // 包含字距和勾号的实际字形边界；内框四边保留留白，长文案等比缩小。
  const m = g.measureText(str), left = m.actualBoundingBoxLeft, right = m.actualBoundingBoxRight;
  const ascent = m.actualBoundingBoxAscent, descent = m.actualBoundingBoxDescent;
  const scale = Math.min(1, 476 / Math.max(m.width, left + right), 116 / (ascent + descent));
  g.save(); g.scale(scale, scale);
  g.fillText(str, (left - right) / 2, (ascent - descent) / 2); g.restore();
  return (_txt[key] = c);
}
// 大标题单独出现：从 1.25 倍砸下 + 闪一下 + 震动；t0 为落点
function slam(ctx, t, t0, im, x = W / 2, y = H / 2, o = {}) {
  const { s0 = 1.25, dur = 0.24, flash = 0.35, shake = 0.7, drift = 0.012 } = o, q = t - t0; if (q < 0) return;
  const u = seg(q, 0, dur); E.put(ctx, im, x, y, easeOut(u, 2), (s0 - (s0 - 1) * easeOut(u, 4)) * (1 + drift * q));
  if (flash) E.flash(ctx, Math.max(0, 1 - q / 0.2) * flash);
  if (shake) E.shake(ctx, Math.max(0, 1 - q / 0.35) * shake, Math.floor(t * 30));
}
// 卡片弹入（徽章、小标题）
function pop(ctx, t, t0, im, x, y, o = {}) {
  const { out = 1e9, dur = 0.3, a = 1, s = 1, dx = 0, dy = 30 } = o; const k = seg(t, t0, t0 + dur), ko = seg(t, out, out + 0.25);
  if (k <= 0 || ko >= 1) return; const e = easeOut(k);
  E.put(ctx, im, x + dx * (1 - e), y + dy * (1 - e) - 20 * easeIn(ko), a * e * (1 - ko), s * (0.85 + 0.15 * backOut(k)));
}

// ------------------------------------------------------------------ 录屏卡片：录屏在透视卡片上，镜头跟着操作区域推近
// box0/box1：从哪个区域推到哪个区域（归一化），u 0→1；返回卡片→屏幕的矩阵和卡片尺寸，方便再画高亮
function recCard(ctx, v, box, o = {}) {
  const { ry = -6, rx = 3, maxk = 3.2, cx = W / 2, cy = H / 2 - 20, fill = 0.86 } = o;
  if (!E.ready(v)) return null;
  const [vw, vh] = E.sizeOf(v); const bw = box[2] * vw, bh = box[3] * vh;
  const s = Math.min(W * fill / bw, (H - 220) / bh, maxk * W / vw);
  const cw = vw * s, ch = vh * s, bx = (box[0] + box[2] / 2) * vw * s, by = (box[1] + box[3] / 2) * vh * s;
  const M = E.persp(ctx, v, cw, ch, cx + (cw / 2 - bx), cy + (ch / 2 - by), { ry, rx, shadowK: 0.7, radius: 18 });
  return { M, s, cw, ch, vw, vh };
}
// 录屏上某块区域（归一化）高亮：其余压暗 + 橙色描边 + 高亮条扫过
function recFocus(ctx, R, r, k, o = {}) {
  if (!R || k <= 0) return; const { dim = 0.55, col = C.ORANGE, bar = false } = o;
  const b = [r[0] * R.vw * R.s, r[1] * R.vh * R.s, (r[0] + r[2]) * R.vw * R.s, (r[1] + r[3]) * R.vh * R.s];
  ctx.save(); ctx.globalAlpha = Math.min(1, k); E.dimExcept(ctx, R.M, R.cw, R.ch, b, dim, 18); ctx.restore();
  const q = E.quadOf(R.M, b); E.pathPoly(ctx, q); ctx.save(); ctx.lineWidth = 5; ctx.strokeStyle = rgb(col, 1, Math.min(1, k)); ctx.shadowColor = rgb(col, 1, 0.8 * k); ctx.shadowBlur = 18; ctx.stroke(); ctx.restore();
  if (bar) { const [x0, y0, x1, y1] = E.bboxOf(q); E.hlBar(ctx, x0, y0, x1, y1, k, col, 0.12); }
}
// 录屏里的某块区域打码（二维码等）：缩成很小再放大回去 = 糊掉，跟着卡片透视一起动
function recBlur(ctx, R, r, pad = 0.15) {
  if (!R) return; const ex = r[2] * pad, ey = r[3] * pad;
  const b = [(r[0] - ex) * R.vw * R.s, (r[1] - ey) * R.vh * R.s, (r[0] + r[2] + ex) * R.vw * R.s, (r[1] + r[3] + ey) * R.vh * R.s];
  const q = E.quadOf(R.M, b), bb = E.bboxOf(q).map(Math.round);
  const x0 = clamp(bb[0], 0, W - 2), y0 = clamp(bb[1], 0, H - 2), x1 = clamp(bb[2], x0 + 2, W), y1 = clamp(bb[3], y0 + 2, H), w = x1 - x0, h = y1 - y0;   // 只取画面内的部分
  const sm = E.tmp('blurS'), n = 5; sm.width = n; sm.height = Math.max(2, Math.round(n * h / w)); const g = sm.getContext('2d');
  g.imageSmoothingEnabled = true; g.drawImage(ctx.canvas, x0, y0, w, h, 0, 0, sm.width, sm.height);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); E.pathPoly(ctx, q); ctx.clip(); ctx.imageSmoothingEnabled = true; ctx.filter = 'blur(10px)'; ctx.drawImage(sm, x0 - 12, y0 - 12, w + 24, h + 24); ctx.filter = 'none'; ctx.restore();
}
// 录屏上某个按钮被点一下：中心处两圈扩散的光环
function recClick(ctx, R, r, t, t0, col = C.ORANGE) {
  if (!R) return; const q = t - t0; if (q < 0 || q > 0.7) return;
  const c = [(r[0] + r[2] / 2) * R.vw * R.s, (r[1] + r[3] / 2) * R.vh * R.s], p = E.mapPt(R.M, c[0], c[1]);
  const g = E.layer('click'); [0, 0.15].forEach(d => { const u = seg(q, d, d + 0.5); if (u > 0 && u < 1) E.ring(g, p[0], p[1], 20 + 90 * easeOut(u), col, 1 - u, 4); });
  E.addLayer(ctx, g, 1, [[8, 1]]);
}
const lerpBox = (a, b, u) => a.map((v, k) => lerp(v, b[k], u));
// 竖版画面（手机录屏 / 相册网页）放进手机框
function phone(ctx, src, cx, cy, h, o = {}) {
  const { a = 1, angle = 0, scrollU = 0, crop = null, glow = C.PINK } = o; const fr = img('PHONE'); if (!E.ready(fr)) return;
  const [fw, fh] = E.sizeOf(fr), s = h / fh, w = fw * s;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.rotate(-angle * Math.PI / 180);
  ctx.shadowColor = rgb(glow, 1, 0.45); ctx.shadowBlur = 80; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.roundRect(-w / 2 + 80 * s, -h / 2 + 51 * s, 767 * s, 1621 * s, 90 * s); ctx.fill(); ctx.shadowColor = 'transparent';
  const sx = -w / 2 + 113 * s, sy = -h / 2 + 83 * s, sw = 692 * s, sh = 1558 * s;      // 手机框.png 的内屏区域
  ctx.save(); ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 64 * s); ctx.clip(); ctx.fillStyle = '#000'; ctx.fillRect(sx, sy, sw, sh);
  if (src && E.ready(src)) {
    const [iw, ih] = E.sizeOf(src); const cr = crop ? px(src, crop) : [0, 0, iw, ih];
    const sc = sw / cr[2], visH = sh / sc, yOff = (cr[3] - visH) * clamp(scrollU, 0, 1);
    ctx.drawImage(src, cr[0], cr[1] + Math.max(0, yOff), cr[2], Math.min(visH, cr[3]), sx, sy, sw, Math.min(sh, cr[3] * sc));
  }
  ctx.restore(); ctx.drawImage(fr, -w / 2, -h / 2, w, h); ctx.restore();
}

// ------------------------------------------------------------------ 转场：对折（梦里「城市往天上对折」）——旧画面下半张向上翻折盖过上半张，露出新画面
function fold(ctx, u, drawOld) {
  if (u <= 0 || u >= 1) return;
  const c = E.tmp('foldA'), g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; drawOld(g);
  const e = easeIn(u, 1.5), th = Math.PI * e, f = 1900, cy = H / 2, d = H / 2;
  const P = (x, y, z) => [W / 2 + (x - W / 2) * f / (f + z), cy + (y - cy) * f / (f + z)];
  const quad = pts => E.solveH([[0, 0], [W, 0], [W, H / 2], [0, H / 2]], pts);
  // 上半张：往后仰、整体上移、变暗
  const lift = -H * 0.6 * easeIn(seg(u, 0.45, 1), 2), tz = 700 * e;
  const top = [P(0, lift, tz), P(W, lift, tz), P(W, cy + lift, 0), P(0, cy + lift, 0)];
  E.drawWarped(ctx, c, [0, 0, W, H / 2], W, H / 2, quad(top), 6, 0, 1 - 0.7 * e);
  // 下半张：以中线为轴往天上翻折（像梦里对折的城市）
  const yb = cy + d * Math.cos(th), zb = -d * Math.sin(th);
  const bot = [P(0, cy + lift, 0), P(W, cy + lift, 0), P(W, yb + lift, zb), P(0, yb + lift, zb)];
  const fa = 1 - easeIn(seg(u, 0.7, 1), 2);
  E.drawWarped(ctx, c, [0, H / 2, W, H / 2], W, H / 2, quad(bot), 8, 0, fa);
  const shade = Math.abs(Math.cos(th));
  if (shade < 1 && fa > 0) { ctx.save(); E.pathPoly(ctx, bot); ctx.fillStyle = `rgba(0,0,0,${(1 - shade) * 0.6 * fa})`; ctx.fill(); ctx.restore(); }
  const g2 = E.layer('foldglow'); E.line(g2, [[0, cy + lift], [W, cy + lift]], C.PINK, (1 - u) * 0.9, 3); E.addLayer(ctx, g2, 1, [[12, 1]]);
}

// ------------------------------------------------------------------ 字幕 + 整帧合成
let SUB_OFF = false;                                   // 画面上已经有同一句大字时，这一帧不出字幕（避免重复）
function subNow(t) { for (const [a, txt, i, b] of D.subs) if (a <= t && t < b) return txt; return ''; }
function frame(ctx, tOut) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const t = tOut - PRE, s = shotAt(t), fn = VIS[s.i]; SUB_OFF = false;
  // 从录屏/素材切回口播前，先解码下一句，避免显示上一次缓存的人像。
  const next = D.shots[D.shots.indexOf(s) + 1];
  if (s.src !== 'cam' && next?.src === 'cam' && next.start - t <= 0.75) {
    V('cam', camTs(next.start), 0);
  }
  if (fn) fn(ctx, t); else { ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, H); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const c of D.CUTS) {                             // 甩镜（只在段落切点）
    const t0 = EV[c]; if (t0 === undefined) continue;
    if (t - t0 >= 0 && t - t0 < 0.18) E.whip(ctx, 1 - (t - t0) / 0.18);
    if (t0 - t > 0 && t0 - t < 0.08) E.whip(ctx, (0.08 - (t0 - t)) / 0.08 * 0.7);
  }
  if (!SUB_OFF) E.subtitle(ctx, subNow(t));
  const fade = clamp((PRE + D.TOTAL - tOut) / 0.35, 0, 1); if (fade < 1) E.fill(ctx, '#000', 1 - fade);
}
