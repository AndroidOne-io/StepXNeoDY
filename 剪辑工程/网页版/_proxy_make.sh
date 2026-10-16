#!/bin/bash
# 测试用代理素材（云端测试浏览器不支持 H.264 时才需要）：sources.js 里每个视频转一份 960 宽的 VP9 webm 到 _proxy/
cd "$(dirname "$0")"; mkdir -p _proxy
python3 - <<'PY'
import re, os, subprocess
s = open('sources.js', encoding='utf-8').read(); d = dict(re.findall(r"(\w+): '([^']+)'", s[s.index('{'):]))
for k, f in d.items():
    out = f'_proxy/{k}.webm'
    if os.path.exists(out) and os.path.getsize(out) > 1000: continue
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '../../' + f, '-map', '0:v:0', '-an', '-vf', 'scale=960:-2', '-c:v', 'libvpx-vp9',
                    '-deadline', 'realtime', '-cpu-used', '8', '-row-mt', '1', '-b:v', '1500k', '-g', '10', out], check=True)
    print('done', k, flush=True)
PY
