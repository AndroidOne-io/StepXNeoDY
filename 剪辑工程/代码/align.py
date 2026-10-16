# 台词 → 两条粗剪录音里的起止时间（用 ASR 逐字时间戳模糊对齐）
import json, re, difflib, numpy as np, subprocess, wave
from lines import LINES
def norm(s): return [m.group(0).lower() for m in re.finditer(r'[一-鿿]|[A-Za-z]+|\d', s)]
def load_tok(p):
    T=[]
    for seg in json.load(open(p, encoding='utf-8')):
        for tok, t in zip(seg['tokens'], seg['ts']):
            for c in norm(tok) or []: T.append((c, t, seg['b']))
    return T
def rms_env(wav):
    with wave.open(wav) as w: x=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768
    hop=160; n=len(x)//hop; e=np.sqrt((x[:n*hop].reshape(n,hop)**2).mean(1)); return e, 0.01
SRC={'cam':('asr_cam.json','/tmp/claude-0/sx/asr/cam16.wav'),'vo':('asr_vo.json','/tmp/claude-0/sx/asr/vo16.wav')}
TOK={k:load_tok(v[0]) for k,v in SRC.items()}; ENV={k:rms_env(v[1]) for k,v in SRC.items()}
FIX = {13: {'a1': 72.72}, 16: {'a0': 72.80}, 1: {'a0': 0.0}}   # 人工校正：13 句尾「IDE」被识别成「夜」
cur={'cam':0,'vo':0}; out=[]
for shot, kind, src, text in LINES:
    T=TOK[src]; tgt=norm(text); i0=cur[src]; win=T[i0:i0+len(tgt)*2+60]
    sm=difflib.SequenceMatcher(None, tgt, [c for c,_,_ in win], autojunk=False)
    bl=[b for b in sm.get_matching_blocks() if b.size>0]
    # 去掉开头/结尾零散的小匹配（防止匹配到别的句子）
    while len(bl)>1 and bl[0].size<2 and bl[1].b-bl[0].b>6: bl=bl[1:]
    while len(bl)>1 and bl[-1].size<2 and bl[-1].b-bl[-2].b>6: bl=bl[:-1]
    a=i0+bl[0].b; b=i0+bl[-1].b+bl[-1].size-1
    ratio=sum(x.size for x in bl)/len(tgt)
    t0=T[a][1]-0.12; tl=T[b][1]
    # 结尾：从最后一个字往后找能量落下的地方（最多 0.6 秒，不越过下一个字）
    e,dt=ENV[src]; thr=max(0.006, np.percentile(e,60)*0.25)
    nxt=T[b+1][1] if b+1<len(T) else tl+1.0
    k=int((tl+0.12)/dt); kmax=int(min(tl+0.9, nxt-0.06)/dt); t1=None
    while k+8<=kmax and k+8<len(e):                     # 找到第一段连续 80 毫秒的静音：那就是这句真正说完的地方
        if (e[k:k+8]<thr).all(): t1=k*dt+0.05; break
        k+=1
    if t1 is None: t1=max(tl+0.2, nxt-0.08)              # 跟下一句连着说、没有静音：切在下一个字前面
    if shot in FIX: t0, t1 = FIX[shot].get('a0', t0), FIX[shot].get('a1', t1)
    chars=[(T[a+j][0],T[a+j][1]) for j in range(b-a+1)]
    out.append(dict(shot=shot,kind=kind,src=src,text=text,a0=round(t0,3),a1=round(t1,3),match=round(ratio,2),chars=chars))
    cur[src]=b+1
    print(f'{shot:2d} {src:3s} {t0:7.2f}-{t1:7.2f} 匹配{ratio:.2f} {text[:22]}')
# 自检：每句起止处应该是静音（否则可能切到字）
for o in out:
    e,dt=ENV[o['src']]; thr=max(0.006, np.percentile(e,60)*0.25)
    s0=e[max(0,int((o['a0']-0.03)/dt))]; s1=e[min(len(e)-1,int((o['a1']+0.03)/dt))]
    if s0>thr*1.5 or s1>thr*1.5: print('  ⚠ 边界有声音', o['shot'], round(float(s0),4), round(float(s1),4), round(thr,4))
json.dump(out, open('aligned.json','w',encoding='utf-8'), ensure_ascii=False, indent=0)
