// ③ 梦境相册 Skill（上）：成品先亮相（对折进梦境）→ 为什么做 → 醒来就忘 → 梦境相册 → 必须在手机上 → 技能构建器 → 九个章节 → 拍板 → 校验通过
'use strict';

// ------------------------------------------------------------------ 梦境氛围：雨丝 + 浮尘（全部只依赖 t）
const RAIN = Array.from({ length: 140 }, (_, i) => { const r = E.rng(900 + i); return [r(), r(), 0.4 + r() * 0.6, r()]; });
function rain(ctx, t, k = 1, col = [210, 220, 255]) {
  if (k <= 0) return; const g = E.layer('rain'); g.lineCap = 'round';
  for (const [x, y, s, p] of RAIN) {
    const yy = ((y * (H + 200) + t * (900 + 700 * s)) % (H + 200)) - 100, xx = ((x * (W + 300) - (yy + 100) * 0.18) % (W + 300) + W + 300) % (W + 300) - 150;
    g.strokeStyle = rgb(col, 1, (0.08 + 0.18 * s) * k); g.lineWidth = 1 + 1.5 * s; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx - 10 * s, yy + 46 * s); g.stroke();
  }
  E.addLayer(ctx, g, 1, [], 'source-over');
}
const DUST = Array.from({ length: 90 }, (_, i) => { const r = E.rng(300 + i); return [r(), r(), r(), r()]; });
function dust(ctx, t, k = 1, col = C.PINK) {
  if (k <= 0) return; const g = E.layer('dust');
  for (const [x, y, s, c] of DUST) E.dot(g, x * W + 30 * Math.sin(t * 0.5 + c * 6), ((y * H - t * (14 + 40 * s)) % H + H) % H, 1 + 3 * s, c > 0.5 ? col : C.ICE, (0.2 + 0.5 * s) * k);
  E.addLayer(ctx, g, 1, [[5, 0.8 * k]]);
}
function dreamGrade(ctx, k = 1) {                          // 统一梦境色：压一点紫粉色调
  if (k <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.45 * k; ctx.fillStyle = 'rgb(150,60,170)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(10,0,20,${0.6 * k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}

// ------------------------------------------------------------------ 16 先看成品：雨夜里往天上对折的摩天楼 → 倒挂的老城 → 这些都是梦里的画面（开头从上一镜「对折」进来）
VIS[16] = (ctx, t) => {
  const s = S[16], tl = t - s.start;
  if (t < EV.d16a - 0.05) photo(ctx, 'D_PARIS', seg(t, s.start, EV.d16a), { z0: 1.12, z1: 1.04, fy0: 0.2, fy1: 0.55 });
  else if (t < EV.d16b - 0.05) photo(ctx, 'D_GLASS', seg(t, EV.d16a, EV.d16b), { z0: 1.0, z1: 1.1, fy0: 0.1, fy1: 0.35 });
  else photo(ctx, 'D_WEIGHT', seg(t, EV.d16b, s.end), { z0: 1.0, z1: 1.12, fy0: 0.0, fy1: 0.3 });
  dreamGrade(ctx, 0.8); rain(ctx, t, 0.9); dust(ctx, t, 0.6);
  fold(ctx, seg(tl, -0.05, 0.75), g => VIS[14](g, S[14].end - 0.02 + Math.min(tl, 0.7)));
};

// ------------------------------------------------------------------ 17 这是我自己做的梦境相册 Skill（手机里的相册首页）。为什么要做它？
VIS[17] = (ctx, t) => {
  const s = S[17], u = seg(t, s.start, s.end);
  bg(ctx, 'BG_DREAM'); dust(ctx, t, 0.8);
  const k = easeOut(seg(t, s.start - 0.05, s.start + 0.45));
  phone(ctx, img('ALBUM_PAGE'), W / 2 + 330, H / 2 + 60 + 120 * (1 - k), 900, { a: k, angle: -4, scrollU: u * 0.25 });
  photo2(ctx, 'D_WEIGHT', W / 2 - 420, H / 2 - 20, 520, k, 3);
  nameCard(ctx, t, S[17].start + 0.35, S[17].end + 1, { title: '梦境相册', sub: 'dream-album · 我做的 Skill', tone: 'pink', size: 48, x: W / 2 - 420, y: H / 2 + 250, align: 'center' });
};
// 一张梦境图做成竖卡片（圆角 + 阴影 + 微微倾斜）
function photo2(ctx, name, cx, cy, h, a = 1, angle = 0, o = {}) {
  const im = img(name); if (!E.ready(im) || a <= 0) return; const [iw, ih] = E.sizeOf(im), w = h * 0.72;
  const sc = Math.max(w / iw, h / ih), sw = w / sc, sh = h / sc;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.rotate(-angle * Math.PI / 180);
  ctx.shadowColor = rgb(o.glow || C.PINK, 1, 0.45); ctx.shadowBlur = 60; ctx.shadowOffsetY = 20; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 28); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 28); ctx.clip(); ctx.drawImage(im, (iw - sw) / 2, (ih - sh) * (o.fy === undefined ? 0.4 : o.fy), sw, sh, -w / 2, -h / 2, w, h);
  ctx.restore(); ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.rotate(-angle * Math.PI / 180); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 28); ctx.stroke(); ctx.restore();
}

// ------------------------------------------------------------------ 18 阿亮：我特别爱做梦——科幻、警匪、怀旧（身边依次弹出三张梦境卡）
const GENRE = [['g_sci', 'D_SCIFI', '科幻', C.ICE], ['g_cop', 'D_CONCRETE', '警匪', C.ORANGE], ['g_old', 'D_PARIS', '怀旧', C.GOLD]];
VIS[18] = (ctx, t) => {
  hostJ(ctx, t, [[S[18].start, 1.0], [wt(18, '那梦里') - 0.05, 1.1]]);
  GENRE.forEach(([e, im, name, col], j) => {
    const t0 = EV[e] - 0.08, k = seg(t, t0, t0 + 0.28), ko = seg(t, S[18].end - 0.3, S[18].end); if (k <= 0) return;
    const x = 1350 + j * 175, y = 470 + (j - 1) * 30, e2 = easeOut(k);
    photo2(ctx, im, x + 120 * (1 - e2), y, 430, e2 * (1 - ko), -6 + j * 6, { glow: col });
  });
  GENRE.forEach(([e, im, name, col], j) => nameCard(ctx, t, EV[e] + 0.05, S[18].end, { title: name, tone: col, size: 40, x: 1350 + j * 175, y: 470 + (j - 1) * 30 + 290, align: 'center' }));
};

// ------------------------------------------------------------------ 19 醒来刷个牙就忘了：梦 → 「早上醒来」切到刷牙实拍（补充/刷牙）→ 梦像残影一样叠在上面，
//                                     说到「忘得差不多了」碎成光点飘走 → 只剩一句「我好像做了一个很牛的梦」
const T_QUOTE = () => title('t_quote', '“我好像做了一个很牛的梦”', { size: 120, font: 'Hand', fill: ['#ffffff', '#ffe3f0'], glow: C.PINK, glowK: 0.5, spacing: 2 });
VIS[19] = (ctx, t) => {
  const s = S[19], wake = wt(19, '早上') - 0.1, fade = ease(seg(t, EV.forget - 0.2, EV.forget + 0.9));
  const dreamLayer = () => { const c = E.tmp('dreamF'), g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    photo(g, 'D_SCIFI', seg(t, s.start, EV.quote), { z0: 1.05, z1: 1.15, fy0: 0.3, fy1: 0.5 }); dreamGrade(g, 0.6); return c; };
  if (t < wake) { ctx.drawImage(dreamLayer(), 0, 0); dust(ctx, t, 0.6); return; }
  // 刷牙实拍（5.5 秒），放满到这句结束，暖一点
  const span = s.end - wake, rate = Math.min(1, 5.4 / span);
  full(ctx, 'brush', 0.05 + (t - wake) * rate, { rate, z: 1.04 + 0.04 * seg(t, wake, s.end), warm: true, sat: 0.95 });
  // 梦的残影：刚醒时还叠在画面上（变灰、变糊），说到「忘得差不多了」碎成光点往上飘
  const ghost = (1 - fade) * (1 - 0.35 * seg(t, wake, EV.forget));
  if (ghost > 0.02) { const c = dreamLayer(); E.grade(c.getContext('2d'), 0, 0, W, H, 1 - 0.6 * fade, 1, false); E.blurDraw(ctx, c, 3 + 22 * fade, 0, 0, W, H, 0.6 * ghost, 'screen'); }
  if (fade > 0 && fade < 1) {
    const g = E.layer('flake');
    for (const [x, y, sz, c] of DUST) { const q = fade * (0.6 + c); E.dot(g, x * W + 60 * Math.sin(c * 9 + t), y * H - 260 * q, 2 + 4 * sz, C.PINK, Math.max(0, 0.9 - q) * 0.9); }
    E.addLayer(ctx, g, 1, [[6, 0.8]]);
  }
  if (t >= EV.quote - 0.1) { SUB_OFF = true; E.fill(ctx, '#000', 0.5 * easeOut(seg(t, EV.quote - 0.1, EV.quote + 0.3))); pop(ctx, t, EV.quote - 0.05, T_QUOTE(), W / 2, H / 2 + 170, { dur: 0.45, dy: 20 }); }
};

// ------------------------------------------------------------------ 20 阿亮：能不能在我忘之前把梦画下来，攒成一本梦境相册 → 停顿里「梦境相册」大字
const T_ALBUM = () => title('t_album', '梦境相册', { size: 230, fill: ['#ffffff', '#ffc1df', '#c9a6ff'], glow: C.PINK, glowK: 0.85, spacing: 16 });
VIS[20] = (ctx, t) => {
  const hit = S[20].vend + 0.05;
  if (t < hit) return hostJ(ctx, t, [[S[20].start, 1.02], [wt(20, '帮我把梦') - 0.05, 1.14]]);
  bg(ctx, 'BG_DREAM2'); dust(ctx, t, 1); rain(ctx, t, 0.4, [255, 200, 230]);
  slam(ctx, t, hit, T_ALBUM(), W / 2, H / 2 - 10, { s0: 1.3, flash: 0.4, shake: 0.5 });
};

// ------------------------------------------------------------------ 21 而且必须在手机上：醒来伸手就能用；等爬起来开电脑，梦早没了
function laptop(ctx, cx, cy, w, a = 1, name = 'STUDIO_HOME', scrollU = 0) {
  if (a <= 0) return; const h = w * 0.62, im = img(name);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.fillStyle = '#1c1c22'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 18); ctx.fill(); ctx.shadowColor = 'transparent';
  if (E.ready(im)) {                                      // 屏幕比例不同的截图：按宽铺满，多出来的高度可以往下滚
    const [iw, ih] = E.sizeOf(im), sw = w - 28, sh = h - 28, vis = iw * sh / sw, y0 = Math.max(0, ih - vis) * clamp(scrollU, 0, 1);
    ctx.drawImage(im, 0, y0, iw, Math.min(vis, ih), -w / 2 + 14, -h / 2 + 14, sw, Math.min(sh, ih * sw / iw));
  }
  ctx.fillStyle = '#2a2a31'; ctx.beginPath(); ctx.roundRect(-w * 0.6, h / 2 - 2, w * 1.2, 22, [4, 4, 14, 14]); ctx.fill(); ctx.restore();
}
VIS[21] = (ctx, t) => {
  const s = S[21], tl = t - s.start;
  if (t < s.start + 0.35) { bg(ctx, 'BG_DREAM2'); dust(ctx, t, 1); E.put(ctx, T_ALBUM(), W / 2, H / 2 - 10, 1 - seg(tl, 0, 0.35), 1 + 0.05 * tl); return; }
  bg(ctx, 'BG_MORNING'); dust(ctx, t, 0.5, C.GOLD);
  const k = easeOut(seg(t, EV.phone21 - 0.05, EV.phone21 + 0.45)), far = ease(seg(t, EV.pc21 - 0.1, EV.pc21 + 0.6));
  const px_ = lerp(W / 2, W / 2 - 420, far);
  phone(ctx, img('ALBUM_PAGE'), px_, H / 2 + 40 + 160 * (1 - k), 880, { a: k, angle: -3 * (1 - far), scrollU: seg(t, EV.bed21, s.end) * 0.3, glow: C.GOLD });
  // 「醒来伸手就能用」：手机上一圈金色光环（触手可及）
  const ring = seg(t, wt(21, '醒来伸手') - 0.05, wt(21, '醒来伸手') + 0.8);
  if (ring > 0 && ring < 1) { const g = E.layer('ring'); E.ring(g, px_, H / 2 + 40, 300 + 260 * easeOut(ring), C.GOLD, 1 - ring, 4); E.addLayer(ctx, g, 1, [[8, 1]]); }
  // 「等爬起来打开电脑」：电脑在远处出现；梦（悬浮的梦境卡）慢慢消散
  if (far > 0) {
    laptop(ctx, W / 2 + 430, H / 2 + 60, 760 * (0.85 + 0.15 * far), far);
    const gone = ease(seg(t, wt(21, '梦早就没了') - 0.1, s.vend + 0.2));
    photo2(ctx, 'D_PARIS', W / 2 + 430, H / 2 - 300, 300, far * (1 - gone), 4);
    if (gone > 0) { const g = E.layer('gone'); for (const [x, y, sz, c] of DUST.slice(0, 40)) E.dot(g, W / 2 + 430 + (x - 0.5) * 260, H / 2 - 300 + (y - 0.5) * 300 - 160 * gone * (0.5 + c), 2 + 3 * sz, C.PINK, (1 - gone) * 0.9); E.addLayer(ctx, g, 1, [[5, 0.8]]); }
  }
};

// ------------------------------------------------------------------ 22–26 Step Studio 技能构建器：真实录屏（18 录屏1），镜头跟着操作区域走
// 录屏里的位置（归一化，量自原片）
const R18 = {
  builder: [0.003, 0.085, 0.085, 0.042],   // 左上「技能构建器」
  input: [0.3, 0.3, 0.58, 0.28],            // 首页输入框（贴进需求后）
  nine: [0.012, 0.33, 0.30, 0.105],         // 9.9 秒那一帧（画面静止）：「需要的九个章节……」
  decide: [0.012, 0.448, 0.30, 0.068],      // 9.9 秒：「……有一件事需要你拍板」
  verify: [0.012, 0.145, 0.30, 0.075],      // 11.0 秒：「交付物：dream-album-plugin/（标识 dream-album），校验通过」
  card: [0.012, 0.585, 0.30, 0.09],         // 11.0 秒：做好的「梦境相册」技能卡
};
function rec18(ctx, t, ts, rate, box, o = {}) {
  bg(ctx, 'BG_DARK');
  return recCard(ctx, V('r18', ts, rate), box, Object.assign({ ry: -5, rx: 3, fill: 0.84 }, o));
}
// 22 打开 Step Studio → 选技能构建器 → 像聊天一样把需求讲清楚 → 发射
VIS[22] = (ctx, t) => {
  const s = S[22], ts = clamp((t - s.start) * (7.6 / s.dur), 0, 7.55);
  const zin = ease(seg(t, EV.builder - 0.3, EV.builder + 0.3)), zout = ease(seg(t, EV.chat22 - 0.5, EV.chat22 + 0.3));
  const full_ = [0, 0, 1, 1], box = lerpBox(lerpBox(full_, [0, 0, 0.42, 0.42], zin), [0.24, 0.2, 0.7, 0.5], zout);
  const R = rec18(ctx, t, ts, 7.6 / s.dur, box, { maxk: 2.0 });
  recFocus(ctx, R, R18.builder, seg(t, EV.builder - 0.1, EV.builder + 0.25) * (1 - zout));
  const k22 = 7.6 / s.dur, tsT = x => s.start + x / k22;                      // 录屏第 x 秒对应的时间线时刻
  recFocus(ctx, R, R18.input, seg(t, tsT(5.9), tsT(6.2)) * (1 - seg(t, tsT(7.0), tsT(7.15))), { dim: 0.35 });
  if (t >= tsT(6.85)) { const q = seg(t, tsT(6.85), tsT(6.85) + 0.5); const g = E.layer('send'), sp = R ? E.mapPt(R.M, 0.86 * R.vw * R.s, 0.615 * R.vh * R.s) : [W / 2, H / 2]; E.ring(g, sp[0], sp[1], 20 + 160 * easeOut(q), C.ORANGE, 1 - q, 5); E.addLayer(ctx, g, 1, [[8, 1]]); }
};
// 录屏里逐词标记（跟着口播亮）：淡色底 + 下划线；u<1 时从左往右长出来
const R18W = {   // 9.9 秒那一帧
  role: [0.143, 0.343, 0.049, 0.025], dream: [0.047, 0.376, 0.047, 0.025], img: [0.121, 0.376, 0.047, 0.025], ui: [0.195, 0.376, 0.039, 0.025],
  para: [0.012, 0.341, 0.306, 0.094], ask1: [0.014, 0.456, 0.302, 0.024], ask2: [0.014, 0.489, 0.031, 0.024],
};
const R18F = {   // 11.0 秒那一帧
  ok: [0.014, 0.11, 0.14, 0.026], id: [0.203, 0.158, 0.069, 0.026], pass1: [0.288, 0.158, 0.029, 0.026], pass2: [0.014, 0.191, 0.032, 0.026],
  card: [0.012, 0.59, 0.306, 0.09],
};
function recMark(ctx, R, r, k, col = C.ORANGE, u = 1) {
  if (!R || k <= 0 || u <= 0) return;
  const b = [r[0] * R.vw * R.s, r[1] * R.vh * R.s, (r[0] + r[2] * u) * R.vw * R.s, (r[1] + r[3]) * R.vh * R.s];
  const q = E.quadOf(R.M, b); ctx.save(); E.pathPoly(ctx, q); ctx.fillStyle = rgb(col, 1, 0.2 * k); ctx.fill();
  const ul = E.quadOf(R.M, [b[0], b[3] - 0.004 * R.vh * R.s, b[2], b[3]]); E.pathPoly(ctx, ul); ctx.shadowColor = rgb(col, 1, 0.9 * k); ctx.shadowBlur = 14; ctx.fillStyle = rgb(col, 1, k); ctx.fill(); ctx.restore();
}
const boxAt = (r, padX, padY) => [r[0] - padX, r[1] - padY, r[2] + padX * 2, r[3] + padY * 2];
// 23 它自己拆需求、定规则（思考过程真实播放）→ 四个章节名在原文里跟着口播一个个亮，镜头跟着字走 →「9 个章节」
const CHAPS = [['role', 'ch_role'], ['dream', 'ch_dream'], ['img', 'ch_img'], ['ui', 'ch_ui']];
VIS[23] = (ctx, t) => {
  const s = S[23], u = seg(t, s.start, EV.nine - 0.25);
  const ts = t < EV.nine - 0.25 ? lerp(7.6, 9.88, u) : 9.9;
  const zin = ease(seg(t, EV.nine - 0.75, EV.nine - 0.05));
  let cur = 0; CHAPS.forEach(([w, e], j) => { if (t >= EV[e] - 0.1) cur = j; });
  // 镜头：段落居中，再往当前那个词的方向挪一点；「九个章节」时退回看整段
  const wr = R18W[CHAPS[cur][0]], foc = boxAt(R18W.para, 0.01, 0.01), back = ease(seg(t, EV.nine_n - 0.3, EV.nine_n + 0.3));
  const follow = [lerp(foc[0], wr[0] + wr[2] / 2 - foc[2] * 0.4, 0.35 * (1 - back)), foc[1], foc[2] * (1 - 0.12 * (1 - back)), foc[3]];
  const box = lerpBox([0, 0.02, 0.6, 0.6], follow, zin);
  const R = rec18(ctx, t, ts, t < EV.nine - 0.25 ? 2.28 / Math.max(0.5, EV.nine - 0.25 - s.start) : 0, box, { maxk: 2.6, cy: H / 2 + 10, ry: lerp(-5, -3, zin) });
  CHAPS.forEach(([w, e]) => recMark(ctx, R, R18W[w], seg(t, EV[e] - 0.08, EV[e] + 0.1), C.ORANGE, easeOut(seg(t, EV[e] - 0.08, EV[e] + 0.25))));
  if (back > 0) recFocus(ctx, R, R18W.para, back, { dim: 0.5 });
  const T9 = title('t_nine', '9 个章节', { size: 120, fill: ['#ffffff', '#ffd2b5'], glow: C.ORANGE });
  if (t >= EV.nine_n - 0.05) {
    const k = easeOut(seg(t, EV.nine_n - 0.05, EV.nine_n + 0.3)), gr = ctx.createLinearGradient(0, 0, 0, 330);
    gr.addColorStop(0, `rgba(10,10,14,${0.85 * k})`); gr.addColorStop(1, 'rgba(10,10,14,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, 330);
    pop(ctx, t, EV.nine_n - 0.05, T9, W / 2, 140, { dy: -20, s: 0.9 });
  }
};
// 24 意外的细节：镜头从章节往下滑到「有一件事需要你拍板」→ 说到「拿不准…停下来问我」这句话从左往右被划亮 →「拍板」盖章，镜头顶一下
VIS[24] = (ctx, t) => {
  const s = S[24], g1 = ease(seg(t, s.start, EV.unsure - 0.3)), hit = EV.decide - 0.05;
  const ask = boxAt([0.014, 0.456, 0.302, 0.057], 0.012, 0.02);
  const punch = t >= hit ? 0.06 * Math.exp(-(t - hit) * 6) + 0.05 * seg(t, hit, s.end) : 0;
  let box = lerpBox(boxAt(R18W.para, 0.01, 0.01), ask, g1);
  box = [box[0] + box[2] * punch / 2, box[1] + box[3] * punch / 2, box[2] * (1 - punch), box[3] * (1 - punch)];
  const R = rec18(ctx, t, 9.9, 0, box, { maxk: 2.6, cy: H / 2 + 10, ry: -3 + 1.5 * Math.sin(t * 0.6) });
  const sw = seg(t, EV.unsure - 0.2, hit - 0.2), L1 = 0.302, L2 = 0.031, tot = L1 + L2;
  recMark(ctx, R, R18W.ask1, Math.min(1, sw * 6), C.ORANGE, clamp(sw * tot / L1, 0, 1));
  recMark(ctx, R, R18W.ask2, sw * tot > L1 ? 1 : 0, C.ORANGE, clamp((sw * tot - L1) / L2, 0, 1));
  if (t >= hit) {
    const q = t - hit, u = seg(q, 0, 0.18);
    E.put(ctx, stamp('st_decide', '让我来拍板'), W / 2 + 470, H / 2 + 260, easeOut(u), 1.6 - 0.6 * easeOut(u, 4), 8);
    E.shake(ctx, Math.max(0, 1 - q / 0.3) * 0.6, Math.floor(t * 30)); E.flash(ctx, Math.max(0, 1 - q / 0.15) * 0.12);
  }
};
// 25 阿亮：这点我挺喜欢
VIS[25] = (ctx, t) => hostJ(ctx, t, [[S[25].start, 1.12], [wt(25, '比自作主张') - 0.05, 1.22]]);
// 26「5 分钟后」录屏快进滚动 → 停在交付物「dream-album」→ 滑到下面做好的「梦境相册」技能卡推近 →「校验」滑回「校验通过」盖章
VIS[26] = (ctx, t) => {
  const s = S[26], tf = s.start + 1.1, tId = wt(26, 'dream') - 0.1, tCard = wt(26, '梦境相册') - 0.15, tV = EV.verify - 0.25;
  const ts = t < tf ? lerp(9.9, 11.0, easeIn(seg(t, s.start, tf), 1.4)) : 11.0;
  const bFF = [0.0, 0.15, 0.33, 0.5], bId = boxAt([0.014, 0.11, 0.304, 0.105], 0.01, 0.015), bCard = boxAt(R18F.card, 0.01, 0.02), bPass = boxAt([0.014, 0.155, 0.304, 0.062], 0.01, 0.02);
  let box = lerpBox(boxAt(R18W.ask1, 0.01, 0.06), bFF, ease(seg(t, s.start, s.start + 0.5)));
  box = lerpBox(box, bId, ease(seg(t, tf - 0.3, tf + 0.2)));
  box = lerpBox(box, bCard, ease(seg(t, tCard - 0.2, tCard + 0.45)));
  box = lerpBox(box, bPass, ease(seg(t, tV - 0.35, tV + 0.15)));
  const dr = 0.04 * Math.sin((t - s.start) * 0.9); box = [box[0] + box[2] * dr, box[1], box[2] * (1 - Math.abs(dr)), box[3]];
  const ff = t < tf ? 1 - seg(t, tf - 0.25, tf) : 0;
  const R = rec18(ctx, t, ts, t < tf ? 1.1 / 1.1 : 0, box, { maxk: 2.6, cy: H / 2 + 10, ry: -3 });
  if (ff > 0) { E.whip(ctx, 0.35 * ff * seg(t, s.start, s.start + 0.2)); }
  recMark(ctx, R, R18F.id, seg(t, tId, tId + 0.2) * (1 - seg(t, tCard - 0.2, tCard)), C.PINK, easeOut(seg(t, tId, tId + 0.35)));
  recFocus(ctx, R, R18F.card, seg(t, tCard + 0.1, tCard + 0.45) * (1 - seg(t, tV - 0.35, tV - 0.1)), { col: C.PINK, dim: 0.45, bar: true });
  recMark(ctx, R, R18F.pass1, seg(t, tV, tV + 0.2), C.MINT, easeOut(seg(t, tV, tV + 0.15)));
  recMark(ctx, R, R18F.pass2, seg(t, tV + 0.12, tV + 0.3), C.MINT, easeOut(seg(t, tV + 0.12, tV + 0.3)));
  if (t >= EV.verify - 0.05) {
    const q = t - EV.verify + 0.05, u = seg(q, 0, 0.18);
    E.put(ctx, stamp('st_verify', '校验通过 ✓', C.MINT), W / 2 + 470, H / 2 + 260, easeOut(u), 1.6 - 0.6 * easeOut(u, 4), 8);
    E.shake(ctx, Math.max(0, 1 - q / 0.3) * 0.6, Math.floor(t * 30));
  }
};
// 27 阿亮：技能做好了怎么用？
VIS[27] = (ctx, t) => hostJ(ctx, t, [[S[27].start, 1.06]]);
