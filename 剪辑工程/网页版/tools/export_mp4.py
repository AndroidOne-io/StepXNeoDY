#!/usr/bin/env python3
# 网页版 → 成片 mp4（逐帧精确导出：每一帧都等视频跳到位再截，和网页里看到的一模一样）
#
#   python3 剪辑工程/网页版/tools/export_mp4.py                 # 整条，出 剪辑工程/成片输出/网页版成片.mp4（并行数按 CPU 自动定）
#   python3 剪辑工程/网页版/tools/export_mp4.py --jobs 6        # 手动指定并行数（每个占一个浏览器，约 1–1.5G 内存）
#   python3 剪辑工程/网页版/tools/export_mp4.py --from 100 --to 130   # 只导一段试看（成片时间，秒）
#   python3 剪辑工程/网页版/tools/export_mp4.py --small         # 另外压一个 < 30MB 的交付版
#
# 第一次用要装：pip3 install playwright ；本机装了 Google Chrome 就行（脚本用系统 Chrome，因为它能解 H.264）。
# 没装 Chrome 的话：python3 -m playwright install chromium，并先跑 bash 剪辑工程/网页版/_proxy_make.sh 生成 webm 代理素材。
#
# 为什么快：① 原片（尤其 4K 出镜、发布会素材）关键帧稀，逐帧精确跳转很慢；第一次导出时自动转一份每 0.2 秒一个关键帧的副本到 网页版/_export/
#           （只在本地、不进 Git，素材没变就不重转）② 每帧只画两遍 ③ Mac 上视频用系统硬件编码（h264_videotoolbox），不和浏览器抢 CPU
import sys, os, time, json, base64, argparse, subprocess, threading, http.server, urllib.parse, shutil

HERE = os.path.dirname(os.path.abspath(__file__)); WEB = os.path.dirname(HERE); ROOT = os.path.abspath(os.path.join(WEB, '..', '..'))
ap = argparse.ArgumentParser()
ap.add_argument('--jobs', type=int, default=max(1, min(6, (os.cpu_count() or 4) // 2))); ap.add_argument('--fps', type=float, default=0)
ap.add_argument('--from', dest='a', type=float, default=0.0); ap.add_argument('--to', dest='b', type=float, default=-1)
ap.add_argument('--out', default=''); ap.add_argument('--small', action='store_true'); ap.add_argument('--crf', type=int, default=18)
ap.add_argument('--part', nargs=3, help=argparse.SUPPRESS)          # 内部用：--part 起始帧 结束帧 输出文件
args = ap.parse_args()

def encoders():
    try: return subprocess.run(['ffmpeg', '-hide_banner', '-encoders'], capture_output=True, text=True).stdout
    except Exception: return ''
HW = 'h264_videotoolbox' in encoders()                  # Mac：系统硬件 H.264 编码
def venc(q='master'):
    if HW: return ['-c:v', 'h264_videotoolbox', '-b:v', '16M' if q == 'master' else '24M', '-pix_fmt', 'yuv420p']
    return ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', str(args.crf if q == 'master' else 14), '-pix_fmt', 'yuv420p']

# 导出用的素材副本：关键帧密（每 0.2 秒一个），逐帧跳转快
import re as _re
_src = open(os.path.join(WEB, 'sources.js'), encoding='utf-8').read()
EXP = dict(_re.findall(r"(\w+): '([^']+)'", _src[_src.index('{'):]))          # sources.js 里的全部视频
def prepare_export_sources():
    d = os.path.join(WEB, '_export'); os.makedirs(d, exist_ok=True); ok = True
    for k, f in EXP.items():
        src = os.path.join(ROOT, f); dst = os.path.join(d, k + '.mp4')
        if not os.path.exists(src) or os.path.getsize(src) < 10000: ok = False; continue      # 没 git lfs pull
        if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(src): continue
        print(f'  第一次导出：转一份好跳帧的 {f}（只转一次）…', flush=True); t = time.time()
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-map', '0:v:0', '-an'] + venc('src') +
                       ['-g', '6', '-bf', '0', '-force_key_frames', 'expr:gte(t,n_forced*0.2)', '-movflags', '+faststart', dst + '.part.mp4'], check=True)
        os.replace(dst + '.part.mp4', dst); print(f'    好了（{time.time() - t:.0f} 秒）', flush=True)
    return ok

def read_D():
    s = open(os.path.join(WEB, 'data.js'), encoding='utf-8').read(); return json.loads(s[s.index('{'):s.rindex('}') + 1])

# ---------------------------------------------------------------- 子进程：渲一段帧，直接喂给 ffmpeg
def render_part(f0, f1, out, fps):
    src = open(os.path.join(WEB, 'serve.py'), encoding='utf-8').read().split('H.extensions_map')[0]
    argv = sys.argv; sys.argv = ['serve.py']; ns = {'__file__': os.path.join(WEB, 'serve.py')}; exec(src, ns); sys.argv = argv
    Hh = ns['H']; Hh.extensions_map.update({'.js': 'text/javascript', '.mp4': 'video/mp4', '.webm': 'video/webm', '.m4a': 'audio/mp4', '.ttf': 'font/ttf'})
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Hh); threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{srv.server_address[1]}/' + urllib.parse.quote('剪辑工程/网页版/index.html')
    from playwright.sync_api import sync_playwright
    has_proxy = os.path.exists(os.path.join(WEB, '_proxy', 'cam.webm'))
    with sync_playwright() as p:
        A = ['--autoplay-policy=no-user-gesture-required']
        try: b = p.chromium.launch(channel='chrome', args=A)
        except Exception: b = p.chromium.launch(args=A)
        pg = b.new_page(viewport={'width': 1920, 'height': 1200})
        exp_ok = all(os.path.exists(os.path.join(WEB, '_export', k + '.mp4')) for k in EXP)
        pg.goto(base + ('?export' if exp_ok else '')); pg.wait_for_function('window.READY === true', timeout=300000)
        bad = pg.evaluate('E.probeVideos()')            # 这个浏览器能不能解 mp4（H.264）
        if bad:
            if not has_proxy:
                sys.exit(f'浏览器解不了这些视频：{bad}。请安装 Google Chrome（自带 H.264），或先跑 bash 剪辑工程/网页版/_proxy/make.sh 生成 webm 代理素材。')
            print(f'  浏览器解不了原始 mp4（{bad}），改用 _proxy 里的 webm', flush=True)
            pg.goto(base + '?proxy'); pg.wait_for_function('window.READY === true', timeout=300000)
            bad = pg.evaluate('E.probeVideos()')
            if bad: sys.exit(f'webm 代理也读不了：{bad}')
        ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', f'{fps}', '-c:v', 'mjpeg', '-i', '-',
                               ] + venc() + ['-r', f'{fps}', out], stdin=subprocess.PIPE)
        t0 = time.time()
        for n in range(f0, f1):
            data = pg.evaluate(f"(async () => {{ await window.renderAt({n / fps}); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }})()")
            ff.stdin.write(base64.b64decode(data.split(',', 1)[1]))
            k = n - f0 + 1
            if k % 60 == 0 or n == f1 - 1:
                el = time.time() - t0; print(f'  [{os.path.basename(out)}] {k}/{f1 - f0} 帧，还要约 {el / k * (f1 - f0 - k) / 60:.1f} 分钟', flush=True)
        ff.stdin.close(); ff.wait(); b.close()
    if ff.returncode != 0: sys.exit('ffmpeg 出错')

D = read_D(); FPS = args.fps or D['FPS']
if args.part:
    render_part(int(args.part[0]), int(args.part[1]), args.part[2], FPS); sys.exit(0)

# ---------------------------------------------------------------- 主进程：切段 → 并行 → 拼接 + 混好的音轨
a = max(0.0, args.a); b = D['DUR'] if args.b < 0 else min(args.b, D['DUR'])
f0, f1 = int(round(a * FPS)), int(round(b * FPS))
OUTD = os.path.join(ROOT, '剪辑工程', '成片输出'); os.makedirs(OUTD, exist_ok=True)
name = args.out or os.path.join(OUTD, '网页版成片.mp4' if (f0 == 0 and b >= D['DUR'] - 1e-6) else f'网页版试导_{a:g}-{b:g}.mp4')
if not prepare_export_sources(): print('  （素材是 LFS 指针文件？先 git lfs pull）')
tmp = os.path.join(OUTD, '_web_parts'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
J = max(1, min(args.jobs, (f1 - f0) // 30 or 1)); cuts = [f0 + (f1 - f0) * k // J for k in range(J + 1)]
print(f'导出 {a:.2f}–{b:.2f} 秒，共 {f1 - f0} 帧，{J} 个并行，视频编码：{"系统硬件" if HW else "x264"}')
t0 = time.time()
procs = [subprocess.Popen([sys.executable, __file__, '--fps', str(FPS), '--crf', str(args.crf), '--part', str(cuts[k]), str(cuts[k + 1]), os.path.join(tmp, f'p{k:02d}.mp4')])
         for k in range(J)]
for k, p in enumerate(procs):
    if p.wait() != 0: sys.exit(f'第 {k} 段失败（内存不够就减少 --jobs）')
lst = os.path.join(tmp, 'list.txt')
open(lst, 'w', encoding='utf-8').write(''.join(f"file '{os.path.join(tmp, f'p{k:02d}.mp4')}'\n" for k in range(J)))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-ss', f'{a}', '-t', f'{b - a}', '-i', os.path.join(WEB, 'mix.m4a'),
                '-map', '0:v', '-map', '1:a', '-c:v', 'copy'] + (['-c:a', 'copy'] if a == 0 else ['-c:a', 'aac', '-b:a', '256k']) +
               ['-shortest', '-movflags', '+faststart', name], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print(f'完成：{name}（用时 {(time.time() - t0) / 60:.1f} 分钟）')

if args.small:                                   # 交付版：两遍编码压到 ~28MB
    dur = b - a; vk = max(300, int(28 * 8 * 1024 / dur - 128))
    small = name.replace('.mp4', '_交付版.mp4'); pl = os.path.join(OUTD, '_2pass')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', name, '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{vk}k', '-pass', '1', '-passlogfile', pl, '-an', '-f', 'mp4', os.devnull], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', name, '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{vk}k', '-pass', '2', '-passlogfile', pl,
                    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', small], check=True)
    for f in os.listdir(OUTD):
        if f.startswith('_2pass'): os.remove(os.path.join(OUTD, f))
    print(f'交付版：{small}（{os.path.getsize(small) / 1e6:.1f} MB）')
