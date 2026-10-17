// ① 开头（第 1–5 句）：两个狂想案例 → 阿亮正面收束「照进了现实」
'use strict';

// ------------------------------------------------------------------ 1 开场：阿亮指着电脑里的发布会画面说第一句（补充/开头第一句.mp4，画面和声音同一条）
VIS[1] = (ctx, t) => {
  const p = D.pieces[0], tl = t - S[1].start;               // ['open', a0, a1, o]
  full(ctx, 'open', p[1] + tl, { z: 1.0 + 0.04 * clamp(tl / 2.2, 0, 1), fx: 0.55, fy: 0.45 });
};

// ------------------------------------------------------------------ 2 AI 飞行滑板 + Amoo 当「贾维斯」
VIS[2] = (ctx, t) => {
  cutList(ctx, t, [
    [S[2].start, clip('a01', 501.0, 504.21, { rate: 1.1, push: 0.08 })],   // 一切过来就是峡谷里贴水飞（配乐重拍落在这一刀）
    [EV.amoo2 - 0.6, clip('a01', 352.54, 357.29, { push: 0.04, align: 0.7 })],   // 手腕上的 Neo：Amoo 飞行仪表
    [EV.assist - 0.05, clip('a01', 466.38, 467.88, { rate: 1.1 })], // 夜里大桥上飞
    [EV.assist + 1.15, clip('a01', 506.58, 509.38, { push: 0.06 })], // 第一视角：人脸 + 峡谷
  ]);
  nameCard(ctx, t, EV.skate + 0.1, S[2].end - 0.1, { title: '神奇阿宇', sub: 'AI 飞行滑板', x: 96, y: 72 });
};

// ------------------------------------------------------------------ 3 奥德赛挑战：画面跟着口播走——陌生的咖啡店 → 弹出「流量即将用尽」→「电量剩余20%」（推近）→ 地图上的长路线 → 它自己开口
VIS[3] = (ctx, t) => {
  cutList(ctx, t, [
    [S[3].start, clip('a02', 123.49, 124.69, { push: 0.03 })],      // 挑战开始
    [S[3].start + 1.0, clip('a02', 125.83, 128.4, { push: 0.05 })], // 桌上的 Neo，奥德赛 Skill 启动
    [EV.c3env - 0.05, clip('a02', 137.2, 142.78, { push: 0.05 })],  // 陌生的咖啡店
    [EV.c3bat - 0.05, clip('a02', 117.3, 118.45, { z: 1.3, fy: 0.62, push: 0.06 })],   // 手机弹出「流量即将用尽」
    [wt(3, '电量') - 0.05, clip('a02', 118.5, 119.85, { z: 1.4, fy: 0.8, push: 0.1 })],      // 「电量剩余20%」，推近
    [EV.c3far - 0.05, clip('a02', 119.95, 122.4, { push: 0.06 })],  // 地图：离主人很远的一条长路线
    [EV.c3cmd - 0.05, clip('a02', 134.87, 137.2, { push: 0.04 })],  // 没人给它下指令：它自己开口了
  ]);
  nameCard(ctx, t, S[3].start + 0.3, EV.c3bat - 0.1, { title: '图灵的猫', sub: '「奥德赛」Agent', tone: 'ice', x: 96, y: 72 });
};

// ------------------------------------------------------------------ 4 奥德赛自己完成：联网 → 充电 → 路线 → 叫车 → 联系主人（顶部流程条跟着亮）
// 顶部流程条（跟着标签方向 A / B / C 走）：当前这一步最亮，做完的打勾变青，没到的压暗
const STEPS4 = [['联网', 'c4net'], ['充电', 'c4chg'], ['规划路线', 'c4route'], ['叫车', 'c4car'], ['联系主人', 'c4owner']];
function chain(ctx, t, y, a) {
  if (a <= 0) return;
  const st = STEPS4.map(([n, e], j) => { const on = t >= EV[e], cur = on && (j + 1 >= STEPS4.length || t < EV[STEPS4[j + 1][1]]); return { n, on, cur, done: on && !cur, t0: EV[e] }; });
  ctx.save(); ctx.globalAlpha = a;
  if (LABEL === 'b') {                                       // 贴纸：当前是橙色贴纸，做完的是白贴纸打勾，没到的半透明
    const cs = st.map(it => labelB({ title: (it.done ? '✓ ' : '') + it.n, sub: null, tone: it.cur ? 'orange' : it.done ? 'mint' : [120, 120, 130], size: 44 }));
    const gap = -18, tw = cs.reduce((q, c) => q + c.width, 0) + gap * (cs.length - 1); let x = W / 2 - tw / 2;
    cs.forEach((c, j) => { const it = st[j], p = it.cur ? backOut(seg(t, it.t0, it.t0 + 0.35)) : 1;
      E.put(ctx, c, x + c.width / 2, y, a * (it.on ? 1 : 0.45), (it.cur ? 1.08 : 0.92) * (0.85 + 0.15 * p), j % 2 ? 2 : -2); x += c.width + gap; });
  } else if (LABEL === 'c') {                                // 大字：当前一步用标题字 + 辉光，其余是小字
    const ims = st.map(it => it.cur ? title('ch_c_' + it.n, it.n, { size: 72, fill: ['#ffffff', '#ffd2b5'], glow: C.ORANGE, glowK: 0.7 })
      : cardText((it.done ? '✓ ' : '') + it.n, 40, 500, it.done ? 'rgb(140,225,200)' : 'rgba(210,210,220,0.45)', 2));
    const ws = ims.map((im, j) => st[j].cur ? im.width - 160 : im.width), gap = 64, tw = ws.reduce((q, w) => q + w, 0) + gap * (ws.length - 1);
    const band = ctx.createLinearGradient(0, 0, 0, y + 90); band.addColorStop(0, 'rgba(0,0,0,0.7)'); band.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = band; ctx.fillRect(0, 0, W, y + 90);
    let x = W / 2 - tw / 2;
    ims.forEach((im, j) => { const it = st[j];
      if (it.cur) { const p = easeOut(seg(t, it.t0, it.t0 + 0.3)); E.put(ctx, im, x + ws[j] / 2, y, a * p, 1.1 - 0.1 * p); } else ctx.drawImage(im, x, y - im.height / 2);
      x += ws[j]; if (j + 1 < ims.length) { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x + 14, y - 1, gap - 28, 2); x += gap; } });
  } else {                                                   // 铭牌：一串斜切块，当前是橙色块，其余是黑块
    const ims = st.map(it => { const L = labelA({ title: (it.done ? '✓ ' : '') + it.n, sub: null, tone: it.cur ? 'orange' : [36, 36, 42], size: 44 }); return L.top; });
    const gap = -6, tw = ims.reduce((q, im) => q + im.width, 0) + gap * (ims.length - 1); let x = W / 2 - tw / 2;
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5;
    ims.forEach((im, j) => { const it = st[j]; ctx.globalAlpha = a * (it.on ? 1 : 0.55); ctx.drawImage(im, x, y - im.height / 2 - (it.cur ? 4 * easeOut(seg(t, it.t0, it.t0 + 0.25)) : 0)); x += im.width + gap; });
  }
  ctx.restore();
}
VIS[4] = (ctx, t) => {
  // 流程条亮着的时候：视频缩成卡片往下让，流程条单独占顶部一条，两者不重叠
  const a = easeOut(seg(t, EV.c4net - 0.35, EV.c4net)) * (1 - easeIn(seg(t, EV.c4back - 0.05, EV.c4back + 0.3)));
  const k = a, sc = 1 - 0.2 * k, cy = H / 2 + 95 * k;
  if (k > 0) { bg(ctx, 'BG_DARK'); ctx.save(); ctx.globalAlpha = k; ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.roundRect(W / 2 - W * sc / 2, cy - H * sc / 2, W * sc, H * sc, 22 * k); ctx.fill(); ctx.restore(); }
  ctx.save();
  if (k > 0) { ctx.beginPath(); ctx.roundRect(W / 2 - W * sc / 2, cy - H * sc / 2, W * sc, H * sc, 22 * k); ctx.clip(); ctx.translate(W / 2, cy); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2); }
  cutList(ctx, t, [
    [S[4].start, clip('a02', 131.53, 134.2, { push: 0.05 })],       // 自己判断位置
    [EV.c4p1 - 0.05, clip('a02', 142.78, 164.93, { push: 0.05, align: 0.02 })], // 主动开口：联网求助
    [EV.c4chg - 0.05, clip('a02', 164.93, 167.93, { push: 0.04 })], // 下单充电宝
    [EV.c4chg + 0.8, clip('a02', 184.95, 188.52, { push: 0.04 })],  // 外卖小哥送来充电宝
    [EV.c4p2 - 0.05, clip('a02', 252.85, 254.92, { push: 0.05 })],  // 规划路线
    [EV.c4car - 0.05, clip('a02', 234.23, 240.11, { push: 0.04, align: 0.3 })], // 打车
    [EV.c4owner - 0.05, clip('a02', 70.34, 78.78, { push: 0.05, align: 1 })],    // 联系主人
    [EV.c4back - 0.05, clip('a02', 232.06, 234.23, { push: 0.05 })], // 回到主人身边
  ]);
  ctx.restore();
  if (k > 0) { ctx.save(); ctx.globalAlpha = 0.35 * k; ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.roundRect(W / 2 - W * sc / 2, cy - H * sc / 2, W * sc, H * sc, 22 * k); ctx.stroke(); ctx.restore();
    chain(ctx, t, 98 - 30 * (1 - a), a); }
};

// ------------------------------------------------------------------ 5 阿亮正面：观点收束（第一次露脸）
VIS[5] = (ctx, t) => hostJ(ctx, t, [[S[5].start, 1.0], [wt(5, '但在AI时代') - 0.05, 1.12], [EV.real - 0.08, 1.22]]);
