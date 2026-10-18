"""2026-10-18 节奏精剪：按原口播词边界删除，音频、字幕、画面共用时间映射。

审片时间以 1.1 倍速成片为基准；保留 aligned.json 和源台词以便恢复。
"""
CUT_TEXT = {
    3: ['把STEPX Neo放到了一个完全陌生的环境里，流量告急，', '也'],
    4: ['判断所在的位置和需求，先想办法', '规划路线和', '跨应用协作联系上主人，'],
}


DROP_SHOTS = {16}  # 只删作品介绍前的梦境景物描述；从「为什么要做它」起完整保留

def tighten(shots, pieces, norm, total):
    cuts = []
    keep_indices = {}
    for s in shots:
        if s['i'] in DROP_SHOTS:
            cuts.append((s['start'], s['end'], s['i'], s['text']))
            continue
        keep = list(range(len(s['chars'])))
        # 倒序删文本，确保每次索引仍对应原始逐字时间。
        for phrase in reversed(CUT_TEXT.get(s['i'], [])):
            pos = s['text'].index(phrase)
            first = len(norm(s['text'][:pos]))
            last = first + len(norm(phrase))
            a = s['chars'][first] - 0.04 if first else s['start']
            # 删句尾时连同尾部停顿删除，避免留下空镜等待。
            b = s['chars'][last] - 0.04 if last < len(s['chars']) else s['end']
            assert s['start'] <= a < b <= s['end']
            cuts.append((a, b, s['i'], phrase))
            keep = [i for i in keep if not first <= i < last]
            s['text'] = s['text'][:pos] + s['text'][pos + len(phrase):]
        keep_indices[s['i']] = keep
    shots[:] = [s for s in shots if s['i'] not in DROP_SHOTS]
    cuts.sort()
    assert all(a[1] <= b[0] for a, b in zip(cuts, cuts[1:]))

    def mapped(t):
        return round(t - sum(max(0, min(t, b) - a) for a, b, _, _ in cuts), 3)

    edited_pieces = []
    for src, a0, a1, offset in pieces:
        spans = [(offset, offset + a1 - a0)]
        for a, b, _, _ in cuts:
            spans = [(x, y) for lo, hi in spans
                     for x, y in ((lo, min(hi, a)), (max(lo, b), hi)) if y > x]
        for lo, hi in spans:
            edited_pieces.append([src, round(a0 + lo - offset, 3),
                                  round(a0 + hi - offset, 3), mapped(lo)])
    for s in shots:
        s['chars'] = [mapped(s['chars'][i]) for i in keep_indices[s['i']]]
        for key in ('start', 'vend', 'end', 'promo_pause'):
            if key in s:
                s[key] = mapped(s[key])
        assert len(norm(s['text'])) == len(s['chars'])
    report = [dict(shot=i, text=text, start=round(a, 3), end=round(b, 3),
                   removed=round(b-a, 3)) for a, b, i, text in cuts]
    return edited_pieces, mapped(total), report
