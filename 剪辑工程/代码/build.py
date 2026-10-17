# 排时间线 → 网页版/data.js（镜头、每个字的时间、字幕、事件表 EV、口播片段）
#   python3 build.py            # 只导时间线
#   python3 build.py audio      # 时间线 + 混音（mix.py）
# 时间约定：时间线时间 t 从第一句口播开始算；成片时间 = t + PRE（开头留 PRE 秒给冷开画面）
import json, re, difflib, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
WEB = os.path.join(HERE, '..', '网页版')
from lines import LINES

PRE = 0.0                     # 第一帧就是出镜第一句（补充/开头第一句.mp4，第 0.05 秒开口）
GAP = 0.12                    # 句与句之间的默认间隔
PAUSE = {                     # 某句说完后额外停顿（画面和音乐顶上来；只放在全屏画面上）
    1: 0.12, 4: 0.2, 5: 0.6, 8: 0.1, 11: 0.6, 13: 0.1, 14: 0.5, 16: 0.2, 19: 0.3, 20: 0.7, 21: 0.3,
    24: 0.3, 26: 0.4, 29: 0.15, 30: 0.5, 31: 0.25, 33: 0.25, 34: 0.1, 36: 0.2, 38: 0.15, 39: -0.07, 41: 0.15,
}
TAIL = 0.65                   # 最后一句说完后停在人物表情上（出镜原片在最后一句后还有约 0.6 秒）

AL = {o['shot']: o for o in json.load(open('aligned.json', encoding='utf-8'))}
def norm(s): return [m.group(0).lower() for m in re.finditer(r'[一-鿿]|[A-Za-z]+|\d', s)]

shots, pieces, t = [], [], 0.0
for shot, kind, src, text in LINES:
    o = AL[shot]; a0, a1 = max(0.0, o['a0']), o['a1']
    # 字幕文本的每个「字」→ 时间：和 ASR 逐字时间做序列对齐，没对上的字按前后插值
    tn = norm(text); asr = o['chars']; an = [c for c, _ in asr]
    tt = [None] * len(tn)
    for blk in difflib.SequenceMatcher(None, tn, an, autojunk=False).get_matching_blocks():
        for j in range(blk.size): tt[blk.a + j] = asr[blk.b + j][1]
    known = [(k, v) for k, v in enumerate(tt) if v is not None]
    if not known: known = [(0, a0 + 0.12), (len(tn) - 1, a1 - 0.2)]
    if known[0][0] != 0: known.insert(0, (0, min(known[0][1], a0 + 0.12)))
    if known[-1][0] != len(tn) - 1: known.append((len(tn) - 1, max(known[-1][1], a1 - 0.25)))
    for k, v in known: tt[k] = v
    for (k0, v0), (k1, v1) in zip(known, known[1:]):
        for k in range(k0 + 1, k1): tt[k] = v0 + (v1 - v0) * (k - k0) / (k1 - k0)
    for k in range(1, len(tt)): tt[k] = max(tt[k - 1] + 0.02, tt[k])      # 单调
    o_t = t                                                                  # 这一句在时间线上的起点
    chars = [round(o_t + (v - a0), 3) for v in tt]
    dur = a1 - a0
    shots.append(dict(i=shot, kind=kind, src=src, text=text, start=round(o_t, 3), vend=round(o_t + dur, 3), chars=chars))
    pieces.append([src, round(a0, 3), round(a1, 3), round(o_t, 3)])
    t = o_t + dur + GAP + PAUSE.get(shot, 0.0)
TOTAL = shots[-1]['vend'] + TAIL
for a, b in zip(shots, shots[1:]): a['end'] = b['start']
# 出镜句说完马上切走：停顿留给下一句的画面（不停在不出声的人脸上）。第 20 句例外：停顿里砸「梦境相册」大字
HOLD_KEEP = {20}
for a, b in zip(shots, shots[1:]):
    if a['src'] in ('cam', 'open') and a['i'] not in HOLD_KEEP and b['start'] - a['vend'] > 0.1:
        a['end'] = b['start'] = round(a['vend'] + 0.06, 3)
shots[-1]['end'] = round(TOTAL, 3)
S = {s['i']: s for s in shots}

def wt(i, word, k=0):
    """第 i 镜里第 k 次出现的这个词，第一个字被说出来的时刻"""
    s = S[i]; txt = s['text']; p = -1
    for _ in range(k + 1): p = txt.index(word, p + 1)
    return s['chars'][len(norm(txt[:p]))]
def last_voice(i): return S[i]['chars'][-1] + 0.3

# ---------------------------------------------------------------- 字幕：按标点断句，每条不超过 16 个字
SUBS = []
for s in shots:
    parts = [p for p in re.split(r'(?<=[，。？！：；、,])', s['text']) if p.strip()]
    chunks, cur = [], ''
    for p in parts:
        if len(cur) + len(p) <= 16 or not cur: cur += p
        else: chunks.append(cur); cur = p
    if cur: chunks.append(cur)
    k = 0
    for c in chunks:
        n = len(norm(c)); a = s['chars'][k] - 0.05; k2 = min(k + n, len(s['chars'])) - 1
        b = s['chars'][k2] + 0.32; k += n
        SUBS.append([round(a, 3), re.sub(r'[，。、；：,]$', '', c).strip(), s['i'], round(b, 3)])
for x, y in zip(SUBS, SUBS[1:]):                       # 前一条字幕最多显示到下一条开始
    if x[3] > y[0]: x[3] = y[0]

# ---------------------------------------------------------------- 事件表（画面、音乐、音效都对齐它）
EV = dict(
    hook=wt(1, '最疯狂'), skate=wt(2, 'AI飞行滑板'), amoo2=wt(2, 'Amoo'), assist=wt(2, '辅助'),
    c3=wt(3, '手机自救'), c3env=wt(3, '把STEPX'), c3bat=wt(3, '流量告急'), n20=wt(3, '20'), c3far=wt(3, '离主人'), c3cmd=wt(3, '也没人'),
    c4=wt(4, '结果'), c4p1=wt(4, '先想办法'), c4net=wt(4, '联网'), c4chg=wt(4, '充电'), c4p2=wt(4, '再通过'), c4route=wt(4, '高德'), c4car=wt(4, '叫车'), c4owner=wt(4, '跨应用'), c4back=wt(4, '最终'),
    real=wt(5, '照进了现实'),
    same=wt(6, '同一台'), neo=wt(6, 'STEPX'), first=wt(6, '首款'),
    hw=wt(7, '软硬模一体'), hw_end=wt(7, '而不是'),
    amoo8=wt(8, 'Amoo'), sys8=wt(8, '调系统'), done8=wt(8, '把事情'),
    surprise=wt(9, '真正意外'),
    studio10=wt(10, 'AI创作台'), create10=wt(10, '创造力'),
    m_model=wt(11, '模型'), m_sys=wt(11, '系统'), m_hw=wt(11, '硬件'), m_eco=wt(11, '生态'), maker=wt(11, '人人都是'),
    nocode=wt(12, '不会写代码'),
    ss13=wt(13, 'Step'), ide=wt(13, '首款'),
    plain=wt(14, '大白话'), tryit=wt(14, '我们亲自'),
    d16a=wt(16, '倒挂'), d16b=wt(16, '这些都是'),
    album17=wt(17, '梦境相册'), why17=wt(17, '为什么'),
    g_sci=wt(18, '科幻'), g_cop=wt(18, '警匪'), g_old=wt(18, '怀旧'),
    forget=wt(19, '忘得'), quote=wt(19, '我好像'),
    album20=wt(20, '梦境相册'),
    phone21=wt(21, '必须在手机上'), bed21=wt(21, '床上'), pc21=wt(21, '等爬起来'),
    builder=wt(22, '技能构建器'), chat22=wt(22, '就像'), send=wt(22, '发射'),
    nine=wt(23, '角色定位'), ch_role=wt(23, '角色定位'), ch_dream=wt(23, '梦境解析'), ch_img=wt(23, '图像生成'), ch_ui=wt(23, 'UI设计'), nine_n=wt(23, '九个章节'),
    unsure=wt(24, '拿不准'), decide=wt(24, '拍板'),
    min5=wt(26, '5分钟'), verify=wt(26, '校验'),
    agent=wt(28, 'Agent'), drag=wt(28, '拽进去'), tell=wt(28, '把梦讲给'),
    dream29=wt(29, '雨夜'), fold29=wt(29, '对折翻转'), bend29=wt(29, '路灯'), paper29=wt(29, '揉皱'), old29=wt(29, '老城'),
    gen30=wt(30, '生成'),
    album31=wt(31, '你看'), weight=wt(31, '失重之城'), press=wt(31, '压迫感'),
    disc=wt(32, '圆盘'), more33=wt(33, '之前'),
    test35=wt(35, '真机测试'), push35=wt(35, '推到了'),
    wake=wt(36, '睁开眼'), talk36=wt(36, '直接跟它'),
    ideas38=wt(38, '疯狂念头'), works38=wt(38, '变成你的作品'),
    store=wt(40, 'AmooStore'), plan41=wt(41, '狂想计划'), look41=wt(41, '看看大家'),
    final=wt(42, '下一个'),
)
for s in shots: EV[f'cut{s["i"]}'] = s['start']
CUTS = [f'cut{i}' for i in (2, 3, 5, 6, 10, 13, 16, 22, 28, 31, 35, 37, 41)]   # 有甩镜/转场声的切点（其余为硬切）

D = dict(W=1920, H=1080, FPS=30, PRE=PRE, TOTAL=round(TOTAL, 3), DUR=round(PRE + TOTAL, 3),
         shots=shots, pieces=pieces, subs=SUBS, EV={k: round(v, 3) for k, v in EV.items()}, CUTS=CUTS)
os.makedirs(WEB, exist_ok=True)
with open(os.path.join(WEB, 'data.js'), 'w', encoding='utf-8') as f:
    f.write('// 由 剪辑工程/代码/build.py 生成，不要手改\nwindow.D = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
json.dump(D, open('_timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'时长 {PRE + TOTAL:.1f} 秒（{int((PRE + TOTAL) // 60)}:{(PRE + TOTAL) % 60:04.1f}），{len(shots)} 句，{len(SUBS)} 条字幕')
if __name__ == '__main__' and 'audio' in sys.argv[1:]:
    exec(open('mix.py', encoding='utf-8').read())
