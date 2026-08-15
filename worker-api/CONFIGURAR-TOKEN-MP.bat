@echo off
cd /d "%~dp0"
title Configurar token Mercado Pago no Worker
echo.
echo  Token do Mercado Pago (Worker)
echo  Cole o Access Token quando o comando pedir.
echo.
call npx.cmd wrangler secret put MP_ACCESS_TOKEN
echo.
pause
