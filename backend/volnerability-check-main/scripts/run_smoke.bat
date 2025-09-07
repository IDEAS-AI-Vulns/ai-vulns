@echo off
REM Add venv Python first
set PATH=D:\programowanie\ai-vulns\backend\volnerability-check-main\venv\Scripts;%PATH%
REM Add Poetry
set PATH=C:\Users\Tomek\AppData\Roaming\Python\Scripts;%PATH%
REM Run the vendor script
python scripts\smoke_test.py
