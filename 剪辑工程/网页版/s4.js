// ③ 梦境相册 Skill（下）+ ④ 结尾：用技能讲梦 → 生成 → 相册成品 → 放映室 → 真机测试 → 醒来就能用 → 号召投稿 → 狂想计划 → 结尾
'use strict';

// ------------------------------------------------------------------ 录屏 2（19）：选构建器 → 输入框里 @dream-album + 梦的描述 → 发送 → 生成 → 手机预览
const R19 = {
  menu: [0.003, 0.085, 0.085, 0.042],     // 左上构建器下拉（换成「应用构建器」= 打开一个 Agent）
  input: [0.295, 0.3, 0.6, 0.19],           // 5.6 秒：输入框里的整段梦
  tag: [0.298, 0.31, 0.088, 0.042],         // 「@dream-album」——技能已经拽进来
  phone: [0.55, 0.11, 0.24, 0.86],          // 15 秒后：右侧手机预览里的相册
};
function rec19(ctx, t, ts, rate, box, o = {}) { bg(ctx, o.bgName || 'BG_DARK'); return recCard(ctx, V('r19', ts, rate), box, Object.assign({ ry: -5, rx: 3, fill: 0.84 }, o)); }
// 28 随便打开一个 Agent，把技能拽进去，把梦讲给它
VIS[28] = (ctx, t) => {
  const s = S[28], u = seg(t, s.start, s.end), ts = lerp(0.5, 5.8, u);
  const zin = ease(seg(t, EV.drag - 0.4, EV.drag + 0.1)), zm = ease(seg(t, EV.agent - 0.2, EV.agent + 0.2)) * (1 - zin);
  const box = lerpBox(lerpBox([0, 0, 1, 1], [0, 0, 0.4, 0.4], zm), [0.25, 0.2, 0.7, 0.38], zin);
  const R = rec19(ctx, t, ts, 5.3 / s.dur, box, { maxk: 2.2 });
  recFocus(ctx, R, R19.menu, seg(t, EV.agent - 0.05, EV.agent + 0.3) * (1 - zin));
  if (ts >= 5.0) recFocus(ctx, R, R19.tag, seg(t, s.start + (5.0 - 0.5) / 5.3 * s.dur, s.start + (5.3 - 0.5) / 5.3 * s.dur), { col: C.PINK });
};
// 29 讲梦：先看真实输入的那段梦，再随着口播穿插相册里对应的画面（雨夜街道 → 往上对折 → 揉皱的纸 → 倒挂的老城）
const DREAM29 = [['dream29', 'D_CROSS', { z0: 1.05, z1: 1.15, fy0: 0.6, fy1: 0.4 }], ['fold29', 'D_PARIS', { z0: 1.12, z1: 1.02, fy0: 0.15, fy1: 0.55 }],
  ['paper29', 'D_CONCRETE', { z0: 1.0, z1: 1.12, fy0: 0.5, fy1: 0.4 }], ['old29', 'D_GLASS', { z0: 1.0, z1: 1.12, fy0: 0.05, fy1: 0.35 }]];
function dreamAt(ctx, t, k) {
  const [e, im, o] = DREAM29[k], t0 = EV[e] - 0.1, t1 = k + 1 < DREAM29.length ? EV[DREAM29[k + 1][0]] - 0.1 : S[29].end;
  photo(ctx, im, seg(t, t0, t1), o); dreamGrade(ctx, 0.75); rain(ctx, t, k === 0 ? 1 : 0.5); dust(ctx, t, 0.6);
}
VIS[29] = (ctx, t) => {
  const s = S[29];
  if (t < EV.dream29 - 0.1) {                                            // 输入框里的这段梦（真实输入）
    const R = rec19(ctx, t, 5.6 + 0.4 * seg(t, s.start, EV.dream29), 0.3, [0.27, 0.22, 0.66, 0.32], { maxk: 2.2 });
    recFocus(ctx, R, R19.input, seg(t, s.start + 0.1, s.start + 0.5), { col: C.PINK, dim: 0.4 });
    return;
  }
  let k = 0; DREAM29.forEach(([e], j) => { if (t >= EV[e] - 0.1) k = j; });
  dreamAt(ctx, t, k);
  if (k === 1) fold(ctx, seg(t, EV.fold29 - 0.1, EV.fold29 + 0.75), g => dreamAt(g, t, 0));   // 「对折翻转」：上一张图就地对折翻上去
};
// 30 讲完，让它生成，收进相册：发送 → 创建中（加速）→ 手机预览里出现相册
VIS[30] = (ctx, t) => {
  const s = S[30], u = seg(t, s.start, s.end), ts = lerp(6.9, 16.4, easeIn(u, 1.3));
  const zp = ease(seg(u, 0.55, 0.9));
  const R = rec19(ctx, t, ts, 9.5 / s.dur, lerpBox([0, 0, 1, 1], [0.42, 0.06, 0.5, 0.92], zp), { maxk: 2.0, bgName: 'BG_DREAM' });
  if (zp > 0.9) recFocus(ctx, R, R19.phone, seg(u, 0.85, 1), { col: C.PINK, dim: 0.3 });
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
const R21 = { test: [0.855, 0.0, 0.06, 0.045], toast: [0.385, 0.015, 0.23, 0.06], qr: [0.655, 0.055, 0.27, 0.16], publish: [0.918, 0.0, 0.075, 0.045] };
function rec21(ctx, t, ts, rate, box, o = {}) { bg(ctx, 'BG_DARK'); return recCard(ctx, V('r21', ts, rate), box, Object.assign({ ry: -4, rx: 3, fill: 0.84, maxk: 2.6 }, o)); }
VIS[35] = (ctx, t) => {
  const s = S[35], u = seg(t, s.start, s.end), ts = lerp(0.0, 2.75, u);
  const zin = ease(seg(t, s.start, EV.test35));
  const R = rec21(ctx, t, ts, 2.75 / s.dur, lerpBox([0, 0, 1, 1], [0.36, 0.0, 0.64, 0.36], zin));
  recFocus(ctx, R, R21.test, seg(t, EV.test35 - 0.1, EV.test35 + 0.2) * (1 - seg(t, EV.push35, EV.push35 + 0.2)));
  if (ts > 1.2) recFocus(ctx, R, R21.toast, seg(t, EV.push35 - 0.05, EV.push35 + 0.25), { col: C.MINT, dim: 0.25 });
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
  const s = S[40], R = rec21(ctx, t, 2.7, 0, [0.6, 0.0, 0.4, 0.3], { cy: H / 2 + 120, fill: 0.8 });
  recFocus(ctx, R, R21.publish, seg(t, s.start, s.start + 0.3));
  slam(ctx, t, EV.store - 0.05, T_STORE(), W / 2, 200, { s0: 1.2, flash: 0.15, shake: 0.25 });
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
