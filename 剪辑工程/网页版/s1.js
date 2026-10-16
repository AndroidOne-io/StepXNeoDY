// ① 开头（第 1–5 句）：两个狂想案例 → 阿亮正面收束「照进了现实」
'use strict';

// ------------------------------------------------------------------ 1 冷开：口播前 0.5 秒就是峡谷里贴水飞行（首秒出高光）
VIS[1] = (ctx, t) => cutList(ctx, t, [
  [-PRE, clip('a01', 501.0, 504.21, { rate: 1.1, push: 0.08 })],
  [EV.hook + 0.55, clip('a01', 506.58, 509.38, { push: 0.06 })],            // 「最疯狂」后切到第一视角：人脸 + 峡谷
]);

// ------------------------------------------------------------------ 2 AI 飞行滑板 + Amoo 当「贾维斯」
const B_AYU = () => badge('b_ayu', '神奇阿宇 · AI飞行滑板', { size: 44 });
VIS[2] = (ctx, t) => {
  cutList(ctx, t, [
    [S[2].start, clip('a01', 478.46, 480.75, { push: 0.06 })],      // 湖面上空飞行
    [EV.amoo2 - 0.6, clip('a01', 352.54, 357.29, { push: 0.04, align: 0.7 })],   // 手腕上的 Neo：Amoo 飞行仪表
    [EV.assist - 0.05, clip('a01', 466.38, 467.88, { rate: 1.1 })], // 夜里大桥上飞
    [EV.assist + 1.15, clip('a01', 513.83, 517.33, { rate: 1.1 })], // 峡谷贴水
  ]);
  pop(ctx, t, EV.skate + 0.1, B_AYU(), 120 + B_AYU().width / 2, 110, { out: S[2].end - 0.35, dx: -40, dy: 0 });
};

// ------------------------------------------------------------------ 3 奥德赛「手机自救」挑战：条件逐个可视化
const B_TURING = () => badge('b_turing', '图灵的猫 · 「奥德赛」Agent', { size: 44, col: C.ICE });
VIS[3] = (ctx, t) => {
  cutList(ctx, t, [
    [S[3].start, clip('a02', 123.49, 124.69, { push: 0.03 })],      // 挑战开始
    [S[3].start + 1.0, clip('a02', 125.83, 128.4, { push: 0.05 })], // 桌上的 Neo，奥德赛 Skill 启动
    [EV.c3env - 0.05, clip('a02', 137.2, 142.78, { push: 0.05 })],  // 陌生的咖啡店
    [EV.c3bat - 0.05, clip('a02', 188.52, 190.36, { push: 0.12 })], // 状态栏：流量、电量
    [EV.c3far - 0.05, clip('a02', 116.52, 123.49, { push: 0.08, align: 0.6 })], // 离主人很远（路线图）
    [EV.c3cmd - 0.05, clip('a02', 134.87, 137.2, { push: 0.04 })],  // 没人给它下指令：它自己开口了
  ]);
  pop(ctx, t, S[3].start + 0.35, B_TURING(), 120 + B_TURING().width / 2, 110, { out: EV.c3env + 2.2, dx: -40, dy: 0 });
  // 条件可视化：大号数字（不做假界面，只做标注）
  const n20 = title('n20', '20%', { size: 230, font: 'Num', fill: ['#ffb08a', '#ff6a1f'], glow: C.ORANGE, glowK: 0.7 });
  if (t < EV.c3far - 0.05) slam(ctx, t, wt(3, '20') - 0.05, n20, W / 2, H / 2 + 150, { s0: 1.35, flash: 0.15, shake: 0.3 });
  const km = title('km', '十几公里', { size: 150, fill: ['#ffffff', '#cfe9ff'], glow: C.ICE, glowK: 0.6 });
  if (t >= EV.c3far + 0.3 && t < EV.c3cmd - 0.05) pop(ctx, t, wt(3, '十几公里') - 0.05, km, W / 2, H / 2 - 40, { dy: 40 });
};

// ------------------------------------------------------------------ 4 奥德赛自己完成：联网 → 充电 → 路线 → 叫车 → 联系主人（顶部流程条跟着亮）
const STEPS4 = [['联网', 'c4net'], ['充电', 'c4chg'], ['规划路线', 'c4route'], ['叫车', 'c4car'], ['联系主人', 'c4owner']];
function chain(ctx, t, items, y, o = {}) {           // 顶部流程链：亮起的为橙色，之前的变青色
  const { a = 1, col = C.ORANGE, done = C.MINT, gapX = 300 } = o, n = items.length, x0 = W / 2 - (n - 1) * gapX / 2;
  const g = E.layer('chain');
  for (let k = 0; k < n - 1; k++) E.line(g, [[x0 + k * gapX + 100, y], [x0 + (k + 1) * gapX - 100, y]], t >= items[k + 1][1] ? col : [110, 110, 120], a, 4);
  E.addLayer(ctx, g, 1, [[6, 0.6 * a]]);
  items.forEach(([name, t0], k) => {
    const on = t >= t0, last = k + 1 >= n || t < items[k + 1][1];
    const im = badge(`ch_${name}_${on ? (last ? 'on' : 'done') : 'off'}`, name, { size: 40, col: on ? (last ? col : done) : [120, 120, 130], dot: on, bgA: on ? 0.85 : 0.55, textCol: on ? '#fff' : '#9a9aa6' });
    const pk = on && last ? backOut(seg(t, t0, t0 + 0.3)) : 1;
    E.put(ctx, im, x0 + k * gapX, y, a * (on ? 1 : 0.7), on && last ? 0.85 + 0.15 * pk : 1);
  });
}
VIS[4] = (ctx, t) => {
  cutList(ctx, t, [
    [S[4].start, clip('a02', 131.53, 134.2, { push: 0.05 })],       // 自己判断位置
    [EV.c4p1 - 0.05, clip('a02', 142.78, 164.93, { push: 0.05, align: 0.02 })], // 主动开口求助
    [EV.c4chg - 0.05, clip('a02', 164.93, 167.93, { push: 0.04 })], // 下单充电宝
    [EV.c4chg + 0.8, clip('a02', 184.95, 188.52, { push: 0.04 })],  // 外卖小哥送来充电宝
    [EV.c4p2 - 0.05, clip('a02', 252.85, 254.92, { push: 0.05 })],  // 规划路线
    [EV.c4car - 0.05, clip('a02', 234.23, 240.11, { push: 0.04, align: 0.3 })], // Amoo：联网、充电、打车、联系
    [EV.c4owner - 0.05, clip('a02', 70.34, 78.78, { push: 0.05, align: 1 })],    // 联系主人
    [EV.c4back - 0.05, clip('a02', 232.06, 234.23, { push: 0.05 })], // 回到主人身边：主人笑着挥手
  ]);
  const a = easeOut(seg(t, EV.c4net - 0.3, EV.c4net)) * (1 - easeIn(seg(t, EV.c4back + 0.2, EV.c4back + 0.5)));
  if (a > 0) {
    ctx.save(); const gr = ctx.createLinearGradient(0, 0, 0, 230); gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.globalAlpha = a; ctx.fillRect(0, 0, W, 230); ctx.restore();
    chain(ctx, t, STEPS4.map(([n, e]) => [n, EV[e]]), 110 - 40 * (1 - a), { a });
  }
};

// ------------------------------------------------------------------ 5 阿亮正面：观点收束（第一次露脸）
VIS[5] = (ctx, t) => hostJ(ctx, t, [[S[5].start, 1.0], [wt(5, '但在AI时代') - 0.05, 1.12], [EV.real - 0.08, 1.22]]);
