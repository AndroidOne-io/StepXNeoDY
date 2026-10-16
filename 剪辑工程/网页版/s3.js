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
const B_SKILL = () => badge('b_skill', '我自己做的「梦境相册」Skill', { size: 50, col: C.PINK });
VIS[17] = (ctx, t) => {
  const s = S[17], u = seg(t, s.start, s.end);
  bg(ctx, 'BG_DREAM'); dust(ctx, t, 0.8);
  const k = easeOut(seg(t, s.start - 0.05, s.start + 0.45));
  phone(ctx, img('ALBUM_PAGE'), W / 2 + 330, H / 2 + 60 + 120 * (1 - k), 900, { a: k, angle: -4, scrollU: u * 0.25 });
  photo2(ctx, 'D_WEIGHT', W / 2 - 420, H / 2 - 20, 520, k, 3);
  pop(ctx, t, s.start + 0.2, B_SKILL(), W / 2 - 420, H / 2 + 330, { dy: 30 });
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
    E.put(ctx, badge('bg_' + name, name, { size: 42, col }), x, y + 255, e2 * (1 - ko));
  });
};

// ------------------------------------------------------------------ 19 醒来刷个牙就忘了：梦境图褪色、碎成光点飘走 → 只剩一句「我好像做了一个很牛的梦」
const T_QUOTE = () => title('t_quote', '“我好像做了一个很牛的梦”', { size: 120, font: 'Hand', fill: ['#ffffff', '#ffe3f0'], glow: C.PINK, glowK: 0.5, spacing: 2 });
VIS[19] = (ctx, t) => {
  const s = S[19], fade = ease(seg(t, EV.forget - 0.3, EV.quote - 0.2));
  bg(ctx, 'BG_MORNING');
  // 梦：先清楚，说到「忘得差不多了」开始变灰、变糊、变淡
  if (fade < 1) {
    const c = E.tmp('dreamF'), g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    photo(g, 'D_SCIFI', seg(t, s.start, EV.quote), { z0: 1.05, z1: 1.15, fy0: 0.3, fy1: 0.5 }); dreamGrade(g, 0.6);
    if (fade > 0) E.grade(g, 0, 0, W, H, 1 - fade, 1, false);
    if (fade > 0.05) E.blurDraw(ctx, c, 2 + 26 * fade, 0, 0, W, H, 1 - fade); else ctx.drawImage(c, 0, 0);
  }
  // 碎成光点往上飘
  if (fade > 0) {
    const g = E.layer('flake');
    for (const [x, y, sz, c] of DUST) { const q = fade * (0.6 + c); E.dot(g, x * W + 60 * Math.sin(c * 9 + t), y * H - 260 * q, 2 + 4 * sz, C.PINK, Math.max(0, 0.9 - q) * 0.9); }
    E.addLayer(ctx, g, 1, [[6, 0.8]]);
  }
  if (t >= EV.quote - 0.1) { SUB_OFF = true; E.fill(ctx, '#000', 0.35 * easeOut(seg(t, EV.quote - 0.1, EV.quote + 0.3))); pop(ctx, t, EV.quote - 0.05, T_QUOTE(), W / 2, H / 2 - 20, { dur: 0.45, dy: 20 }); }
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
function laptop(ctx, cx, cy, w, a = 1) {
  if (a <= 0) return; const h = w * 0.62, im = img('STUDIO_HOME');
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.fillStyle = '#1c1c22'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 18); ctx.fill(); ctx.shadowColor = 'transparent';
  if (E.ready(im)) ctx.drawImage(im, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28);
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
const lerpBox = (a, b, u) => a.map((v, k) => lerp(v, b[k], u));
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
// 23 它自己拆需求、定规则——角色定位、梦境解析、图像生成、UI设计——九个章节全列好
const CHAPS = [['角色定位', 'ch_role'], ['梦境解析', 'ch_dream'], ['图像生成', 'ch_img'], ['UI 设计', 'ch_ui']];
VIS[23] = (ctx, t) => {
  const s = S[23], u = seg(t, s.start, EV.nine - 0.2);
  const ts = t < EV.nine - 0.2 ? lerp(7.6, 9.85, u) : 9.9;                  // 思考过程放慢，说到章节时停在 9.9 秒（画面静止、九个章节和拍板都在）
  const zin = ease(seg(t, EV.nine - 0.6, EV.nine));
  const box = lerpBox([0, 0.02, 0.6, 0.6], [0, 0.24, 0.32, 0.34], zin);
  const R = rec18(ctx, t, ts, t < EV.nine - 0.2 ? (2.25 / Math.max(0.5, EV.nine - 0.2 - s.start)) : 0, box, { maxk: 2.4, cy: H / 2 - 30 });
  recFocus(ctx, R, R18.nine, seg(t, EV.nine - 0.1, EV.nine + 0.4), { bar: true });
  // 章节名字跟着口播在卡片下方一个个亮起（大号胶囊，手机上也看得清）
  CHAPS.forEach(([n, e], j) => pop(ctx, t, EV[e] - 0.05, badge('cp_' + n, n, { size: 50, col: C.ORANGE }), W / 2 + (j - 1.5) * 330, H - 250, { dy: 30 }));
  const T9 = title('t_nine', '9 个章节', { size: 120, fill: ['#ffffff', '#ffd2b5'], glow: C.ORANGE });
  if (t >= EV.nine_n - 0.05) pop(ctx, t, EV.nine_n - 0.05, T9, W / 2 + 560, 180, { dy: -20, s: 0.9 });
};
// 24 中间有一步它拿不准，停下来问我——让我来拍板（停在真实提示上 + 盖章）
VIS[24] = (ctx, t) => {
  const s = S[24], R = rec18(ctx, t, 9.9, 0, [0, 0.3, 0.32, 0.34], { maxk: 2.4, cy: H / 2 - 30 });
  recFocus(ctx, R, R18.decide, seg(t, EV.unsure - 0.2, EV.unsure + 0.3), { bar: true });
  if (t >= EV.decide - 0.05) {
    const q = t - EV.decide + 0.05, u = seg(q, 0, 0.18);
    E.put(ctx, stamp('st_decide', '让我来拍板'), W / 2 + 470, H / 2 + 250, easeOut(u), 1.6 - 0.6 * easeOut(u, 4), 8);
    E.shake(ctx, Math.max(0, 1 - q / 0.3) * 0.6, Math.floor(t * 30));
  }
};
// 25 阿亮：这点我挺喜欢
VIS[25] = (ctx, t) => hostJ(ctx, t, [[S[25].start, 1.12], [wt(25, '比自作主张') - 0.05, 1.22]]);
// 26 5 分钟后，dream-album 技能做好了，还自己校验了一遍
VIS[26] = (ctx, t) => {
  const s = S[26];
  const R = rec18(ctx, t, 11.0, 0, [0, 0.1, 0.32, 0.6], { maxk: 2.0, cy: H / 2 - 20 });
  recFocus(ctx, R, wt(26, '校验') - 0.2 > t ? R18.card : R18.verify, t < EV.verify - 0.2 ? seg(t, wt(26, '一个叫') - 0.1, wt(26, '一个叫') + 0.4) : 1, { bar: true });
  if (t >= EV.verify - 0.05) {
    const q = t - EV.verify + 0.05, u = seg(q, 0, 0.18);
    E.put(ctx, stamp('st_verify', '校验通过 ✓', C.MINT), W / 2 + 470, H / 2 + 250, easeOut(u), 1.6 - 0.6 * easeOut(u, 4), 8);
    E.shake(ctx, Math.max(0, 1 - q / 0.3) * 0.6, Math.floor(t * 30));
  }
};
// 27 阿亮：技能做好了怎么用？
VIS[27] = (ctx, t) => hostJ(ctx, t, [[S[27].start, 1.06]]);
