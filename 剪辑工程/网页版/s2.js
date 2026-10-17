// ② 发布会核心理念 & Step Studio（第 6–14 句）：同一台手机 → STEPX Neo → 软硬模一体 → Amoo 办事 → AI 创作台 → 四重能力 → 人人都是AI创客 → Step Studio
'use strict';
// 发布会素材（不是案例原片，没有烧录字幕，不用裁）
const lc = (key, a, b, o = {}) => clip(key, a, b, Object.assign({ crop: null }, o));

// ------------------------------------------------------------------ 6 两个狂想在同一台手机上 → STEPX Neo → 首款大模型原生智能体手机
const T_NEO = () => title('t_neo', 'STEPX Neo', { size: 210, font: 'Title', fill: ['#ffffff', '#ffd2b5'], glow: C.ORANGE, glowK: 0.75, spacing: 8 });
VIS[6] = (ctx, t) => {
  cutList(ctx, t, [
    [S[6].start, lc('l08', 3.0, 9.5, { push: 0.05 })],              // 发布会上，神奇阿宇站在飞行滑板上
    [EV.neo - 0.1, lc('l05', 1.1, 3.15, { push: 0.04 })],           // STEPX Neo 入场
    [EV.first - 0.15, lc('p10', 18.2, 26.3, { push: 0.06, dim: 0.75 })],   // 官方产品镜头：手机背面
  ]);
  if (t >= EV.first) slam(ctx, t, EV.first + 0.05, T_NEO(), W / 2, H / 2 - 20, { s0: 1.18, flash: 0.25, shake: 0.4 });
};

// ------------------------------------------------------------------ 7 阿亮：什么意思？软硬模一体（中间插一眼官方结构动画）
const T_HW = () => title('t_hw', '软硬模一体', { size: 170, fill: ['#ffffff', '#ffc9a3'], glow: C.ORANGE });
VIS[7] = (ctx, t) => {
  if (t >= EV.hw - 0.1 && t < EV.hw_end - 0.05) {
    lc('p10', 1.0, 9.0, { push: 0.08, dim: 0.7, align: 0.2 })(ctx, t, EV.hw - 0.1, EV.hw_end - EV.hw);
    slam(ctx, t, EV.hw, T_HW(), W / 2, H / 2, { s0: 1.2, flash: 0.2, shake: 0.3 });
    return;
  }
  hostJ(ctx, t, [[S[7].start, 1.08], [wt(7, '就是它') - 0.05, 1.0], [EV.hw_end - 0.05, 1.14]]);
};

// ------------------------------------------------------------------ 8 不用一个个 App 去点 → 跟 Amoo 说 → 它去调系统、调服务 → 办好
VIS[8] = (ctx, t) => cutList(ctx, t, [
  [S[8].start, lc('l16', 1.0, 21.0, { push: 0.1, align: 0 })],       // 「Amoo 的朋友圈」：满屏 App
  [EV.amoo8 - 0.1, lc('p10', 11.0, 16.0, { push: 0.06, align: 0.4 })],   // Amoo 本体
  [EV.sys8 - 0.1, lc('l09', 0.0, 1.79, { push: 0.08, rate: 0.6 })],  // 链路：Amoo → 系统 → 服务
  [EV.done8 - 0.1, lc('l15', 3.6, 8.8, { push: 0.05, align: 0.2 })], // 一屏屏办完的界面
]);

// ------------------------------------------------------------------ 9 阿亮：真正意外的是另一个点（单独一句，推近）
VIS[9] = (ctx, t) => hostJ(ctx, t, [[S[9].start, 1.0], [EV.surprise - 0.1, 1.16]]);

// ------------------------------------------------------------------ 10 不只是一台手机，还是 AI 创作台；核心竞争力是创造力
VIS[10] = (ctx, t) => cutList(ctx, t, [
  [S[10].start, lc('l11', 2.0, 7.6, { push: 0.05 })],                // 大屏：STEPX Neo 在展示格里亮相（不拍观众）
  [EV.studio10 - 0.6, lc('l20', 0.0, 2.08, { push: 0.04, rate: 0.7 })],   // STEPX Neo / StepAOS / Step Studio 一起亮相
  [EV.create10 - 0.4, lc('l14', 25.4, 33.5, { push: 0.07, align: 0.3 })], // 主视觉：Amoo 穿越星际
]);

// ------------------------------------------------------------------ 11 四重能力：四张大卡依次单独出现 → 「人人都是AI创客」
const CAPS = [['01', '模型', '提供智能', 'm_model'], ['02', '系统', '赋予行动', 'm_sys'], ['03', '硬件', '连接物理世界', 'm_hw'], ['04', '生态', '连接真实服务', 'm_eco']];
function capCard(k) {
  const key = 'cap' + k; if (_txt[key]) return _txt[key];
  const [n, big, small] = CAPS[k]; const c = document.createElement('canvas'); c.width = 980; c.height = 520; const g = c.getContext('2d');
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 18;
  g.beginPath(); g.roundRect(40, 40, 900, 440, 40); const gr = g.createLinearGradient(0, 40, 0, 480); gr.addColorStop(0, 'rgba(32,30,36,0.92)'); gr.addColorStop(1, 'rgba(16,15,19,0.92)'); g.fillStyle = gr; g.fill();
  g.shadowColor = 'transparent'; g.lineWidth = 3; g.strokeStyle = 'rgba(255,140,80,0.75)'; g.stroke();
  g.fillStyle = rgb(C.ORANGE); g.beginPath(); g.roundRect(40, 40, 900, 12, [40, 40, 0, 0]); g.fill();
  g.font = '120px Num'; g.fillStyle = 'rgba(255,106,31,0.9)'; g.textBaseline = 'alphabetic'; g.fillText(n, 100, 200);
  g.font = '190px Title'; g.fillStyle = '#ffffff'; g.shadowColor = 'rgba(255,106,31,0.55)'; g.shadowBlur = 30; g.fillText(big, 250, 250); g.shadowColor = 'transparent';
  g.font = '84px Title'; g.fillStyle = '#ffd2b5'; try { g.letterSpacing = '6px'; } catch (e) {} g.fillText(small, 100, 405);
  return (_txt[key] = c);
}
const T_MAKER = () => title('t_maker', '人人都是AI创客', { size: 160, fill: ['#ffffff', '#ffbf8f'], glow: C.ORANGE, glowK: 0.8 });
VIS[11] = (ctx, t) => {
  if (t < EV.maker - 0.15) {
    lc('l13', 0.5, 33.5, { push: 0.04, align: 0, dim: 0.42, sat: 0.6 })(ctx, t, S[11].start, EV.maker - S[11].start);   // 设计师在纸上画 Neo
    const open = wt(11, '全都开放'), pulse = Math.max(0, 1 - Math.abs(t - open - 0.15) / 0.35);
    CAPS.forEach((c, j) => {
      const t0 = EV[c[3]] - 0.1, u = seg(t, t0, t0 + 0.22); if (u <= 0) return;
      const x = W / 2 + (j % 2 ? 1 : -1) * 405, y = H / 2 - 60 + (j < 2 ? -205 : 205);
      E.put(ctx, capCard(j), x + (j % 2 ? 1 : -1) * 80 * (1 - easeOut(u)), y, easeOut(u), (0.74 + 0.06 * easeOut(u)) * (1 + 0.04 * pulse));
    });
    if (pulse > 0) E.flash(ctx, pulse * 0.08);
    return;
  }
  lc('l14', 58.2, 64.5, { push: 0.06, dim: 0.55, align: 0.2 })(ctx, t, EV.maker - 0.15, S[11].end - EV.maker);   // 光门打开
  slam(ctx, t, EV.maker - 0.05, T_MAKER(), W / 2, H / 2 - 20, { s0: 1.3, flash: 0.45, shake: 0.6 });
};

// ------------------------------------------------------------------ 12 阿亮观点：不会写代码的人能不能用起来（必须露脸）
VIS[12] = (ctx, t) => hostJ(ctx, t, [[S[12].start, 1.04], [EV.nocode - 0.1, 1.16]]);

// ------------------------------------------------------------------ 13 Step Studio：首款 AI 终端原生的 AI IDE（真实首页录屏）
const T_SS = () => title('t_ss', 'Step Studio', { size: 140, font: 'Title', fill: ['#ffffff', '#ffd2b5'], glow: C.ORANGE, glowK: 0.6, spacing: 6 });
VIS[13] = (ctx, t) => {
  bg(ctx, 'BG_DARK'); const tl = t - S[13].start, u = ease(seg(tl, 0, S[13].dur));
  const v = V('r22', clamp(tl * 0.95, 0, 4.6), 0.95);
  // 先看整页，再轻推到左上角的产品名和「技能构建器」入口
  const box = [0, 0, lerp(1, 0.9, u), lerp(1, 0.9, u)];
  const R = recCard(ctx, v, box, { cy: H / 2 + 150, fill: 0.6, ry: lerp(-8, -4, u), rx: 5, maxk: 1.2 });
  pop(ctx, t, EV.ss13 - 0.05, T_SS(), W / 2, 125, { dy: -30 });
  if (t >= EV.ide - 0.1 && subNow(t).includes('IDE')) SUB_OFF = true;   // 名片上已经是这句，字幕不重复
  nameCard(ctx, t, EV.ide - 0.1, S[13].end + 1, { kind: 'plate', k: '首款', v: 'AI 终端原生的 AI IDE', size: 46, x: W / 2, y: 262, align: 'center' });
};

// ------------------------------------------------------------------ 14 阿亮：说人话 → 我们亲自试试（结尾停顿里「对折」进入梦境）
VIS[14] = (ctx, t) => hostJ(ctx, t, [[S[14].start, 1.0], [EV.plain - 0.1, 1.12], [EV.tryit - 0.1, 1.04]]);
