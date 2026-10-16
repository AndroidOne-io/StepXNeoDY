#!/usr/bin/env python3
# 本地预览服务器：在仓库根目录开一个支持断点续传（Range）的网页服务，然后打开浏览器。
# 视频要能拖动就必须支持 Range，所以不能直接用 python -m http.server。
#   python3 剪辑工程/网页版/serve.py            # 默认端口 8765
import http.server, os, re, sys, threading, webbrowser, urllib.parse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes'); self.send_header('Cache-Control', 'no-cache'); super().end_headers()
    def do_GET(self):
        rng = self.headers.get('Range'); path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path): return super().do_GET()
        m = re.match(r'bytes=(\d*)-(\d*)', rng); size = os.path.getsize(path)
        a = int(m.group(1)) if m and m.group(1) else 0; b = int(m.group(2)) if m and m.group(2) else size - 1
        b = min(b, size - 1)
        if a > b: self.send_response(416); self.send_header('Content-Range', f'bytes */{size}'); self.end_headers(); return
        self.send_response(206); self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {a}-{b}/{size}'); self.send_header('Content-Length', str(b - a + 1)); self.end_headers()
        with open(path, 'rb') as f:
            f.seek(a); left = b - a + 1
            try:
                while left > 0:
                    chunk = f.read(min(1 << 20, left))
                    if not chunk: break
                    self.wfile.write(chunk); left -= len(chunk)
            except (BrokenPipeError, ConnectionResetError): pass

H.extensions_map.update({'.js': 'text/javascript', '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.ttf': 'font/ttf'})
srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H)
url = f'http://127.0.0.1:{PORT}/' + urllib.parse.quote('剪辑工程/网页版/index.html')
print('预览地址：', url, '\n（关掉这个窗口就停止服务）')
if '--no-open' not in sys.argv: threading.Timer(0.6, lambda: webbrowser.open(url)).start()
srv.serve_forever()
