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
  nameCard(ctx, t, EV.skate + 0.1, S[2].end - 0.1, { kind: 'person', name: '神奇阿宇', en: 'SHENQI AYU', role: 'AI 飞行滑板挑战', nick: '空中飞人', x: 90, y: 60 });
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
  nameCard(ctx, t, S[3].start + 0.3, EV.c3bat - 0.1, { kind: 'person', name: '图灵的猫', en: "TURING'S CAT", role: '「奥德赛」Agent', nick: '手机自救', tone: 'ice', x: 90, y: 60 });
};

// ------------------------------------------------------------------ 4 奥德赛自己完成：联网 → 充电 → 路线 → 叫车 → 联系主人（顶部流程条跟着亮）
// 顶部步骤条（借鉴小Lin说的编号徽章）：五块黑底小牌，上方挂编号小圆标；当前一步亮、银色字 + 橙色编号，做完的半亮，没到的压暗
const STEPS4 = [['联网', 'c4net'], ['充电', 'c4chg'], ['规划路线', 'c4route'], ['叫车', 'c4car'], ['联系主人', 'c4owner']];
function stepCanvas(n, i, state) {
  const key = `ST|${n}|${i}|${state}`; if (_txt[key]) return _txt[key];
  const s = 46, w = txtW(n, LIGHT(s), 6) + 76, h = 86, M = 40, R = 21, c = document.createElement('canvas'); c.width = Math.ceil(w + M * 2); c.height = Math.ceil(h + M * 2 + R); const g = c.getContext('2d');
  drawPlate(g, M, M + R, w, h); const cy = M + R + h / 2;
  put(g, n, M + w / 2, cy + 1, LIGHT(s), state === 'cur' ? silver(g, cy - s / 2, cy + s / 2) : state === 'done' ? 'rgba(235,235,242,0.8)' : 'rgba(200,200,210,0.4)', 6, 'center');
  const bx = M + w / 2, by = M + R;                       // 编号小圆标
  g.beginPath(); g.arc(bx, by, R, 0, Math.PI * 2); g.fillStyle = state === 'cur' ? rgb(C.ORANGE) : 'rgba(18,18,22,0.95)'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = state === 'cur' ? 'rgba(255,220,190,0.9)' : 'rgba(255,255,255,0.35)'; g.stroke();
  put(g, state === 'done' ? '✓' : String(i + 1), bx, by + 1, state === 'done' ? `600 22px ${SANS}` : '28px Num', state === 'todo' ? 'rgba(220,220,230,0.5)' : '#fff', 0, 'center');
  return (_txt[key] = { c, M, w, h, R });
}
function chain(ctx, t, y, a) {
  if (a <= 0) return;
  const ims = STEPS4.map(([n, e], j) => { const on = t >= EV[e], cur = on && (j + 1 >= STEPS4.length || t < EV[STEPS4[j + 1][1]]); return { im: stepCanvas(n, j, cur ? 'cur' : on ? 'done' : 'todo'), cur, t0: EV[e] }; });
  const gap = 34, tw = ims.reduce((q, it) => q + it.im.w, 0) + gap * (ims.length - 1); let x = W / 2 - tw / 2;
  ims.forEach((it, j) => {
    const P = it.im, lift = it.cur ? 6 * easeOut(seg(t, it.t0, it.t0 + 0.3)) : 0;
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(P.c, x - P.M, y - P.h / 2 - P.R - P.M - lift); ctx.restore();
    if (j + 1 < ims.length) { ctx.save(); ctx.globalAlpha = a * 0.45; ctx.fillStyle = '#fff'; ctx.fillRect(x + P.w + 8, y + 9, gap - 16, 1.2); ctx.restore(); }
    x += P.w + gap;
  });
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
    chain(ctx, t, 100 - 30 * (1 - a), a); }
};

// ------------------------------------------------------------------ 5 阿亮正面：观点收束（第一次露脸）
VIS[5] = (ctx, t) => hostJ(ctx, t, [[S[5].start, 1.0], [wt(5, '但在AI时代') - 0.05, 1.12], [EV.real - 0.08, 1.22]]);
