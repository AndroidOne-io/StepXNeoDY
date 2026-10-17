// ③ 梦境相册 Skill（下）+ ④ 结尾：用技能讲梦 → 生成 → 相册成品 → 放映室 → 真机测试 → 醒来就能用 → 号召投稿 → 狂想计划 → 结尾
'use strict';

// ------------------------------------------------------------------ 28–30 用技能：随便一个 Agent（补充/agent-1、agent-2 两张截图，2648×1718）
// 截图里的位置（归一化）：输入框、技能标签「Dream Album」、语音键 / 发送键
const AG = { input: [0.2765, 0.4735, 0.4835, 0.1135], chip: [0.2865, 0.4915, 0.082, 0.021], mic: [0.716, 0.5616], send: [0.743, 0.5616] };
const DREAM_TXT = '我走在雨夜的街上，两边的摩天楼顺着天际线往上对折翻转，路灯、车子跟着一起弯，像被揉皱的那种纸，远处一座老城呢，倒挂在半空。';
function agentImg(kind) {                                    // 'empty' | 'skill' | 'text'（技能标签 + 讲完的那段梦）
  if (kind === 'empty') return img('AGENT_EMPTY');
  if (kind === 'skill') return img('AGENT_SKILL');
  const key = 'agent_text'; if (_txt[key]) return _txt[key]; const base = img('AGENT_SKILL'); if (!E.ready(base)) return base;
  const [w, h] = E.sizeOf(base), c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(base, 0, 0);
  // 输入框撑高一点放下这段梦：先把原输入框下沿以下整体往下挪
  const y0 = Math.round(0.6 * h), dy = Math.round(0.07 * h); g.drawImage(base, 0, y0 - 2, w, h - y0, 0, y0 - 2 + dy, w, h - y0);
  g.fillStyle = '#ffffff'; g.fillRect(0.2775 * w, 0.52 * h, 0.4815 * w, dy + 0.06 * h);
  g.drawImage(base, 0.27 * w, 0.535 * h, 0.5 * w, 0.065 * h, 0.27 * w, 0.535 * h + dy, 0.5 * w, 0.065 * h);   // 底部那一行按钮跟着下移
  g.fillStyle = '#ffffff'; g.fillRect(0.2775 * w, 0.535 * h, 0.4815 * w, dy);
  g.font = `400 ${Math.round(0.0118 * w)}px ${SANS}`; g.fillStyle = '#2b2b2f'; g.textBaseline = 'top';
  const maxW = 0.455 * w, lh = 0.0118 * w * 1.55; let line = '', y = 0.522 * h; const lines = [];
  for (const ch of DREAM_TXT) { if (g.measureText(line + ch).width > maxW) { lines.push(line); line = ch; } else line += ch; } lines.push(line);
  lines.forEach((ln, i) => g.fillText(ln, 0.287 * w, y + i * lh));
  return (_txt[key] = c);
}
function agentWin(ctx, kind, box, o = {}) { bg(ctx, 'BG_DARK'); return recCard(ctx, agentImg(kind), box, Object.assign({ ry: -4, rx: 2, fill: 0.86, maxk: 1.6, radius: 18 }, o)); }
const ptOf = (R, x, y) => E.mapPt(R.M, x * R.vw * R.s, y * R.vh * R.s);
function cursor(ctx, x, y, s = 1, a = 1) {                  // 箭头光标
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(15, 40); ctx.lineTo(21, 37); ctx.lineTo(15, 24); ctx.lineTo(27, 24); ctx.closePath();
  ctx.fillStyle = '#111'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; ctx.stroke(); ctx.fill(); ctx.restore();
}
function skillCard() {                                       // 被拖进来的技能卡：「梦境相册 · dream-album」
  const key = 'skillcard'; if (_txt[key]) return _txt[key];
  const c = document.createElement('canvas'); c.width = 620; c.height = 170; const g = c.getContext('2d');
  g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 30; g.shadowOffsetY = 10; g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(20, 15, 580, 130, 26); g.fill(); g.shadowColor = 'transparent';
  const gr = g.createLinearGradient(50, 35, 140, 125); gr.addColorStop(0, '#ff9a4d'); gr.addColorStop(1, '#ff6a1f'); g.fillStyle = gr; g.beginPath(); g.arc(95, 80, 45, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(95, 80, 24, 0, Math.PI * 2); g.fill(); g.fillStyle = gr; g.beginPath(); g.arc(106, 70, 21, 0, Math.PI * 2); g.fill();   // 月牙
  g.font = `600 44px ${SANS}`; g.fillStyle = '#1d1d22'; g.textBaseline = 'middle'; g.fillText('梦境相册', 165, 62);
  g.font = `400 30px ${SANS}`; g.fillStyle = '#8a8a94'; g.fillText('dream-album · 技能', 165, 108);
  return (_txt[key] = c);
}
// 28 随便打开一个 Agent → 技能卡被拖进输入框（落下变成「Dream Album」标签）→「把梦讲给它」推近输入框
VIS[28] = (ctx, t) => {
  const s = S[28], inn = easeOut(seg(t, s.start, s.start + 0.6)), drop = EV.drag + 0.3;
  const zA = ease(seg(t, EV.agent - 0.2, EV.agent + 0.5)), zB = ease(seg(t, EV.tell - 0.2, EV.tell + 0.5));
  let box = lerpBox(lerpBox([0, 0, 1, 1], [0.12, 0.25, 0.76, 0.5], zA), [0.24, 0.4, 0.55, 0.27], zB);
  const R = agentWin(ctx, t < drop ? 'empty' : 'skill', box, { cy: H / 2 - 10 + 120 * (1 - inn), ry: lerp(-9, -4, inn), maxk: lerp(0.62, 1.0, zA) + 0.55 * zB });
  if (!R) return;
  if (inn < 1) E.fill(ctx, '#0a0a0e', 1 - inn);
  // 拖拽：卡片从右下角被光标拖到输入框里，落下时缩成标签
  const g0 = EV.drag - 0.75, u = seg(t, g0, drop), ce = ptOf(R, AG.chip[0] + AG.chip[2] / 2, AG.chip[1] + AG.chip[3] / 2);
  if (t >= g0 && t < drop + 0.25) {
    const e = ease(u), sx = W - 260, sy = H - 170, x = lerp(sx, ce[0] + 120, e), y = lerp(sy, ce[1], e) - Math.sin(e * Math.PI) * 120;
    const sc = lerp(1, 0.35, easeIn(seg(t, drop - 0.2, drop + 0.15))), a = 1 - seg(t, drop, drop + 0.2);
    E.put(ctx, skillCard(), x, y, easeOut(seg(t, g0, g0 + 0.2)) * a, sc, -6 * (1 - e));
    cursor(ctx, x + 40 * sc, y + 10 * sc, 1.1, a);
  }
  if (t >= drop) { recFocus(ctx, R, AG.chip, seg(t, drop, drop + 0.2) * (1 - seg(t, drop + 0.9, drop + 1.3)), { col: C.PINK, dim: 0.12 }); recClick(ctx, R, AG.chip, t, drop, C.PINK); }
  // 「把梦讲给它」：语音键亮起
  if (t >= EV.tell - 0.1) micPulse(ctx, R, t, seg(t, EV.tell - 0.1, EV.tell + 0.2));
};
function micPulse(ctx, R, t, k) {                            // 语音键一圈圈往外的光环 + 输入框里的声波
  const p = ptOf(R, AG.mic[0], AG.mic[1]), g = E.layer('mic');
  for (let i = 0; i < 3; i++) { const u = ((t * 0.9 + i / 3) % 1); E.ring(g, p[0], p[1], 18 + 70 * u, C.PINK, k * (1 - u), 3); }
  E.addLayer(ctx, g, 1, [[6, 1]]);
  const a = ptOf(R, AG.chip[0] + AG.chip[2] + 0.012, AG.chip[1] + AG.chip[3] / 2), n = 22;
  ctx.save(); ctx.globalAlpha = k;
  for (let i = 0; i < n; i++) { const h = 6 + 34 * Math.abs(Math.sin(t * 8 + i * 0.7) * Math.sin(t * 2.7 + i * 1.3)); ctx.fillStyle = rgb(i % 3 ? C.PINK : C.LILAC); ctx.beginPath(); ctx.roundRect(a[0] + i * 13, a[1] - h / 2, 7, h, 3.5); ctx.fill(); }
  ctx.restore();
}
// 29 讲梦：先是语音输入在收音，然后随着口播穿插相册里对应的画面（雨夜街道 → 往上对折 → 揉皱的纸 → 倒挂的老城）
const DREAM29 = [['dream29', 'D_CROSS', { z0: 1.05, z1: 1.15, fy0: 0.6, fy1: 0.4 }], ['fold29', 'D_PARIS', { z0: 1.12, z1: 1.02, fy0: 0.15, fy1: 0.55 }],
  ['paper29', 'D_CONCRETE', { z0: 1.0, z1: 1.12, fy0: 0.5, fy1: 0.4 }], ['old29', 'D_GLASS', { z0: 1.0, z1: 1.12, fy0: 0.05, fy1: 0.35 }]];
function dreamAt(ctx, t, k) {
  const [e, im, o] = DREAM29[k], t0 = EV[e] - 0.1, t1 = k + 1 < DREAM29.length ? EV[DREAM29[k + 1][0]] - 0.1 : S[29].end;
  photo(ctx, im, seg(t, t0, t1), o); dreamGrade(ctx, 0.75); rain(ctx, t, k === 0 ? 1 : 0.5); dust(ctx, t, 0.6);
}
VIS[29] = (ctx, t) => {
  const s = S[29];
  if (t < EV.dream29 - 0.1) {
    const z = seg(t, s.start, EV.dream29);
    const R = agentWin(ctx, 'skill', [0.25 + 0.02 * z, 0.41 + 0.01 * z, 0.53 - 0.04 * z, 0.25 - 0.02 * z], { cy: H / 2 - 10, maxk: 1.55 + 0.08 * z });
    if (R) micPulse(ctx, R, t, 1);
    return;
  }
  let k = 0; DREAM29.forEach(([e], j) => { if (t >= EV[e] - 0.1) k = j; });
  dreamAt(ctx, t, k);
  if (k === 1) fold(ctx, seg(t, EV.fold29 - 0.1, EV.fold29 + 0.75), g => dreamAt(g, t, 0));   // 「对折翻转」：上一张图就地对折翻上去
};
// 30 讲完（输入框里是整段梦）→「生成」按下发送 → 四张梦境图在窗口里一张张生成出来 →「收进相册」四张收拢飞走
const GEN = ['D_CROSS', 'D_PARIS', 'D_CONCRETE', 'D_GLASS'];
VIS[30] = (ctx, t) => {
  const s = S[30], tg = EV.gen30, tIn = wt(30, '收进') - 0.1;
  const zo = ease(seg(t, s.start, s.start + 0.5)), zg = ease(seg(t, tg + 0.1, tg + 0.7));
  const box = lerpBox(lerpBox([0.24, 0.4, 0.55, 0.3], [0.16, 0.3, 0.68, 0.42], zo), [0.12, 0.3, 0.76, 0.62], zg);
  const R = agentWin(ctx, 'text', box, { cy: H / 2 - 10, maxk: lerp(1.5, 1.0, zg) });
  if (!R) return;
  recClick(ctx, R, [AG.send[0] - 0.01, AG.send[1] + 0.07 - 0.01, 0.02, 0.02], t, tg - 0.05, C.ORANGE);
  // 生成的四张图：排在输入框下面，依次「显影」出来；「收进相册」时窗口退成梦境底色，四张图在画面中间收拢成一叠
  const fly = ease(seg(t, tIn + 0.25, s.end + 0.05));
  if (fly > 0) { bg(ctx, 'BG_DREAM', fly); ctx.save(); ctx.globalAlpha = fly; dust(ctx, t, 0.7); ctx.restore(); }
  GEN.forEach((n, j) => {
    const t0 = tg + 0.1 + j * 0.15, k = easeOut(seg(t, t0, t0 + 0.3)); if (k <= 0) return;
    const c = ptOf(R, 0.33 + j * 0.115, 0.79), wpx = 0.105 * R.vw * R.s, hpx = wpx * 0.66;
    const tx = W / 2 + (j - 1.5) * 70, ty = H / 2 - 20 + Math.abs(j - 1.5) * 12;
    const x = lerp(c[0], tx, fly), y = lerp(c[1], ty, fly), sc = lerp(1, 560 / wpx, fly);
    ctx.save(); ctx.translate(x, y); ctx.scale(sc * (0.9 + 0.1 * k), sc * (0.9 + 0.1 * k)); ctx.rotate(fly * (j - 1.5) * 0.09); ctx.globalAlpha = k;
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24 / sc; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-wpx / 2, -hpx / 2, wpx, hpx, 12); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.beginPath(); ctx.roundRect(-wpx / 2, -hpx / 2, wpx, hpx, 12); ctx.clip(); const im = img(n);
    if (E.ready(im)) { ctx.filter = `blur(${(1 - k) * 14}px)`; E.cover(ctx, im, -wpx / 2, -hpx / 2, wpx, hpx); ctx.filter = 'none'; }
    ctx.restore();
  });
};

// ------------------------------------------------------------------ 录屏 3（20）：梦境相册网页成品（1080×1266 竖版）
const R20 = { weight: [0.355, 0.325, 0.29, 0.29], disc: [0.06, 0.66, 0.88, 0.34] };
function album(ctx, t, ts, rate, box, o = {}) {                           // 相册成品：梦境背景 + 竖版大卡片
  bg(ctx, 'BG_DREAM'); dust(ctx, t, 0.7);
  return recCard(ctx, V('r20', ts, rate), box, Object.assign({ ry: -4, rx: 2, fill: 0.5, cy: H / 2 - 10, maxk: 1.0 }, o));
}
// 31 这就是它做出来的相册 → 最绝的是「失重之城」→ 整座城往天上翻折的压迫感（全屏原图）
const B_WEIGHT = () => badge('b_weight', '失重之城', { size: 56, col: C.PINK });
VIS[31] = (ctx, t) => {
  const s = S[31];
  if (t < EV.weight + 0.35) {
    const zin = ease(seg(t, EV.weight - 0.25, EV.weight + 0.35));
    const ts = lerp(6.0, 6.8, seg(t, s.start, EV.weight));
    const R = album(ctx, t, ts, 0.3, lerpBox([0, 0, 1, 1], R20.weight, zin), { fill: lerp(0.5, 0.42, zin), maxk: lerp(1.0, 2.6, zin) });
    // 左右两侧飘着相册里的梦（让第一眼就是「一本相册」）
    const a = 1 - zin;
    photo2(ctx, 'D_PARIS', 330, H / 2 + 40, 520, a * easeOut(seg(t, s.start, s.start + 0.4)), 6);
    photo2(ctx, 'D_CROSS', W - 330, H / 2 - 20, 520, a * easeOut(seg(t, s.start + 0.15, s.start + 0.55)), -6);
    recFocus(ctx, R, R20.weight, seg(t, EV.weight - 0.2, EV.weight) * (1 - zin), { col: C.PINK, dim: 0.3 });
  } else {
    const q = seg(t, EV.weight + 0.35, s.end);
    photo(ctx, 'D_WEIGHT', q, { z0: 1.02, z1: 1.18, fy0: 0.0, fy1: 0.25 }); dreamGrade(ctx, 0.5); dust(ctx, t, 0.9);
    E.fill(ctx, '#fff', 0.6 * Math.max(0, 1 - (t - EV.weight - 0.35) / 0.3), 'lighter');
    pop(ctx, t, EV.weight + 0.45, B_WEIGHT(), W / 2, 150, { dy: -30 });
    if (t >= EV.press - 0.1) { const g = E.layer('press'); E.ring(g, W / 2, H * 0.38, 80 + 900 * easeOut(seg(t, EV.press - 0.1, EV.press + 1.2)), C.PINK, 1 - seg(t, EV.press, EV.press + 1.2), 3); E.addLayer(ctx, g, 1, [[10, 1]]); }
  }
};
// 32 梦境放映室：拖一下圆盘就切换不同的梦（真实拖动）
VIS[32] = (ctx, t) => {
  const s = S[32], ts = lerp(23.6, 31.2, seg(t, s.start, s.end));
  const zin = ease(seg(t, s.start, s.start + 0.6));
  const R = album(ctx, t, ts, 7.6 / s.dur, lerpBox([0, 0.3, 1, 0.7], [0.02, 0.55, 0.96, 0.45], zin), { fill: 0.7, maxk: 1.6 });
  recFocus(ctx, R, R20.disc, seg(t, EV.disc - 0.15, EV.disc + 0.2), { col: C.PINK, dim: 0.35 });
};
// 33 每做一个新梦，相册就往后加（相册广场：攒下来的一张张梦）
VIS[33] = (ctx, t) => {
  // 「相册广场」：七本梦境相册排成一墙（录屏 32.7–33.45 秒，画面稳定），慢慢推近
  const s = S[33], u = seg(t, s.start, s.end), ts = lerp(32.7, 33.45, u);
  album(ctx, t, ts, 0.75 / s.dur, lerpBox([0.17, 0.15, 0.66, 0.7], [0.21, 0.19, 0.58, 0.63], ease(u)), { fill: 0.9, maxk: 2.2 });
};

// ------------------------------------------------------------------ 34 阿亮：电脑上能跑还不够
VIS[34] = (ctx, t) => hostJ(ctx, t, [[S[34].start, 1.0], [wt(34, '我需要的是') - 0.05, 1.14]]);

// ------------------------------------------------------------------ 35 右上角点「真机测试」→ 推送到 Amoo 空间 → 扫码真机测试（21 录屏4）
// 坐标按录屏原尺寸量的（1920×1080，网格放大对过）；录屏第 1.45 秒弹出提示和二维码
const R21 = { test: [0.856, 0.019, 0.063, 0.036], toast: [0.392, 0.028, 0.217, 0.051], qr: [0.672, 0.09, 0.062, 0.103], publish: [0.921, 0.017, 0.073, 0.04] };
function rec21(ctx, t, ts, rate, box, o = {}) {
  bg(ctx, 'BG_DARK'); const R = recCard(ctx, V('r21', ts, rate), box, Object.assign({ ry: -4, rx: 3, fill: 0.84, maxk: 2.6 }, o));
  if (ts > 1.38) recBlur(ctx, R, R21.qr);                 // 二维码一律打码
  return R;
}
VIS[35] = (ctx, t) => {
  // 先从整页推到右上角 → 点「真机测试」（点的那一下有光圈）→ 提示弹出，镜头平移把绿色提示放到画面正中、放大 → 继续慢推
  const s = S[35], tc = EV.test35, tp = EV.push35;
  const ts = t < tc ? lerp(0.2, 1.33, seg(t, s.start, tc)) : Math.min(2.75, 1.33 + (t - tc) * 0.45);
  const z1 = ease(seg(t, s.start + 0.1, tc - 0.1)), z2 = ease(seg(t, tc + 0.3, tp + 0.2)), z3 = seg(t, tp + 0.2, s.end);
  const bToast = [0.36 + 0.02 * z3, -0.005 + 0.004 * z3, 0.28 - 0.04 * z3, 0.12 - 0.012 * z3];
  const box = lerpBox(lerpBox([0.02, 0, 0.98, 1], [0.6, 0, 0.4, 0.26], z1), bToast, z2);
  const R = rec21(ctx, t, ts, t < tc ? 1.13 / Math.max(0.3, tc - s.start) : 0.45, box, { ry: lerp(-5, -2, z2) });
  recFocus(ctx, R, R21.test, seg(t, tc - 0.25, tc) * (1 - seg(t, tc + 0.3, tc + 0.55)));
  recClick(ctx, R, R21.test, t, tc);
  if (ts > 1.45) recFocus(ctx, R, R21.toast, seg(t, tc + 0.35, tc + 0.7), { col: C.MINT, dim: 0.45, bar: true });
};
// ------------------------------------------------------------------ 36 第二天早上睁开眼：拿起手机直接跟它说两句（真机上的梦境相册）
function voiceBars(ctx, cx, cy, t, a) {                    // 语音输入的声波胶囊
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(20,14,22,0.85)'; ctx.beginPath(); ctx.roundRect(cx - 190, cy - 52, 380, 104, 52); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = rgb(C.PINK, 1, 0.9); ctx.stroke();
  for (let i = 0; i < 15; i++) { const h = 14 + 48 * Math.abs(Math.sin(t * 9 + i * 0.8) * Math.sin(t * 3.1 + i * 1.7)); ctx.fillStyle = rgb(i % 3 ? C.PINK : C.LILAC); ctx.beginPath(); ctx.roundRect(cx - 150 + i * 21, cy - h / 2, 10, h, 5); ctx.fill(); }
  ctx.restore();
}
VIS[36] = (ctx, t) => {
  const s = S[36], k = easeOut(seg(t, s.start, s.start + 0.6));
  bg(ctx, 'BG_MORNING');
  const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,200,140,0.0)'); g.addColorStop(1, `rgba(255,200,140,${0.22 * k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);   // 晨光
  dust(ctx, t, 0.6, C.GOLD);
  phone(ctx, img('ALBUM_PAGE'), W / 2 - 40, H / 2 + 50 + 220 * (1 - k), 930, { a: k, angle: lerp(-14, -2, k), scrollU: 0.1 * seg(t, s.start, s.end), glow: C.GOLD });
  voiceBars(ctx, W / 2 + 420, H / 2 - 120, t, easeOut(seg(t, EV.talk36 - 0.1, EV.talk36 + 0.3)));
};

// ------------------------------------------------------------------ 37 阿亮：做梦不需要门槛，把梦做出来也不需要了
VIS[37] = (ctx, t) => hostJ(ctx, t, [[S[37].start, 1.06], [wt(37, '那现在') - 0.05, 1.16]]);

// ------------------------------------------------------------------ 38 疯狂念头 → 通过 Step Studio 和 STEPX Neo 变成你的作品（电脑 + 手机并排）
VIS[38] = (ctx, t) => {
  const s = S[38], k = easeOut(seg(t, s.start, s.start + 0.5)), w2 = easeOut(seg(t, EV.works38 - 0.2, EV.works38 + 0.3));
  bg(ctx, 'BG_DARK2'); dust(ctx, t, 0.5, C.ORANGE);
  laptop(ctx, W / 2 - 330, H / 2 - 20 + 60 * (1 - k), 900, k);
  phone(ctx, img('ALBUM_PAGE'), W / 2 + 480, H / 2 + 10 + 80 * (1 - k), 820, { a: k, angle: -4, scrollU: 0.3 * seg(t, s.start, s.end), glow: C.ORANGE });
  pop(ctx, t, wt(38, 'Step Studio') - 0.05, badge('b38ss', 'Step Studio', { size: 48 }), W / 2 - 330, H / 2 + 300, { dy: 20 });
  pop(ctx, t, wt(38, 'STEPX Neo') - 0.05, badge('b38neo', 'STEPX Neo', { size: 48 }), W / 2 + 480, H / 2 + 320, { dy: 20 });
  if (w2 > 0) { const g = E.layer('w38'); E.ring(g, W / 2 + 80, H / 2, 200 + 900 * w2, C.ORANGE, (1 - w2) * 0.8, 4); E.addLayer(ctx, g, 1, [[10, 1]]); }
};

// ------------------------------------------------------------------ 39 阿亮：搓 Skill 的朋友，别吃灰，大胆把狂想变成现实（直视镜头）
VIS[39] = (ctx, t) => hostJ(ctx, t, [[S[39].start, 1.04], [wt(39, '大胆') - 0.05, 1.16]]);

// ------------------------------------------------------------------ 40 投稿上传到 AmooStore（右上角「发布并上架」）
const T_STORE = () => title('t_store', 'AmooStore', { size: 150, fill: ['#ffffff', '#ffd2b5'], glow: C.ORANGE, glowK: 0.7, spacing: 6 });
VIS[40] = (ctx, t) => {
  // 从「真机测试 / 二维码」一侧慢慢推到「发布并上架」，说到 AmooStore 时点下去
  const s = S[40], u = ease(seg(t, s.start, EV.store + 0.2));
  const box = lerpBox([0.55, 0.0, 0.45, 0.3], [0.72, 0.0, 0.28, 0.13], u);
  const R = rec21(ctx, t, 2.7, 0, box, { cy: H / 2 + 110, fill: 0.8 });
  recFocus(ctx, R, R21.publish, seg(t, s.start + 0.2, s.start + 0.6));
  recClick(ctx, R, R21.publish, t, EV.store);
  slam(ctx, t, EV.store - 0.05, T_STORE(), W / 2, 170, { s0: 1.2, flash: 0.15, shake: 0.25 });
};

// ------------------------------------------------------------------ 41 去 STEPX 狂想计划专题页逛逛：大家都在做什么（几个狂想并排）
function vidCard(ctx, key, ts, cx, cy, w, a, angle = 0, crop = CASE_CROP) {
  if (a <= 0) return; const v = V(key, ts, 1); const h = w * 9 / 16;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.rotate(-angle * Math.PI / 180);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.clip(); if (E.ready(v)) E.cover(ctx, v, -w / 2, -h / 2, w, h, 0.5, 0.5, crop ? px(v, crop) : null);
  ctx.restore(); ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.rotate(-angle * Math.PI / 180); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.stroke(); ctx.restore();
}
const T_PLAN = () => title('t_plan', 'STEPX 狂想计划', { size: 130, fill: ['#ffffff', '#ffc9a3'], glow: C.ORANGE, glowK: 0.6, spacing: 6 });
VIS[41] = (ctx, t) => {
  const s = S[41], tl = t - s.start;
  bg(ctx, 'BG_DARK2'); dust(ctx, t, 0.5, C.ORANGE);
  pop(ctx, t, EV.plan41 - 0.1, T_PLAN(), W / 2, 170, { dy: -30 });
  const a = k => easeOut(seg(t, s.start + 0.05 + k * 0.15, s.start + 0.45 + k * 0.15));   // 一开口三张卡就在（避免空背景），大字随后单独砸上方
  vidCard(ctx, 'a01', 478.6 + tl * 0.8, W / 2 - 560, H / 2 + 110, 600, a(0), 4);
  vidCard(ctx, 'a02', 232.2 + Math.min(tl, 1.8) * 0.8, W / 2, H / 2 + 80, 600, a(1), 0);
  photo2(ctx, 'D_WEIGHT', W / 2 + 560, H / 2 + 110, 420, a(2), -4);
  [['飞行滑板', -560], ['奥德赛', 0], ['梦境相册', 560]].forEach(([n, dx], k) => E.put(ctx, badge('b41' + n, n, { size: 40 }), W / 2 + dx, H / 2 + 330 + (k === 1 ? -30 : 0), a(k)));
};

// ------------------------------------------------------------------ 42 阿亮：下一个成真的狂想，说不定就是你的（收在表情上）
VIS[42] = (ctx, t) => hostJ(ctx, t, [[S[42].start, 1.0], [wt(42, '说不定') - 0.05, 1.1]]);
