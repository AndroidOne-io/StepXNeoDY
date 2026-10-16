# 静态图：背景（石墨黑 / 梦境紫，带光斑和颗粒，不是纯色）、梦境图、手机框、Step Studio 主页截图 → 网页版/assets/
import os, json, numpy as np
from PIL import Image, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(HERE, '..', '网页版', 'assets'); os.makedirs(OUT, exist_ok=True)
W, H = 1920, 1080; rng = np.random.default_rng(7)

def save(name, im, q=88):
    p = os.path.join(OUT, name); (im.convert('RGB').save(p, quality=q) if name.endswith('.jpg') else im.save(p, optimize=True)); return name

def backdrop(base, glow1, glow2, pos1, pos2, k1, k2, grid=False, bokeh_col=None, seed=1):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32); img = np.zeros((H, W, 3), np.float32) + np.array(base, np.float32)
    for col, (px_, py_), k, r in ((glow1, pos1, k1, 0.55), (glow2, pos2, k2, 0.45)):
        d = np.hypot((x - px_ * W) / W, (y - py_ * H) / W); img += np.array(col, np.float32)[None, None] * (k * np.exp(-(d / r) ** 2))[..., None]
    if grid:                                                       # 很淡的科技网格
        m = ((x % 96) < 1.2) | ((y % 96) < 1.2); img += m[..., None] * 7.0
    if bokeh_col is not None:                                      # 大颗虚化光斑
        lay = Image.new('RGB', (W, H)); from PIL import ImageDraw; dr = ImageDraw.Draw(lay); r_ = np.random.default_rng(seed)
        for _ in range(26):
            cx, cy, rr = r_.uniform(0, W), r_.uniform(0, H), r_.uniform(30, 120); a = r_.uniform(0.15, 0.5)
            dr.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=tuple(int(c * a) for c in bokeh_col))
        img += np.asarray(lay.filter(ImageFilter.GaussianBlur(28)), np.float32) * 0.55
    vig = 1 - 0.55 * np.clip(np.hypot((x - W / 2) / W, (y - H / 2) / H) * 1.25, 0, 1) ** 2; img *= vig[..., None]
    img += rng.normal(0, 5.5, (H, W, 1))                          # 胶片颗粒
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))

L = []
L.append(save('BG_DARK.jpg', backdrop((14, 14, 18), (255, 106, 31), (60, 70, 110), (0.85, 0.15), (0.1, 0.9), 34, 22, grid=True, bokeh_col=(255, 140, 60), seed=2)))
L.append(save('BG_DARK2.jpg', backdrop((12, 12, 16), (255, 120, 40), (255, 80, 30), (0.5, 0.55), (0.5, -0.2), 26, 14, grid=False, bokeh_col=(255, 150, 80), seed=5)))
L.append(save('BG_DREAM.jpg', backdrop((22, 9, 28), (255, 95, 162), (111, 140, 255), (0.8, 0.2), (0.15, 0.85), 46, 34, bokeh_col=(255, 120, 190), seed=3)))
L.append(save('BG_DREAM2.jpg', backdrop((16, 8, 26), (185, 140, 255), (255, 95, 162), (0.5, 0.35), (0.5, 1.1), 40, 30, bokeh_col=(190, 150, 255), seed=4)))
L.append(save('BG_MORNING.jpg', backdrop((24, 18, 22), (255, 190, 120), (255, 95, 162), (0.75, 0.2), (0.1, 0.9), 70, 26, bokeh_col=(255, 200, 150), seed=6)))

# 梦境图（相册里生成的画面）
DREAM = {'D_CROSS': '18d703fc5f5dbb53c7e26472a13f1862.jpg', 'D_GLASS': '506353467a9b567fb9a991ff5ef0647b.jpg', 'D_WEIGHT': '5cf320a84784bbbcd00da830ffbc8bf3.png',
         'D_CUBE': '8d45008446b2828e68989bf958a7a257.jpg', 'D_PARIS': 'a658c57e34c497dc44b6b71ec0883142.jpg', 'D_CONCRETE': 'c7cd539ac1a3a7c1f2d8307eed776e94.png',
         'D_SCIFI': 'f5ca4c8c81a5bd5192d4635297f2f78f.jpg', 'ALBUM_PAGE': '网页设计.png'}
for k, f in DREAM.items():
    im = Image.open(os.path.join(ROOT, '梦境相册网页', f)).convert('RGB'); s = min(1.0, 1800 / max(im.size)); im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    L.append(save(k + '.jpg', im, 90))
ph = Image.open(os.path.join(ROOT, '手机框.png')).convert('RGBA'); L.append(save('PHONE.png', ph))
st = Image.open(os.path.join(ROOT, '23 step studio 主页.png')).convert('RGB'); L.append(save('STUDIO_HOME.jpg', st.resize((2304, 1172), Image.LANCZOS), 92))
pp = Image.open(os.path.join(ROOT, '发布会现场', '03.jpg')).convert('RGB'); pp = pp.resize((pp.width * 1400 // pp.height, 1400), Image.LANCZOS); L.append(save('PASSPORT.jpg', pp, 88))
L = sorted(set(os.listdir(OUT)))
open(os.path.join(HERE, '..', '网页版', 'assets.js'), 'w', encoding='utf-8').write('// 由 代码/assets.py 生成\nwindow.ASSETS = ' + json.dumps(L, ensure_ascii=False) + ';\n')
print('assets', len(L))
