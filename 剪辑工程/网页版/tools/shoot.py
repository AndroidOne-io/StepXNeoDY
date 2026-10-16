#!/usr/bin/env python3
# 自查用：无头浏览器打开网页版，在指定时间点精确画帧并截图，拼成一张对照图。
#   python3 tools/shoot.py 输出.jpg "名字=JS时间表达式" ...
#   例：python3 tools/shoot.py /tmp/a.jpg "22=S[22].start+PRE+1.2" "valley=EV.valley+PRE+0.5"
# 表达式在页面里求值，可用 S、EV、PRE、D。默认用 ?proxy（测试浏览器不支持 H.264，需先跑 _proxy_make.sh）。
import sys, os, threading, http.server, re, io, urllib.parse
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.argv.pop(0); OUT = sys.argv.pop(0); PTS = [a.split('=', 1) for a in sys.argv]
sys.path.insert(0, os.path.join(ROOT, '剪辑工程', '网页版'))
import importlib.util
spec = importlib.util.spec_from_file_location('serve_mod', os.path.join(ROOT, '剪辑工程', '网页版', 'serve.py'))
src = open(spec.origin, encoding='utf-8').read().split('H.extensions_map')[0]
_argv = sys.argv; sys.argv = ['serve.py']; ns = {'__file__': spec.origin}; exec(src, ns); sys.argv = _argv
Hh = ns['H']; Hh.extensions_map.update({'.js': 'text/javascript', '.mp4': 'video/mp4', '.webm': 'video/webm', '.m4a': 'audio/mp4', '.ttf': 'font/ttf'})
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Hh); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{port}/' + urllib.parse.quote('剪辑工程/网页版/index.html') + '?proxy'

ims = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1920, 'height': 1200})
    logs = []; pg.on('console', lambda m: logs.append(m.text)); pg.on('pageerror', lambda e: logs.append('ERR ' + str(e)))
    pg.goto(url); pg.wait_for_function('window.READY === true', timeout=180000)
    for name, expr in PTS:
        t = pg.evaluate(f'(() => {{ const PRE = D.PRE; return {expr}; }})()')
        pg.evaluate(f'window.renderAt({t})')
        data = pg.evaluate("document.getElementById('c').toDataURL('image/jpeg', 0.85)")
        import base64
        im = Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))).convert('RGB').resize((640, 360))
        ImageDraw.Draw(im).text((8, 6), f'{name} {t:.2f}', fill=(255, 230, 0)); ims.append(im)
    b.close()
for l in logs[:30]: print(l)
cols = 3; g = Image.new('RGB', (640 * cols, 360 * ((len(ims) + cols - 1) // cols)))
for k, im in enumerate(ims): g.paste(im, ((k % cols) * 640, (k // cols) * 360))
g.save(OUT, quality=88); print('saved', OUT, len(ims))
