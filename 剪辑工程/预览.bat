@echo off
chcp 65001 >nul
REM Windows：双击打开预览
cd /d "%~dp0.."
git lfs pull
python 剪辑工程\网页版\serve.py
pause
