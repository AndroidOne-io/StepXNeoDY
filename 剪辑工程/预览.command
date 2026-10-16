#!/bin/bash
# Mac：双击打开预览（第一次可能要在「系统设置 → 隐私与安全性」里允许）
cd "$(dirname "$0")/.."
git lfs pull 2>/dev/null
python3 剪辑工程/网页版/serve.py
