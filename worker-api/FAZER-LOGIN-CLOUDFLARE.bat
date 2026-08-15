@echo off
cd /d "%~dp0"
title Wrangler - Login Cloudflare
echo.
echo  Abrindo login do Cloudflare no navegador...
echo  (Use esta mesma pasta para rodar DEPLOY-WORKER.bat depois)
echo.
call npx.cmd wrangler login
echo.
pause
