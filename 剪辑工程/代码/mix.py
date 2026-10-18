# 混音：人声（出镜 + 非出镜两条录音）+ 配乐 + 音效 → 网页版/mix.m4a（-14 LUFS）
#   python3 build.py audio     # 先排时间线再混音（改了停顿/口播后用这个）
#   python3 mix.py             # 只重混（只改了配乐/音效时用这个，读 _timeline.json）
#   python3 mix.py check       # 另外出一张声画对位图 网页版/_tmp/sync.png（人声/配乐/音效包络 + 事件线）
#
# 配乐思路（全部来自 剪辑工程/音乐/，都是曲库里的整曲，不是凑的）：
#   ① 0:00–0:32  开场+案例 Mind Heist（《盗梦空间》预告配乐）：第一句说完切峡谷那一刀正是重拍；「回到主人身边」也落在重拍上；
#                          阿亮一露脸曲子恰好收进静音缝，自然收住
#   ② 0:33–1:50  发布会    futuristic-view：阿亮口播下是铺垫，曲子「起来」那一下正对 STEPX Neo 大字
#   ③ 1:50–2:31  做梦的缘由 Time（Hans Zimmer，《盗梦空间》）开头的钢琴：弦乐进来那一下正对「梦境相册」大字
#   ④ 2:31–3:09  搭技能    smart-sparks：轻快的电子，垫录屏
#   ⑤ 3:09–3:45  讲梦→成品 Time 的高潮段：讲梦时铺进来，曲子最大的那次重进正对相册成品亮相
#   ⑥ 3:45–结尾  号召      hopeful piano：前面是安静的钢琴（真机测试、早上醒来），高潮正对「那些疯狂念头」，
#                          高潮结束的地方正好是片尾
# 三档电平（相对人声听感响度）：停顿/纯画面 −8、口播下 −17、真人出镜 −24；换曲一律交叉淡化。
import os, sys, json, wave, subprocess, hashlib, re
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
WEB = os.path.join(HERE, '..', '网页版'); TMP = os.path.join(WEB, '_tmp'); os.makedirs(TMP, exist_ok=True)
MUS = os.path.join(HERE, '..', '音乐')
SR = 44100
SRC = {'cam': os.path.join(ROOT, '口播', '口播', '出镜-粗剪.mp4'), 'vo': os.path.join(ROOT, '口播', '口播', '非出镜-粗剪.wav'),
       'open': os.path.join(ROOT, '补充', '开头第一句.mp4')}
RETAKE = json.load(open('retake.json', encoding='utf-8'))
SRC['retake'] = os.path.join(ROOT, RETAKE['file'])

T = json.load(open('_timeline.json', encoding='utf-8'))
PRE, DUR = T['PRE'], T['DUR']
EV = {k: v + PRE for k, v in T['EV'].items()}                 # 下面一律用成片时间
S = {s['i']: dict(s, start=s['start'] + PRE, vend=s['vend'] + PRE, end=s['end'] + PRE) for s in T['shots']}

def load(p, af=None):
    """读成 44.1k 立体声 float32，按 (文件, 修改时间, 滤镜) 缓存"""
    cd = os.path.join(TMP, '_acache'); os.makedirs(cd, exist_ok=True)
    key = hashlib.md5(f'{p}|{os.path.getmtime(p)}|{af}|{SR}'.encode()).hexdigest(); cp = os.path.join(cd, key + '.npy')
    if os.path.exists(cp): return np.load(cp)
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-vn', '-ac', '2', '-ar', str(SR)] + (['-af', af] if af else []) + ['-f', 'f32le', '-'],
                       capture_output=True, check=True)
    x = np.frombuffer(r.stdout, np.float32).reshape(-1, 2).copy(); np.save(cp, x); return x
def movavg(v, n):
    n = max(1, int(n)); c = np.concatenate([[0.0], np.cumsum(v, dtype=np.float64)]); L = len(v)
    i = np.arange(L); a = np.clip(i - n // 2, 0, L); b = np.clip(i - n // 2 + n, 0, L)
    return ((c[b] - c[a]) / n).astype(np.float32)
def db(x): return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
def lufs(x):
    p = os.path.join(TMP, '_l.wav')
    with wave.open(p, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    v = re.findall(r'I:\s+(-?[\d.]+) LUFS', r); return float(v[-1]) if v else db(x)
def peak_of(x): return movavg(np.abs(x).mean(1), 441).argmax() / SR

# ---------------------------------------------------------------- 配乐（时间全是成片时间）
def M(file, src, at, frm, to, fin=1.0, fout=1.5, dip=(), gap=-8, under=-17, host=-24, auto=()):
    """曲子 file 的第 src 秒对准成片 at 秒；只用成片 [frm, to] 这一段；auto=[(成片秒, dB), …] 额外的音量走势（线性插值）"""
    return dict(file=file, src=src, at=at, frm=frm, to=to, fin=fin, fout=fout, dip=list(dip), gap=gap, under=under, host=host, auto=list(auto))
PHONE = S[21]['start']                                   # 制作动机口播直接进入手机场景
MUSIC = [
    M('Mind Heist - Zack Hemsey.m4a', 21.0, S[2]['start'], 0.0, S[5]['start'] + 0.4, fin=0.3, fout=0.55, under=-16,
      auto=[(S[2]['start'] + 2.35, 0), (S[2]['start'] + 3.85, -4), (S[2]['start'] + 8.85, -4), (S[2]['start'] + 10.35, 0)]),   # 第 2 句下面曲子自己在长，压一点免得抢词
    M('sergepavkinmusic-futuristic-view-198436.mp3', 17.5, EV['promo_pause'] + 0.05, S[5]['start'] + 0.15, S[17]['start'] + 1.4,
      fin=1.4, fout=1.4, dip=[EV['maker'] - 0.05],
      auto=[(S[6]['start'] - 0.5, 4), (S[6]['start'] + 0.5, 0),
            (EV['promo_pause'], 0), (EV['promo_pause'] + 0.4, 10),
            (EV['first'] - 0.45, 10), (EV['first'] - 0.12, 0)]),  # 产品纯画面相对原版抬 10 dB，口播返回前收回
    # 弦乐进来之后整体比前面的钢琴响一截：大字那一下让它冲，之后压回口播下的正常位置
    M('Time - Hans Zimmer.mp3', 30.85, PHONE, S[17]['start'], S[22]['start'] + 0.6, fin=0.4, fout=1.6, auto=[(S[18]['start'], 0), (S[18]['start'] + 0.5, 3), (S[19]['start'] - 0.3, 3), (S[19]['start'] + 0.3, 0), (PHONE + 0.8, 0), (PHONE + 1.8, -6)]),
    M('kissan4-smart-sparks-436614.mp3', 0.0, S[22]['start'] - 0.5, S[22]['start'] - 0.5, S[29]['start'] + 1.2, fin=0.8, fout=1.8),
    M('Time - Hans Zimmer.mp3', 190.85, S[31]['start'], S[29]['start'] - 0.2, S[34]['start'] + 1.0, fin=2.2, fout=1.6),
    M('echoes_of_lumen-hope-music-hopeful-piano-586991.mp3', 113.45, S[38]['start'], S[34]['start'] - 0.4, DUR, fin=1.4, fout=2.2,
      auto=[(S[34]['start'] + 1.5, 0), (S[34]['start'] + 4.0, 7), (S[38]['start'] - 0.6, 7), (S[38]['start'], 0)]),   # 高潮前的安静钢琴抬上来，不能没了
]

# ---------------------------------------------------------------- 音效（克制：甩镜切点 + 几个大字；小徽章、小卡片不配声）
SFXF = {'rise': '上升-whoosh rise.mp3', 'rrise': '上声音-reverse rise.mp3', 'whoosh': '转场-Whoosh.mp3', 'swish': '转场-Windy swish.mp3',
        'gate': '重音-Gate Hit.mp3', 'thud': '重音-Thud Hit C.mp3', 'dong': '重音-咚 重磅.mp3'}
def sfx_plan():
    W = lambda c: EV[c]
    cuts = [(f'甩镜 {c}', W(c), 'whoosh', 0.24) for c in T['CUTS'] if c != 'cut17']
    return cuts + [
        ('20%', W('n20') - 0.05, 'gate', 0.3),
        ('STEPX Neo·蓄力', W('promo_pause') + 0.05, 'rise', 0.45), ('STEPX Neo', W('promo_pause') + 0.05, 'dong', 0.9),
        ('软硬模一体', W('hw'), 'gate', 0.35),
        ('人人都是AI创客·蓄力', W('maker') - 0.05, 'rise', 0.45), ('人人都是AI创客', W('maker') - 0.05, 'dong', 0.85),
        ('对折进梦境', W('cut17') + 0.3, 'swish', 0.3),
        ('让我来拍板', W('decide') - 0.05, 'thud', 0.45), ('校验通过', W('verify') - 0.05, 'thud', 0.4),
        ('对折翻转', W('fold29') + 0.25, 'swish', 0.24),
        ('AmooStore', W('store') - 0.05, 'gate', 0.32),
    ]

def build():
    # —— 人声：两条录音分别按听感响度对齐，片段两端 25 毫秒淡入淡出，低切 70Hz
    # atempo 保持音高；尾部补齐算法舍入差，时间线仍能精确取到指定长度。
    retake_rate = RETAKE.get('rate', 1.0)
    RAW = {k: load(p, 'highpass=f=70' +
                  (f",atempo={retake_rate},apad=whole_dur={RETAKE['a1'] / retake_rate:.6f}" if k == 'retake' else ''))
           for k, p in SRC.items()}
    N = int((DUR + 0.3) * SR); voice = np.zeros((N, 2), np.float32)
    L = {k: lufs(np.concatenate([RAW[k][int(a0 * SR):int(a1 * SR)] for s_, a0, a1, o in T['pieces'] if s_ == k])) for k in RAW}
    GN = {k: 10 ** ((L['vo'] - L[k]) / 20) for k in RAW}
    print('人声响度', {k: round(v, 1) for k, v in L.items()}, '→ 出镜补偿', round(20 * np.log10(GN['cam']), 1), 'dB')
    for s_, a0, a1, o in T['pieces']:
        x = RAW[s_][int(a0 * SR):int(a1 * SR)] * GN[s_]; i = int((o + PRE) * SR); n = min(len(x), N - i)
        f = np.ones(n, np.float32); k = min(int(0.025 * SR), n // 2); f[:k] = np.linspace(0, 1, k); f[n - k:] = np.linspace(1, 0, k)
        voice[i:i + n] += x[:n] * f[:, None]
    v_lufs = lufs(voice); vmask = np.abs(voice).mean(1) > 1e-5; v_db = db(voice[vmask])
    # —— 说话包络（1 毫秒一步）：压下 0.15 秒、抬起 0.6 秒；换气（<0.45 秒）不抬
    act = movavg(np.abs(voice).mean(1), 0.05 * SR) > 10 ** ((v_db - 25) / 20)
    D_ = 44; act_c = act[:N // D_ * D_].reshape(-1, D_).any(1); env_c = np.zeros(len(act_c), np.float32)
    e = 0.0; up, dn = D_ / (0.15 * SR), D_ / (0.6 * SR); hold = int(0.45 * SR / D_); last = -10 ** 9
    for k in range(len(act_c)):
        if act_c[k]: last = k
        e = min(1.0, e + up) if k - last < hold else max(0.0, e - dn); env_c[k] = e
    env = np.interp(np.arange(N), np.arange(len(act_c)) * D_ + D_ / 2, env_c).astype(np.float32)
    hostm = np.zeros(N, np.float32)                       # 真人出镜：音乐再低一档，整段不随换气起伏
    for s in S.values():
        if s['src'] == 'cam': hostm[int(s['start'] * SR):int(s['end'] * SR)] = 1.0
    hostm = movavg(hostm, 0.6 * SR)
    # —— 配乐
    music = np.zeros((N, 2), np.float32); rep_m = []
    for m in MUSIC:
        tr = load(os.path.join(MUS, m['file'])); s0 = m['src'] - (m['at'] - m['frm']); n = int((m['to'] - m['frm']) * SR)
        a = int(round(s0 * SR)); pad = max(0, -a); x = np.concatenate([np.zeros((pad, 2), np.float32), tr[max(0, a):max(0, a) + n - pad]])
        if len(x) < n: x = np.concatenate([x, np.zeros((n - len(x), 2), np.float32)])
        m_l = lufs(x)
        fi, fo = max(1, int(m['fin'] * SR)), max(1, int(m['fout'] * SR))
        x[:fi] *= np.linspace(0, 1, fi)[:, None]; x[-fo:] *= np.linspace(1, 0, fo)[:, None]
        dg = np.ones(len(x), np.float32)
        for dp in m['dip']:                               # 重击：前 0.25 秒压低约 10 dB，之后 0.6 秒回来
            c = int((dp - m['frm']) * SR); a_, b_ = int(0.25 * SR), int(0.6 * SR)
            if 0 <= c - a_ and c + b_ < len(x):
                dg[c - a_:c] = np.minimum(dg[c - a_:c], np.linspace(1, 0.32, a_)); dg[c:c + b_] = np.minimum(dg[c:c + b_], np.linspace(0.32, 1, b_))
        if m['auto']:
            ka = np.array(m['auto'], np.float64); tt_ = m['frm'] + np.arange(len(x)) / SR
            dg *= (10 ** (np.interp(tt_, ka[:, 0], ka[:, 1]) / 20)).astype(np.float32)
        x *= dg[:, None]
        g = lambda rel: 10 ** ((v_lufs + rel - m_l) / 20)
        i0 = int(m['frm'] * SR); e_ = env[i0:i0 + len(x)]; h_ = hostm[i0:i0 + len(x)]; x = x[:len(e_)]
        gain = (g(m['gap']) + (g(m['under']) - g(m['gap'])) * e_) * (1 - h_) + g(m['host']) * h_
        music[i0:i0 + len(x)] += x * gain[:, None]; rep_m.append((m['file'], m['frm'], m['to'], m_l))
    # —— 音效：峰值对准事件时间
    sfx = np.zeros((N, 2), np.float32); cache = {}; rep = []
    for name, te, key, gn in sfx_plan():
        if key not in cache: y = load(os.path.join(MUS, '音效', SFXF[key])); cache[key] = (y / (np.abs(y).max() + 1e-9), peak_of(y))
        y, pk = cache[key]; i = int((te - pk) * SR); j0 = max(0, -i); i = max(0, i); n = min(len(y) - j0, N - i)
        sfx[i:i + n] += y[j0:j0 + n] * gn * 0.5; rep.append((name, te, key))
    return voice, music, sfx, rep, rep_m, v_lufs

if __name__ == '__main__' or 'build.py' in sys.argv[0]:
    voice, music, sfx, rep, rep_m, v_l = build()
    mix = np.clip(voice + music + sfx, -1, 1)
    raw = os.path.join(TMP, 'mix_raw.wav')
    with wave.open(raw, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    g = -14.0 - lufs(mix)
    enc = 'aac_at' if 'aac_at' in subprocess.run(['ffmpeg', '-hide_banner', '-encoders'], capture_output=True, text=True).stdout else 'aac'
    out = os.path.join(WEB, 'mix.m4a')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', f'volume={g:.2f}dB,alimiter=limit=0.84:attack=1:release=50:level=disabled',
                    '-t', f'{DUR:.3f}', '-ar', '44100', '-c:a', enc, '-b:a', '192k', out], check=True)
    for f, a, b, l in rep_m: print(f'  配乐 {a:6.1f}–{b:6.1f}  {f}  （这一段 {l:.1f} LUFS）')
    print(f'音效 {len(rep)} 个；mix.m4a ok（增益 {g:+.1f} dB）')
    if 'check' in sys.argv[1:]:
        import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
        d = 441; tt = np.arange(0, len(voice), d) / SR
        def envd(x): return 20 * np.log10(movavg(np.abs(x).mean(1), d)[::d] + 1e-5)
        fig, axs = plt.subplots(5, 1, figsize=(30, 22))
        for k, ax in enumerate(axs):
            a, b = k * DUR / 5, (k + 1) * DUR / 5
            ax.plot(tt, envd(voice), lw=0.5, color='#555'); ax.plot(tt, envd(music), lw=0.8, color='#d4a017'); ax.plot(tt, envd(sfx), lw=0.6, color='#2a7fd4')
            for name, te, key in rep:
                if a <= te <= b: ax.axvline(te, color='#c0392b', lw=0.6, alpha=0.6)
            for s in S.values():
                if a <= s['start'] <= b: ax.axvline(s['start'], color='#27ae60', lw=1, alpha=0.5, ls='--')
            ax.set_xlim(a, b); ax.set_ylim(-70, 0); ax.grid(alpha=0.2)
        fig.tight_layout(); fig.savefig(os.path.join(TMP, 'sync.png'), dpi=60); print('sync.png ok')
