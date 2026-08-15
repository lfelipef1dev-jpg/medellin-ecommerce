@echo off
chcp 65001 >nul
cd /d "%~dp0"
REM Deploy da loja (Cloudflare Pages) - usa .env.cloudflare (token e Account ID)
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-auto-vitoria.ps1"
pause
